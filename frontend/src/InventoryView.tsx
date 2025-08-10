import { useEffect, useState } from "react";
import type { Product } from "./types";
import { useAuth } from "./contexts/AuthContext";
import './components/Inventory.css';
import Inventory from "./components/Inventory";
import InventoryModal from "./components/InventoryModal";
import AddProductModal from "./components/AddProductModal";
import QRCodeDisplayModal from "./components/QRCodeDisplayModal";
import { apiGet, apiPost } from "./utils/api";

interface InventoryViewProps {
    productTable: Product[];
    setProductTable: (products: Product[]) => void;
}

function InventoryView({
  productTable,
  setProductTable,
}: InventoryViewProps) {
  const { getAuthHeaders, user } = useAuth();
  const [itemName, setItemName] = useState("");
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isQRCodeModalOpen, setIsQRCodeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleOpenQRCodeModal = (product: Product) => {
    setSelectedItem(product);
    setIsQRCodeModalOpen(true);
  };

  const handleDelete = () => {
    const headers = getAuthHeaders();
    fetch(`/item/${selectedItem?.item_code}`, {
      method: "DELETE",
      headers,
    })
    .then(res => res.json())
    .then(data => {
      console.log(data);
      // handleCloseModal();
      setProductTable(productTable.filter(product => product.item_code !== selectedItem?.item_code));
      setItemName("");
    });
  };

  const handleAddProduct = async (productData: {
    item_name: string;
    description?: string;
    item_quantity?: number;
    supplier_id?: number;
  }) => {
    const headers = getAuthHeaders();
    
    try {
      const response = await apiPost("/item/", {
        item_name: productData.item_name,
        description: productData.description,
        item_quantity: productData.item_quantity,
        updated_by: user?.name || 'admin'
      }, headers);

      if (response.ok) {
        const newItem = await response.json();
        setProductTable([{
          ...newItem,
          item_quantity: newItem.item_quantity || productData.item_quantity || 0,
        }, ...productTable]);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '商品追加に失敗しました');
      }
    } catch (error) {
      console.error("Error adding product:", error);
      alert(`商品追加に失敗しました。${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleEditComplete = (product: Product) => {
    setProductTable(productTable.map(p => p.item_code === product.item_code ? product : p));
    setIsQRCodeModalOpen(false);
    setSelectedItem(null);
  //   // 商品編集後、最新の在庫一覧を取得
  //   const headers = getAuthHeaders();
  //   apiGet(`/inventory/${product.item_code}`, headers).then(response => {
  //     if (!response.ok) {
  //       throw new Error('Inventory fetch failed');
  //     }
  //     return response.json();
  //   }).then((data: Product) => {
  //     setProductTable(productTable.map(p => p.item_code === data.item_code ? data : p));
  //   });
  //   // fetch("/inventory/", { headers })
  //   //   .then(res => res.json())
  //   //   .then(data => setProductTable(data))
  //   //   .catch(error => console.error("Error fetching product table:", error));
  //   setIsEditModalOpen(false);
  //   setSelectedItem(null);
  };

  // const handleCloseEditModal = () => {
  //   setIsEditModalOpen(false);
  //   setSelectedItem(null);
  // };

  return (
    <div>
      <h2 className="section-title">📦 在庫一覧</h2>
      
      <Inventory
        itemQuery={itemName}
        placeholder="商品名で検索..."
        productTable={productTable}
        filter={product => product.item_name.toLowerCase().includes(itemName.toLowerCase())}
        setItemQuery={setItemName}
        handleOpenModal={handleOpenQRCodeModal}
      />

      <div style={{ marginTop: "20px", textAlign: "center" }}>  
        <button 
          className="btn btn-success" 
          onClick={() => setIsAddProductModalOpen(true)}
        >
          ➕ 新規商品追加
        </button>
      </div>
      
      {/* 新規商品追加モーダル */}
      <AddProductModal
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onAdd={handleAddProduct}
      />
      
      {/* QRコード表示モーダル */}
      {selectedItem && (
        <QRCodeDisplayModal
          product={selectedItem}
          isOpen={isQRCodeModalOpen}
          onClose={() => {
            setIsQRCodeModalOpen(false);
            // setSelectedItem(null);
          }}
          onSave={handleEditComplete}
        />
      )}
    </div>
  );
}

export default InventoryView; 