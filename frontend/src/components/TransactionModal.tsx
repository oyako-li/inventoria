import React, { useState, useEffect } from 'react';
import type { ActionType, Transaction, Product, Supplier } from '../types';
import './Inventory.css';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (product: Product, transaction: Transaction) => void;
  transaction: Transaction | null;
  onTransactionComplete: (product: Product, transaction: Transaction) => void;
  supplierTable: Supplier[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, transaction, onTransactionComplete, onDelete, supplierTable }) => {
  const [actionType, setActionType] = useState<ActionType>('in');
  const [quantity, setQuantity] = useState(1);
  const [itemName, setItemName] = useState('');
  const [supplierCode, setSupplierCode] = useState('');
  const [updatedBy, setUpdatedBy] = useState('');
  const [transactionDate, setTransactionDate] = useState('');

  useEffect(() => {
    if (isOpen && transaction) {
      // モーダルが開くときに既存のデータを設定
      setActionType(transaction.action as ActionType);
      setQuantity(Math.abs(transaction.quantity) || 1);
      setItemName(transaction.item_name || '');
      setSupplierCode(transaction.supplier_code || '');
      setUpdatedBy(transaction.updated_by || 'admin');
      setTransactionDate(new Date().toISOString().replace('T', ' '));
    }
  }, [isOpen, transaction]);

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

    const transactionData = {
      id: transaction.id,
      item_code: transaction.item_code,
      item_name: transaction.item_name,
      action: actionType,
      quantity: actionType === 'out' ? -Math.abs(quantity) : Math.abs(quantity),
      supplier_code: supplierCode.trim(),
      updated_by: updatedBy.trim(),
      updated_at: transactionDate,
      price: transaction.price ?? undefined,
    };

    fetch(`/transaction/`, {
      method: 'PUT',
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
        onTransactionComplete(product, {...transactionData, updated_at: product.updated_at});
        onClose();
      })
      .catch(error => {
        console.error('Error:', error);
        alert(`エラーが発生しました: ${error.message}`);
      });
  };

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？この操作は取り消せません。')) {
      fetch(`/transaction/${transaction.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Transaction failed');
        }
        return response.json();
      })
      .then((product: Product) => {
        alert('削除が完了しました。');
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="header">取引編集</h2>
        <div className="modal-info" style={{marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px'}}>
          <p style={{margin: '5px 0', fontSize: '0.9em', color: '#6c757d'}}>商品コード: {transaction.item_code}</p>
          <p style={{margin: '5px 0', fontSize: '0.9em', color: '#6c757d'}}>商品名: {transaction.item_name}</p>
          <p style={{margin: '5px 0', fontSize: '0.9em', color: '#6c757d'}}>最終更新: {transaction.updated_at}</p>
          <p style={{margin: '5px 0', fontSize: '0.9em', color: '#6c757d'}}>作成者: {transaction.updated_by}</p>
        </div>
        <div className="form-group">
          <label htmlFor="actionType">処理種別</label>
          <select
            id="actionType"
            value={actionType}
            onChange={(e) => setActionType(e.target.value as ActionType)}
            className="form-select"
          >
            <option value="in">入庫</option>
            <option value="out">出庫</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="supplierCode">{actionType === 'in' ? '仕入れ先' : '出荷先'}</label>
          <select value={supplierCode} onChange={(e) => setSupplierCode(e.target.value)}>
            <option value="">仕入れ先を選択してください</option>
            {supplierTable.filter(supplier => supplier.supplier_type === actionType).map((supplier) => (
              <option key={supplier.supplier_code} value={supplier.supplier_code}>{supplier.supplier_name}</option>
            ))}
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