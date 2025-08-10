import React, { useState } from 'react';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (productData: {
    item_name: string;
    description?: string;
    initial_stock?: number;
    supplier_id?: number;
  }) => void;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAdd }) => {
  const isMobile = useResponsive();
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [initialStock, setInitialStock] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!itemName.trim()) {
      alert('商品名を入力してください。');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await onAdd({
        item_name: itemName.trim(),
        description: description.trim() || undefined,
        initial_stock: initialStock > 0 ? initialStock : undefined,
      });
      
      // フォームをリセット
      setItemName('');
      setDescription('');
      setInitialStock(0);
      onClose();
    } catch (error) {
      console.error('商品追加エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setItemName('');
      setDescription('');
      setInitialStock(0);
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
          <h2 className="modal-title">新規商品追加</h2>
          <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="itemName">商品名 *</label>
                <input
                  id="itemName"
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="商品名を入力"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="description">商品説明</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="商品の説明を入力（任意）"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="initialStock">初期在庫数</label>
                <input
                  id="initialStock"
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                  placeholder="0"
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
            disabled={isSubmitting || !itemName.trim()}
          >
            {isSubmitting ? '追加中...' : '商品を追加'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal; 