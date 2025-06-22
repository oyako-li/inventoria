import React, { useState, useEffect } from 'react';
import type { Product, ActionType, Transaction, Supplier } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import './Inventory.css';

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
  const [actionType, setActionType] = useState<ActionType>('in');
  const [quantity, setQuantity] = useState(1);
  const [code, setCode] = useState('');

  useEffect(() => {
    // モーダルが開くたびにフォームをリセット
    if (isOpen) {
      setActionType('in');
      setQuantity(1);
      setCode('');
    }
  }, [isOpen]);

  if (!isOpen || !product) {
    return null;
  }

  const handleSubmit = () => {
    const transactionData: Transaction = {
      item_code: product.item_code,
      item_name: product.item_name,
      action: actionType,
      quantity: actionType === 'out' ? -quantity : quantity,
      supplier_code: code,
      updated_by: 'admin', // ここは後で動的に変更
    };

    fetch('/transaction/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transactionData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction failed');
        }
        return response.json();
      })
      .then((product: Product) => {
        alert('処理が完了しました。');
        onInventoryComplete(product, {...transactionData, updated_at: new Date().toLocaleString()});
        onClose();
      })
      .catch(error => {
        console.error('Error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="header">入出庫</h2>
        <h3 className="modal-title">{product.item_name}</h3>
        <p className="modal-subtitle">現在の在庫: {product.current_stock}</p>

        <div className="form-group">
          <select value={actionType} onChange={(e) => setActionType(e.target.value as ActionType)}>
            <option value="in">入庫</option>
            <option value="out">出庫</option>
          </select>
          <label>数量</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            className="form-input"
          />
          <label>{actionType === 'in' ? '仕入れ先' : '出荷先'}</label>
          <select value={code} onChange={(e) => setCode(e.target.value)}>
            {supplierTable.filter(supplier => supplier.supplier_type === actionType).map((supplier) => (
              <option key={supplier.supplier_code} value={supplier.supplier_code}>{supplier.supplier_name}</option>
            ))}
          </select>
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="printable-area">
          <h2 className="header">商品QRコード</h2>
          <p style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#333' }}>{item.item_name}</p>
          <QRCodeSVG value={item.item_code} size={256} />
          <p onClick={handleCopy} className="copyable-text" title="クリックしてコピー" style={{ cursor: 'pointer', color: 'blue' }}>{item.item_code}</p>
        </div>
        <div className="modal-actions">
          <button onClick={handlePrint} className="btn btn-primary">印刷</button>
          <button onClick={onClose} className="btn">閉じる</button>
          <button onClick={handleDelete} className="btn btn-danger">削除</button>
          <button onClick={handleEdit} className="btn btn-primary">編集</button>
        </div>
      </div>
    </div>
  );
};


export const EditModal: React.FC<EditModalProps> = ({ item, isOpen, onClose, onEdit }) => {
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
    fetch(`/item/`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedItem),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Item update failed');
      }
      return response.json();
    })
    .then((updatedItem: Product) => {
      alert('商品情報が更新されました。');
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h1 className="header">商品編集</h1>
        <p className="modal-subtitle">商品コード: {item.item_code}</p>
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
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-success">保存</button>
          <button onClick={onClose} className="btn">キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal; 