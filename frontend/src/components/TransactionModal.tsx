import React, { useState, useEffect } from 'react';
import type { ActionType, Transaction, Product, Supplier } from '../types';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (product: Product, transaction: Transaction) => void;
  transaction: Transaction | null;
  product: Product | null;
  onTransactionComplete: (product: Product, transaction: Transaction) => void;
  supplierTable: Supplier[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction, product, onTransactionComplete, onDelete, supplierTable }) => {
  const { getAuthHeaders, user } = useAuth();
  const isMobile = useResponsive();
  const [actionType, setActionType] = useState<ActionType>('IN');
  const [quantity, setQuantity] = useState(1);
  const [itemName, setItemName] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [price, setPrice] = useState<number>(0);

  useEffect(() => {
    if (isOpen && transaction) {
      // モーダルが開くときに既存のデータを設定
      setActionType(transaction.action as ActionType);
      setQuantity(Math.abs(transaction.quantity) || 1);
      setItemName(transaction.item_name || '');
      setSupplierCode(transaction.supplier_code || '');
      setUpdatedBy(user?.name || 'admin');
      setPrice(transaction.price || 0);
      // 日付を適切な形式に変換
      if (transaction.updated_at) {
        const date = new Date(transaction.updated_at);
        setTransactionDate(date.toISOString().split('T')[0]);
      } else {
        setTransactionDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, transaction, user]);

  if (!isOpen || !transaction) {
    return null;
  }

  const handleSubmit = () => {
    // バリデーション
    if (!itemName.trim()) {
      alert('商品名を入力してください。');
      return;
    }
    if (quantity <= 0) {
      alert('有効な数量を入力してください。');
      return;
    }
    if (!updatedBy.trim()) {
      alert('更新者を入力してください。');
      return;
    }

    // 選択された取引先の名前を取得
    const selectedSupplier = supplierTable.find(s => s.supplier_code === supplierCode);
    const supplierName = selectedSupplier?.supplier_name || '';

    const transactionData = {
      id: transaction.id,
      item_code: transaction.item_code,
      item_name: itemName.trim(),
      action: actionType,
      quantity: actionType === 'OUT' ? -Math.abs(quantity) : Math.abs(quantity),
      supplier_code: supplierCode.trim() || null,
      supplier_name: supplierName,
      updated_by: updatedBy.trim(),
      updated_at: transactionDate,
      price: price || null,
    };

    const headers = getAuthHeaders();
    fetch(`/transaction/`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(transactionData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction failed');
        }
        return response.json();
      })
              .then((updatedTransaction: Transaction) => {
          console.log('TransactionModal - updatedTransaction:', updatedTransaction);
          console.log('TransactionModal - original transaction:', transaction);
          if (product) {
            onTransactionComplete(product, updatedTransaction);
          }
          onClose();
        })
      .catch(error => {
        console.error('Error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      });
  };

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
      const headers = getAuthHeaders();
      fetch(`/transaction/${transaction.id}`, {
        method: 'DELETE',
        headers,
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction failed');
        }
        return response.json();
      })
      .then((product: Product) => {
        onDelete(product, {...transaction, updated_at: product.updated_at});
        onClose();
      })
      .catch(error => {
        console.error('Error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">取引編集</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="modal-info">
            <div className="info-row">
              <span className="info-label">商品コード:</span>
              <span className="info-value">{transaction.item_code}</span>
            </div>
            <div className="info-row">
              <span className="info-label">商品名:</span>
              <span className="info-value">{transaction.item_name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">最終更新:</span>
              <span className="info-value">{transaction.updated_at}</span>
            </div>
            <div className="info-row">
              <span className="info-label">作成者:</span>
              <span className="info-value">{transaction.updated_by}</span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="actionType">処理種別</label>
              <select
                id="actionType"
                value={actionType}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="form-select"
              >
                <option value="IN">入庫</option>
                <option value="OUT">出庫</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="transactionDate">入出庫日 *</label>
              <input
                id="transactionDate"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="supplierCode">{actionType === 'IN' ? '仕入れ先' : '出荷先'}</label>
              <select 
                value={supplierCode} 
                onChange={(e) => setSupplierCode(e.target.value)}
              >
                <option value="">取引先を選択してください</option>
                {supplierTable.filter(supplier => supplier.supplier_type === actionType).map((supplier) => (
                  <option key={supplier.supplier_code} value={supplier.supplier_code}>{supplier.supplier_name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">数量 *</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="price">単価</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="form-input"
              placeholder="単価を入力"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={handleSubmit} className="btn btn-primary">保存</button>
          <button onClick={handleDelete} className="btn btn-danger">削除</button>
          <button onClick={onClose} className="btn btn-secondary">キャンセル</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;