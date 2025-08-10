import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';
import InitialStockModal from './InitialStockModal';

// 印刷用のCSSスタイルを追加
const printStyles = `
  @media print {
    * {
      margin: 0 !important;
      padding: 0 !important;
    }
    
    body * {
      visibility: hidden !important;
    }
    
    .print-content, .print-content * {
      visibility: visible !important;
    }
    
    .print-content {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: white !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      text-align: center !important;
    }
    
    .qr-display-container {
      max-width: 250px !important;
    }
    
    .qr-code-container svg {
      width: 120px !important;
      height: 120px !important;
      display: block !important;
      margin: 10px auto !important;
    }
    
    .product-info h3 {
      font-size: 16px !important;
      margin: 10px 0 !important;
    }
    
    .product-info p {
      font-size: 14px !important;
      margin: 5px 0 !important;
    }
    
    .item-code-info {
      margin-top: 10px !important;
    }
    
    .copyable-text {
      font-size: 12px !important;
      word-break: break-all !important;
    }
    
    .copy-hint, .copy-icon {
      display: none !important;
    }
    
    @page {
      size: A4 portrait;
      margin: 0;
    }
  }
`;

interface QRCodeDisplayModalProps {
  product?: {
    item_code: string;
    item_name: string;
    item_quantity: number;
    current_stock?: number;
  };
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

const QRCodeDisplayModal: React.FC<QRCodeDisplayModalProps> = ({ product, isOpen, onClose, onSave }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const isMobile = useResponsive();

  const handleCopyItemCode = async () => {
    if (product?.item_code) {
      try {
        await navigator.clipboard.writeText(product.item_code);
        alert('商品コードをコピーしました');
      } catch (error) {
        console.error('コピーに失敗しました:', error);
        alert('コピーに失敗しました');
      }
    }
  };

  const handleEdit = (product: Product) => {
    // onEdit(product);
    setIsEditModalOpen(true);
  };

  const handlePrint = () => {
    // 印刷用スタイルをheadに追加
    const style = document.createElement('style');
    style.textContent = printStyles;
    document.head.appendChild(style);
    
    window.print();
    
    // 印刷後にスタイルを削除
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  const handleClose = () => {
    setIsEditModalOpen(false);
    onClose();
  };

  if (!isOpen || !product) {
    return null;
  }

  return (
    <>
    <InitialStockModal
      isOpen={isEditModalOpen}
      product={product}
      onClose={handleClose}
      onSave={handleEdit}
    />
    {!isEditModalOpen && (
      <div className="modal-overlay" onClick={handleClose}>
        <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">QRコード</h2>
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>
          
          <div className="modal-body print-content">
            <div className="qr-display-container">
              <div className="product-info">
                <h3>{product.item_name}</h3>
                {product.current_stock !== undefined ? (
                  <p>現在の在庫: {product.current_stock}個</p>
                ) : (
                  <p>現在の在庫: {product.item_quantity}個</p>
                )}
              </div>
              
              <div className="qr-code-container">
                <QRCodeSVG 
                  value={product.item_code}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <div className="item-code-info">
                <p className="item-code-label">商品コード:</p>
                <div className="copyable-text" onClick={handleCopyItemCode}>
                  {product.item_code}
                  <span className="copy-icon">📋</span>
                </div>
                <p className="copy-hint">クリックしてコピー</p>
              </div>
            </div>
          </div>
          
          <div className="modal-actions">
            <button 
              onClick={handlePrint} 
              className="btn btn-success"
            >
              🖨️ 印刷
            </button>
            <button 
              onClick={handleEdit} 
              className="btn btn-primary"
            >
              📝 編集
            </button>
            <button 
              onClick={handleClose} 
              className="btn btn-secondary"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default QRCodeDisplayModal; 