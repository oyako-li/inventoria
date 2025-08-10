import React, { useState, useEffect } from 'react';
import type { Supplier, Product, ActionType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
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
  const { getAuthHeaders, user } = useAuth();
  const isMobile = useResponsive();
  const [supplierName, setSupplierName] = useState('');
  const [actionType, setActionType] = useState<ActionType>(supplierType);
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierDescription, setSupplierDescription] = useState('');
  const [productCode, setProductCode] = useState('');

  useEffect(() => {
    // モーダルが開くたびにフォームをリセット
    if (isOpen) {
      if (supplier) {
        // 既存のデータを設定
        setSupplierName(supplier.supplier_name || '');
        setActionType((supplier.supplier_type as ActionType) || supplierType);
        setSupplierAddress(supplier.supplier_address || '');
        setSupplierDescription(supplier.supplier_description || '');
      } else {
        // 新規作成時
        setSupplierName('');
        setActionType(supplierType);
        setSupplierAddress('');
        setSupplierDescription('');
      }
    }
  }, [isOpen, supplier, supplierType]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    const supplierData: Supplier = {
      supplier_code: supplier?.supplier_code || '',
      supplier_name: supplierName,
      supplier_type: actionType,
      supplier_address: supplierAddress,
      supplier_description: supplierDescription,
      updated_by: user?.name || 'admin',
      updated_at: supplier?.updated_at || new Date().toISOString(),
    };

    const headers = getAuthHeaders();
    const method = supplier ? 'PUT' : 'POST';
    console.log('Sending supplier data:', supplierData);
    console.log('Method:', method);
    console.log('Headers:', headers);
    fetch('/supplier/', {
      method,
      headers,
      body: JSON.stringify(supplierData),
    })
      .then(response => {
        console.log('Response status:', response.status);
        if (!response.ok) {
          return response.text().then(text => {
            console.error('Error response:', text);
            throw new Error(`Supplier operation failed: ${response.status} - ${text}`);
          });
        }
        return response.json();
      })
      .then((supplier: Supplier) => {
        onSupplierComplete(supplier);
        onClose();
      })
      .catch(error => {
        console.error('Error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      });
  };

  const handleDelete = () => {
    if (!supplier) return;
    if (!window.confirm('本当に削除しますか？')) return;
    const headers = getAuthHeaders();
    fetch(`/supplier/${supplier.supplier_code}`, {
      method: 'DELETE',
      headers,
    })
      .then(response => {
        if (!response.ok) {
          return response.text().then(text => {
            throw new Error(`削除失敗: ${response.status} - ${text}`);
          });
        }
        onSupplierComplete(supplier);
        onClose();
      })
      .catch(error => {
        alert(`削除エラー: ${error.message}`);
      });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{supplier ? '顧客編集' : '新規顧客作成'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {supplier && (
            <div className="modal-info">
              <div className="info-row">
                <span className="info-label">顧客コード:</span>
                <span className="info-value">{supplier.supplier_code}</span>
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label>顧客名</label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>顧客種別</label>
              <select value={actionType} onChange={(e) => setActionType(e.target.value as ActionType)}>
                <option value="IN">仕入先</option>
                <option value="OUT">出荷先</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>顧客住所</label>
            <input
              type="text"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>顧客説明</label>
            <textarea
              value={supplierDescription}
              onChange={(e) => setSupplierDescription(e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>商品</label>
            <select value={productCode} onChange={(e) => setProductCode(e.target.value)}>
              <option value="">商品を選択してください</option>
              {productTable.map((product) => (
                <option key={product.item_code} value={product.item_code}>{product.item_name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-success">保存</button>
          <button onClick={onClose} className="btn">キャンセル</button>
          {supplier && (
            <button onClick={handleDelete} className="btn btn-danger">削除</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierModal; 