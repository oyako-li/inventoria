import { useState } from "react";
import type { Product } from "./types";
import { QRCodeModal, EditModal } from "./components/InventoryModal";
import Inventory from "./components/Inventory";
import './components/Inventory.css';

interface InventoryViewProps {
    productTable: Product[];
    setProductTable: (products: Product[]) => void;
}

function InventoryView({
  productTable,
  setProductTable,
}: InventoryViewProps) {
  const [itemName, setItemName] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem , setSelectedItem] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenModal = (product: Product) => {
    setSelectedItem(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = () => {
    fetch(`/item/${selectedItem?.item_code}`, {
      method: "DELETE",
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      alert("削除しました。");
      handleCloseModal();
      setProductTable(productTable.filter(product => product.item_code !== selectedItem?.item_code));
      setItemName("");
    });
  };
  
  function addProduct(name: string) {
    const item_name = name.trim();
    if (item_name === "") {
      alert("商品名を入力してください。");
      return;
    }
    fetch("/item/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_name: item_name, updated_by: "admin" }),
    })
    .then(res => res.json())
    .then(newItem => {
      setProductTable([{
          ...newItem,
          current_stock: newItem.item_quantity, // バックエンドからの返却値に合わせる
      }, ...productTable]);
      setItemName(""); // 入力欄をクリア
    })
    .catch(error => {
      console.error("Error adding product:", error);
      alert(`商品追加に失敗しました。${error.message}`);
    });
  }

  const handleEdit = (item: Product) => {
    setSelectedItem(item);
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleEditComplete = (item: Product) => {
    setProductTable([{
      ...item,
      current_stock: item.current_stock,
    }, ...productTable.filter(product => product.item_code !== item.item_code)]);
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div>
      <h2 className="section-title">📦 在庫一覧</h2>
      
      <Inventory
        itemQuery={itemName}
        placeholder="商品名で検索..."
        productTable={productTable}
        filter={product => product.item_name.toLowerCase().includes(itemName.toLowerCase())}
        setItemQuery={setItemName}
        handleOpenModal={handleOpenModal}
      />

      <div style={{ marginTop: "20px", textAlign: "center" }}>  
        <button id="addProduct" className="btn btn-success" onClick={() => addProduct(itemName)}>
          ➕ 新規商品追加
        </button>
      </div>
      
      <QRCodeModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onDelete={handleDelete}
        onEdit={handleEdit}
        item={selectedItem}
      />
      <EditModal
        item={selectedItem}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onEdit={handleEditComplete}
      />
    </div>
  );
}

export default InventoryView; 