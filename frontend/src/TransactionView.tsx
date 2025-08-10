import { useEffect, useState, useRef } from "react";
import QrScanner from "qr-scanner";
import type { Product, Transaction, Supplier } from "./types";
import { useAuth } from "./contexts/AuthContext";
import './components/Inventory.css';
import Inventory from "./components/Inventory";
import Transactions from "./components/Transaction";
import InventoryModal from "./components/InventoryModal";
import TransactionModal from "./components/TransactionModal";
import QRScannerModal from "./components/QRScannerModal";

interface TransactionViewProps {
    productTable: Product[];
    supplierTable: Supplier[];
    setProductTable: (product: Product[]) => void;
}

function TransactionView({
  productTable,
  supplierTable,
  setProductTable,
}: TransactionViewProps) {
  
  const { getAuthHeaders } = useAuth();
  const [itemCode, setItemCode] = useState<string>("");
  const [itemName, setItemName] = useState<string>("");
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isQRScannerModalOpen, setIsQRScannerModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionTable, setTransactionTable] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>("inventory");

  useEffect(() => {
    const headers = getAuthHeaders();
    fetch("/transaction", { headers })
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            // 401エラーの場合はapiRequestでログアウト処理が実行される
            console.warn('Invalid token detected in transaction fetch');
            return;
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data) {
          setTransactionTable(data);
        }
      })
      .catch(error => {
        console.error("Error fetching transactions:", error);
      });
  }, []);

  useEffect(() => {
    // console.log('itemName:', itemName);
    setItemName(itemCode);
  }, [itemCode]);

  const handleQRScan = (scannedItemCode: string) => {
    setItemCode(scannedItemCode);
    // スキャンされたitemCodeに対応する商品を検索
    const foundProduct = productTable.find(product => product.item_code === scannedItemCode);
    if (foundProduct) {
      setSelectedProduct(foundProduct);
      setIsInventoryModalOpen(true);
    } else {
      alert('スキャンされたQRコードに対応する商品が見つかりませんでした。');
    }
  };

  const handleTransactionOpenModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    // 取引に対応する商品を設定
    const correspondingProduct = productTable.find(p => p.item_code === transaction.item_code);
    setSelectedProduct(correspondingProduct || null);
    setIsTransactionModalOpen(true);
  };

  const handleInventoryOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsInventoryModalOpen(true);
  };

  const handleTransactionCloseModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleInventoryCloseModal = () => {
    setIsInventoryModalOpen(false);
    setSelectedProduct(null);
  };

  const handleInventoryComplete = (product: Product, transaction: Transaction) => {

    
    // 取引テーブルを更新（既存の取引を更新するか、新しい取引を追加）
    const existingTransactionIndex = transactionTable.findIndex(t => t.id === transaction.id);
    
    let updatedTransactionTable;
    
    if (existingTransactionIndex >= 0) {
      updatedTransactionTable = transactionTable.map(t => 
        t.id === transaction.id ? transaction : t
      );
    } else {
      // 新しい取引を追加
      updatedTransactionTable = [transaction, ...transactionTable];
    }
    
    setTransactionTable(updatedTransactionTable);
    
    // 更新されたTransactionTableを使用して在庫数を再計算
    recalculateInventoryWithTransactions(transaction.item_code, updatedTransactionTable);
  };

  // 指定されたTransactionTableを使用して在庫数を再計算する関数
  const recalculateInventoryWithTransactions = (itemCode: string, transactions: Transaction[]) => {
    // 該当商品の全取引を取得
    const itemTransactions = transactions.filter(t => t.item_code === itemCode);
    
    // 初期在庫数を取得（商品テーブルから）
    const product = productTable.find(p => p.item_code === itemCode);
    const initialStock = product?.item_quantity || 0;
    
    // 取引履歴から在庫数を計算
    const calculatedStock = itemTransactions.reduce((total, transaction) => {
      return total + transaction.quantity;
    }, initialStock);
    
    // 商品テーブルを更新
    const updatedProductTable = productTable.map(p => 
      p.item_code === itemCode 
        ? { ...p, current_stock: calculatedStock }
        : p
    );
    setProductTable(updatedProductTable);
  };

  // 商品の在庫数を取引履歴から再計算する関数（既存のTransactionTableを使用）
  const recalculateInventory = (itemCode: string) => {
    recalculateInventoryWithTransactions(itemCode, transactionTable);
  };

  return (
    <div>
      <h2 className="section-title">📱 QRコードスキャナー</h2>
      <div className="scanner-controls">
        <button
          className="btn btn-primary"
          onClick={() => setIsQRScannerModalOpen(true)}
        >
          📷 QRコードスキャン開始
        </button>
      </div>

      {itemCode && (
        <div className="scanned-item-info">
          <p>スキャンされた商品コード: <strong>{itemCode}</strong></p>
        </div>
      )}

      <div className="section-title">データ更新</div>
      <div className="section">
        <div className="tab-buttons">
          <button
            id="tabInventory"
            className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("inventory")}
          >
            📦 在庫一覧
          </button>
          <button
            id="tabTransaction"
            className={`tab-btn ${activeTab === "transaction" ? "active" : ""}`}
            onClick={() => setActiveTab("transaction")}
          >
            📋 取引履歴
          </button>
        </div>
        {activeTab === "inventory" ? (
          <Inventory
            itemQuery={itemName}
            placeholder="検索..."
            productTable={productTable}
            filter={(product) => product.item_name.includes(itemName) || product.item_code.includes(itemCode)}
            setItemQuery={(value) => setItemName(value)}
            handleOpenModal={handleInventoryOpenModal}
          />
        ) : (
          <Transactions
            itemQuery={itemName}
            placeholder="検索..."
            transactionTable={transactionTable}
            supplierTable={supplierTable}
            filter={(transaction) => transaction.item_name?.includes(itemName) || transaction.item_code.includes(itemCode)}
            setItemQuery={(value) => setItemName(value)}
            handleOpenModal={handleTransactionOpenModal}
          />
        )}
      </div>

      {/* QRスキャナーモーダル */}
      <QRScannerModal
        isOpen={isQRScannerModalOpen}
        onClose={() => setIsQRScannerModalOpen(false)}
        onScan={handleQRScan}
      />

      {/* 在庫モーダル */}
      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={handleInventoryCloseModal}
        product={selectedProduct}
        supplierTable={supplierTable}
        onInventoryComplete={handleInventoryComplete}
      />

      {/* 取引モーダル */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleTransactionCloseModal}
        transaction={selectedTransaction}
        product={selectedProduct}
        supplierTable={supplierTable}
        onTransactionComplete={handleInventoryComplete}
        onDelete={handleInventoryComplete}
      />
    </div>
  );
}

export default TransactionView; 