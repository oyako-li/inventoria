import React, { useState, useEffect } from 'react';
import type { Supplier, Product, ActionType } from '../types';
import './Inventory.css';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  productTable: Product[];
  supplierType: ActionType;
  onSupplierComplete: (supplier: Supplier) => void;
}


const SupplierModal: React.FC<SupplierModalProps> = ({supplier, isOpen, onClose, onSupplierComplete, productTable, supplierType }) => {
  const [supplierName, setSupplierName] = useState('');
  const [actionType, setActionType] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierDescription, setSupplierDescription] = useState('');
  const [productCode, setProductCode] = useState('');

  useEffect(() => {
    // モーダルが開くたびにフォームをリセット
    if (isOpen) {
      setSupplierName('');
      setActionType(supplierType);
      setSupplierAddress('');
      setSupplierDescription('');
    }
  }, [isOpen]);

  if (!isOpen || !supplier) {
    return null;
  }

  const handleSubmit = () => {
    const supplierData: Supplier = {
      supplier_code: supplier.supplier_code,
      supplier_name: supplierName,
      supplier_type: supplierType,
      supplier_address: supplierAddress,
      supplier_description: supplierDescription,
      updated_by: 'admin', // ここは後で動的に変更
    };

    fetch('/supplier/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(supplierData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction failed');
        }
        return response.json();
      })
      .then((supplier: Supplier) => {
        alert('処理が完了しました。');
        onSupplierComplete(supplier);
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
        <h2 className="header">顧客編集</h2>
        <h3 className="modal-subtitle">顧客コード: {supplier.supplier_code}</h3>

        <div className="form-group">
          <label>顧客名</label>
          <input
            type="text"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="form-input"
          />
          <label>顧客種別</label>
          <select value={actionType} onChange={(e) => setActionType(e.target.value)}>
            <option value="in">仕入先</option>
            <option value="out">出荷先</option>
          </select>
          <label>顧客住所</label>
          <input
            type="text"
            value={supplierAddress}
            onChange={(e) => setSupplierAddress(e.target.value)}
            className="form-input"
          />
          <label>顧客説明</label>
          <textarea
            value={supplierDescription}
            onChange={(e) => setSupplierDescription(e.target.value)}
            className="form-input"
          />
          <label>商品</label>
          <select value={productCode} onChange={(e) => setProductCode(e.target.value)}>
            <option value="">商品を選択してください</option>
            {productTable.map((product) => (
              <option key={product.item_code} value={product.item_code}>{product.item_name}</option>
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

export default SupplierModal; 