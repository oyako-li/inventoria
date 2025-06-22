import { useState } from "react";
import type { Supplier, ActionType, Product } from "./types";
import SupplierTable from "./components/Supplier";
import SupplierModal from "./components/SupplierModal";
import "./components/Inventory.css";

interface SupplierViewProps {
  productTable: Product[];
  supplierTable: Supplier[];
  setSupplierTable: (suppliers: Supplier[]) => void;
}

function SupplierView({ productTable , supplierTable, setSupplierTable}: SupplierViewProps) {
  const [itemName, setItemName] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Supplier | null>(null);
  const [supplierType, setSupplierType] = useState<ActionType>("in");

  const handleOpenModal = (supplier: Supplier) => {
    setSelectedItem(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  // const handleDelete = () => {
  //   fetch(`/supplier/${selectedItem?.supplier_code}`, {
  //     method: "DELETE",
  //   })
  //   .then(res => res.json())
  //   .then(data => {
  //     console.log(data);
  //     alert("削除しました。");
  //     handleCloseModal();
  //     setSupplierTable(supplierTable.filter(supplier => supplier.supplier_code !== selectedItem?.supplier_code));
  //     setItemName("");
  //   });
  // };

  function addSupplier(name: string) {
    const item_name = name.trim();
    if (item_name === "") {
      alert("商品名を入力してください。");
      return;
    }
    fetch("/supplier/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        supplier_name: item_name,
        supplier_type: supplierType,
        updated_by: "admin",
      }),
    })
      .then((res) => res.json())
      .then((newItem) => {
        console.log(newItem);
        setSupplierTable([newItem, ...supplierTable]);
        setItemName(""); // 入力欄をクリア
      })
      .catch((error) => {
        alert(`顧客追加に失敗しました。${error.message}`);
      });
  }

  const handleSupplierComplete = (item: Supplier) => {
    setSupplierTable([
      {
        ...item,
      },
      ...supplierTable.filter(
        (supplier) => supplier.supplier_code !== item.supplier_code
      ),
    ]);
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <h2 className="section-title">🚚 顧客一覧</h2>
      <select value={supplierType} onChange={(e) => setSupplierType(e.target.value as ActionType)}>
        <option value="in">仕入先</option>
        <option value="out">出荷先</option>
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
          onClick={() => addSupplier(itemName)}
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
