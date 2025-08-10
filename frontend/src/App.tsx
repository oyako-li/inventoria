import { useEffect, useState } from "react";
import "./components/Inventory.css";
import "./components/Auth.css";
import TransactionView from "./TransactionView";
import InventoryView from "./InventoryView";
import SupplierView from "./SupplierView";
import Header from "./components/Header";
import TeamSelector from "./components/TeamSelector";
import ProtectedRoute from "./components/ProtectedRoute";
import EnvironmentInfo from "./components/EnvironmentInfo";
import { useAuth } from "./contexts/AuthContext";
import { apiGet } from "./utils/api";
import type { Product, Supplier } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [productTable, setProductTable] = useState<Product[]>([]);
  const [supplierTable, setSupplierTable] = useState<Supplier[]>([]);
  const { isAuthenticated, teams } = useAuth();

  const { getAuthHeaders } = useAuth();

  const fetchInventory = () => {
    const headers = getAuthHeaders();
    console.log("fetchInventory headers:", headers);
    if (!headers['X-Team-ID']) {
      console.log("チームが選択されていません");
      return;
    }
    apiGet("/inventory/", headers)
      .then((response) => {
        console.log("fetchInventory response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setProductTable(data))
      .catch((error) => console.error("Error fetching product table:", error));
  };

  const fetchSupplier = () => {
    const headers = getAuthHeaders();
    console.log("fetchSupplier headers:", headers);
    if (!headers['X-Team-ID']) {
      console.log("チームが選択されていません");
      return;
    }
    apiGet("/supplier/", headers)
      .then((response) => {
        console.log("fetchSupplier response status:", response.status);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setSupplierTable(data))
      .catch((error) => console.error("Error fetching supplier table:", error));
  };

  const { currentTeam } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      // 認証テスト
      const headers = getAuthHeaders();
      apiGet("/api/auth/test", headers)
        .then((response) => {
          console.log("Auth test response status:", response.status);
          if (response.ok) {
            return response.json();
          }
          throw new Error(`Auth test failed: ${response.status}`);
        })
        .then((data) => {
          console.log("Auth test data:", data);
          fetchInventory();
          fetchSupplier();
        })
        .catch((error) => {
          console.error("Auth test error:", error);
        });
    }
  }, [isAuthenticated, currentTeam]);


  return (
    <ProtectedRoute>
    <div className="container">
        <Header />
        <EnvironmentInfo />

      <div className="tab-buttons">
        <button
          id="tabInventory"
          className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          📦 在庫管理
        </button>
        <button
          id="tabTransaction"
          className={`tab-btn ${activeTab === "transaction" ? "active" : ""}`}
          onClick={() => setActiveTab("transaction")}
        >
          📋 入出庫管理
        </button>
        <button
          id="tabSupplier"
          className={`tab-btn ${activeTab === "supplier" ? "active" : ""}`}
          onClick={() => setActiveTab("supplier")}
        >
          🚚 仕入先管理
        </button>
        <button
          id="tabTeam"
          className={`tab-btn ${activeTab === "team" ? "active" : ""}`}
          onClick={() => setActiveTab("team")}
        >
          👥 チーム管理
        </button>
      </div>

      <div className="main-content">
        {!currentTeam && teams.length > 0 ? (
          <div className="team-selection-notice">
            <h3>チームを選択してください</h3>
            <p>データを表示するには、チーム管理タブでチームを選択してください。</p>
          </div>
        ) : activeTab === "transaction" ? (
          <TransactionView
            productTable={productTable}
            supplierTable={supplierTable}
            setProductTable={setProductTable}
          />
        ) : activeTab === "supplier" ? (
          <SupplierView
            productTable={productTable}
            supplierTable={supplierTable}
            setSupplierTable={setSupplierTable}
          />
        ) : activeTab === "team" ? (
          <TeamSelector />
        ) : (
          <InventoryView
            productTable={productTable}
            setProductTable={setProductTable}
          />
        )}
      </div>

    </div>
    </ProtectedRoute>
  );
}
export default App;
