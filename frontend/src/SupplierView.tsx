import { useState } from "react";
import type { Supplier, ActionType, Product } from "./types";
import { useAuth } from "./contexts/AuthContext";
import SupplierTable from "./components/Supplier";
import SupplierModal from "./components/SupplierModal";
import "./components/Inventory.css";

interface SupplierViewProps {
  productTable: Product[];
  supplierTable: Supplier[];
  setSupplierTable: (suppliers: Supplier[]) => void;
}

function SupplierView({ productTable , supplierTable, setSupplierTable}: SupplierViewProps) {
  const { getAuthHeaders } = useAuth();
  const [itemName, setItemName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Supplier | null>(null);
  const [supplierType, setSupplierType] = useState<ActionType>("IN");

  const handleOpenModal = (supplier?: Supplier) => {
    setSelectedItem(supplier || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };



  const handleSupplierComplete = () => {
    // 顧客編集後、最新のデータを取得
    const headers = getAuthHeaders();
    fetch("/supplier/", { headers })
      .then(res => res.json())
      .then(data => setSupplierTable(data))
      .catch(error => console.error("Error fetching suppliers:", error));
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <h2 className="section-title">🚚 顧客一覧</h2>
      <select value={supplierType} onChange={(e) => setSupplierType(e.target.value as ActionType)}>
        <option value="IN">仕入先</option>
        <option value="OUT">出荷先</option>
      </select>

      <SupplierTable
        itemQuery={itemName}
        placeholder="顧客名で検索..."
        supplierTable={supplierTable}
        supplierType={supplierType}
        filter={(supplier) =>
          itemName.trim() !== "" ? supplier.supplier_name.toLowerCase().includes(itemName.toLowerCase()) && supplier.supplier_type === supplierType : supplier.supplier_type === supplierType
        }
        setItemQuery={setItemName}
        handleOpenModal={handleOpenModal}
      />

      <div style={{ marginTop: "20px", textAlign: "center" }}>
        <button
          id="addSupplier"
          className="btn btn-success"
          onClick={() => handleOpenModal()}
        >
          ➕ 新規顧客追加
        </button>
      </div>

      <SupplierModal
        supplier={selectedItem}
        supplierType={supplierType}
        productTable={productTable}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSupplierComplete={handleSupplierComplete}
      />
    </div>
  );
}

export default SupplierView;
