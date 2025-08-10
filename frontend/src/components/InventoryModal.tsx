import React, { useState, useEffect } from 'react';
import type { Product, ActionType, Transaction, Supplier } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';
import { apiPost } from '../utils/api';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  supplierTable: Supplier[];
  onInventoryComplete: (product: Product, transaction: Transaction) => void;
}

interface QRCodeModalProps {
  item: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  onEdit: (item: Product) => void;
}

interface EditModalProps {
  item: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (item: Product) => void;
}

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, product, onInventoryComplete, supplierTable }) => {
  const { getAuthHeaders, user } = useAuth();
  const isMobile = useResponsive();
  const [actionType, setActionType] = useState<ActionType>('IN');
  const [quantity, setQuantity] = useState(1);
  const [supplierCode, setSupplierCode] = useState('');

  useEffect(() => {
    // モーダルが開くたびにフォームをリセット
    if (isOpen) {
      setActionType('IN');
      setQuantity(1);
      setSupplierCode('');
    }
  }, [isOpen]);

  if (!isOpen || !product) {
    return null;
  }

  const handleSubmit = () => {
    const transactionData = {
      item_code: product.item_code,
      item_name: product.item_name,
      action: actionType,
      quantity: actionType === 'OUT' ? -quantity : quantity,
      supplier_code: supplierCode || null,
      updated_by: user?.name || 'admin', // ここは後で動的に変更
    };

    const headers = getAuthHeaders();
    apiPost('/transaction/', transactionData, headers).then(response => {
      if (!response.ok) {
        throw new Error('Transaction failed');
      }
      return response.json();
    }).then((transaction: Transaction) => {
      onInventoryComplete(product, transaction);
      onClose();
    });

    // fetch('/transaction/', {
    //   method: 'POST',
    //   headers,
    //   body: JSON.stringify(transactionData),
    // })
    //   .then(response => {
    //     console.log('Response status:', response.status);
    //     if (!response.ok) {
    //       return response.text().then(text => {
    //         console.error('Error response:', text);
    //         throw new Error(`Transaction failed: ${response.status} - ${text}`);
    //       });
    //     }
    //     return response.json();
    //   })
    //   .then((transaction: Transaction) => {
    //     // 商品の在庫数を更新
    //     const updatedProduct = {
    //       ...product,
    //       current_stock: (product.current_stock || 0) + transaction.quantity,
    //       updated_at: transaction.updated_at || new Date().toLocaleString(),
    //       updated_by: transaction.updated_by
    //     };
        
    //     onInventoryComplete(updatedProduct, transaction);
    //     onClose();
    //   })
    //   .catch(error => {
    //     console.error('Error:', error);
    //     alert(`エラーが発生しました: ${error.message}`);
    //   });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">入出庫</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-info">
            <div className="info-row">
              <span className="info-label">商品名:</span>
              <span className="info-value">{product.item_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">現在の在庫:</span>
              <span className="info-value">{product.item_quantity}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>処理種別</label>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as ActionType)}>
                <option value="IN">入庫</option>
                <option value="OUT">出庫</option>
              </select>
            </div>
            <div className="form-group">
              <label>数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label>{actionType === 'IN' ? '仕入れ先' : '出荷先'}</label>
            <select value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)}>
              <option value="">取引先を選択してください</option>
              {supplierTable.filter(supplier => supplier.supplier_type === actionType).map((supplier) => (
                <option key={supplier.supplier_code} value={supplier.supplier_code}>{supplier.supplier_name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-success">保存</button>
          <button onClick={onClose} className="btn">キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ isOpen, onClose, item, onDelete, onEdit }) => {
  const isMobile = useResponsive();
  
  if (!isOpen || !item) {
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = () => {
    if (item) {
      navigator.clipboard.writeText(item.item_code)
        .then(() => alert('品番コードをコピーしました！'))
        .catch(err => console.error('コピーに失敗しました。', err));
    }
  };

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
      onDelete();
    }
  };

  const handleEdit = () => {
    onEdit(item);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">商品QRコード</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="printable-area">
            <div className="qr-info">
              <h3>{item.item_name}</h3>
              <QRCodeSVG value={item.item_code} size={isMobile ? 200 : 256} />
              <p onClick={handleCopy} className="copyable-text" title="クリックしてコピー">{item.item_code}</p>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={handlePrint} className="btn btn-primary">印刷</button>
          <button onClick={handleEdit} className="btn btn-primary">編集</button>
          <button onClick={handleDelete} className="btn btn-danger">削除</button>
          <button onClick={onClose} className="btn">閉じる</button>
        </div>
      </div>
    </div>
  );
};

export const EditModal: React.FC<EditModalProps> = ({ item, isOpen, onClose, onEdit }) => {
  const { getAuthHeaders } = useAuth();
  const isMobile = useResponsive();
  
  if (!isOpen || !item) {
    return null;
  }

  const [itemName, setItemName] = useState(item.item_name);
  const [currentStock, setCurrentStock] = useState(item.current_stock);

  const handleSubmit = () => {
    const updatedItem: Product = {
      ...item,
      item_name: itemName,
      item_quantity: currentStock,
    };
    console.log(updatedItem);
    const headers = getAuthHeaders();
    fetch(`/item/`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updatedItem),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Item update failed');
      }
      return response.json();
    })
    .then((updatedItem: Product) => {
      onEdit(updatedItem);
      onClose();
    })
    .catch(error => {
      console.error('Error:', error);
      alert(`エラーが発生しました: ${error.message}`);
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">商品編集</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-info">
            <div className="info-row">
              <span className="info-label">商品コード:</span>
              <span className="info-value">{item.item_code}</span>
            </div>
          </div>

          <div className="form-group">
            <label>商品名</label>
            <input 
              type="text" 
              value={itemName} 
              onChange={(e) => setItemName(e.target.value)} 
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>在庫数</label>
            <input 
              type="number" 
              value={currentStock} 
              onChange={(e) => setCurrentStock(parseInt(e.target.value))} 
              className="form-input"
            />
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-success">保存</button>
          <button onClick={onClose} className="btn">キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 