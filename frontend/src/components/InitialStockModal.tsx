import React, { useState } from 'react';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';
import { apiPut } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import type { Product } from '../types';

interface InitialStockModalProps {
  isOpen: boolean;
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const InitialStockModal: React.FC<InitialStockModalProps> = ({ isOpen, product, onClose, onSave }) => {
  const { getAuthHeaders, user } = useAuth();
  const isMobile = useResponsive();
  const [initialStock, setInitialStock] = useState<number>(product.item_quantity);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const headers = getAuthHeaders();
    
    apiPut(`/item/${product.item_code}`, {
      item_code: product.item_code,
      item_quantity: initialStock,
      updated_by: user?.name || 'admin'
    }, headers).then(response => {
      if (!response.ok) {
        throw new Error('Initial stock update failed');
      }
      return response.json();
    }).then((product: Product) => {
      onSave(product);
    });
    setIsSubmitting(true);
    // try {
    //   await onSave(product?.item_code || "", initialStock);
    //   onClose();
    // } catch (error) {
    //   console.error('初期在庫更新エラー:', error);
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInitialStock(product.item_quantity);
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">初期在庫設定</h2>
          <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="product-info">
            <h3>{product.item_name}</h3>
            <p>商品コード: {product.item_code}</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="initialStock">初期在庫数 *</label>
                <input
                  id="initialStock"
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value))}
                  // placeholder="0"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </form>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={handleClose} 
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            キャンセル
          </button>
          <button 
            onClick={handleSubmit}
            className="btn btn-success"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InitialStockModal; 