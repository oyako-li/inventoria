import { useEffect, useState } from "react";
import "./components/Inventory.css";
import TransactionView from "./TransactionView";
import InventoryView from "./InventoryView";
import SupplierView from "./SupplierView";
import type { Product, Supplier } from "./types";

function App() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [productTable, setProductTable] = useState<Product[]>([]);
  const [supplierTable, setSupplierTable] = useState<Supplier[]>([]);

  const fetchInventory = () => {
    fetch("/inventory/")
      .then((response) => response.json())
      .then((data) => setProductTable(data))
      .catch((error) => console.error("Error fetching product table:", error));
  };

  const fetchSupplier = () => {
    fetch("/supplier/")
      .then((response) => response.json())
      .then((data) => setSupplierTable(data))
      .catch((error) => console.error("Error fetching supplier table:", error));
  };

  useEffect(() => {
    fetchInventory();
    fetchSupplier();
  }, []);


  return (
    <div className="container">
      <div className="header">
        <h1>📦 在庫管理システム</h1>
        <p>QRコードをスキャンして在庫を自動管理</p>
      </div>

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
      </div>

      <div className="main-content">
        {activeTab === "transaction" ? (
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
        ) : (
          <InventoryView
            productTable={productTable}
            setProductTable={setProductTable}
          />
        )}
      </div>

    </div>
  );
}
export default App;
