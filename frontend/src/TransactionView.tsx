import { useEffect, useState, useRef } from "react";
import QrScanner from "qr-scanner";
import type { Product, Transaction, Supplier } from "./types";
import './components/Inventory.css';
import Inventory from "./components/Inventory";
import Transactions from "./components/Transaction";
import InventoryModal from "./components/InventoryModal";
import TransactionModal from "./components/TransactionModal";

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
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [itemCode, setItemCode] = useState<string>("");
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionTable, setTransactionTable] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<string>("inventory");

  useEffect(() => {
    fetch("/transaction")
      .then(res => res.json())
      .then(data => setTransactionTable(data))
      .catch(error => console.error("Error fetching transactions:", error));
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      const qrScanner = new QrScanner(
        videoRef.current,
        (result) => {
            setItemCode(result.data);
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      setQrScanner(qrScanner);
    }
  }, [videoRef.current]);

  function activateCamera() {
    if (!qrScanner) {
      console.error("QR Scanner is not initialized");
      return;
    }
    if (isCameraRunning) {
      qrScanner.stop();
      setIsCameraRunning(false);
    } else {
      qrScanner.start();
      setIsCameraRunning(true);
    }
  }

  const handleTransactionOpenModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalOpen(true);
  };

  const handleInventoryOpenModal = (product: Product) => {
    setSelectedProduct(product);
    setIsInventoryModalOpen(true);
  };

  const handleInventoryCloseModal = () => {
    setIsInventoryModalOpen(false);
    setIsTransactionModalOpen(false);
    setSelectedProduct(null);
  };

  const handleInventoryComplete = (product: Product, transaction: Transaction) => {
    setProductTable([product, ...productTable.filter(p => p.item_code !== product.item_code)]);
    setTransactionTable([transaction, ...transactionTable]);
    setIsInventoryModalOpen(false);
  };

  const handleTransactionComplete = (product: Product, transaction: Transaction) => {
    setProductTable([product, ...productTable.filter(p => p.item_code !== product.item_code)]);
    setTransactionTable([transaction, ...transactionTable.filter(t => t.id !== transaction.id)]);
    setIsTransactionModalOpen(false);
  };

  const handleTransactionDelete = (product: Product, transaction: Transaction) => {
    setProductTable([product, ...productTable.filter(p => p.item_code !== product.item_code)]);
    setTransactionTable([...transactionTable.filter(t => t.id !== transaction.id)]);
    setIsTransactionModalOpen(false);
  };

  const handleTransactionCloseModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div>
      <h2 className="section-title">📱 QRコードスキャナー</h2>
      <video id="video" muted ref={videoRef}></video>
      <div className="scanner-controls">
        <button
          id="startButton"
          className="btn"
          disabled={isCameraRunning}
          onClick={activateCamera}
        >
          📷 カメラ開始
        </button>
        <button
          id="stopButton"
          className="btn btn-danger"
          disabled={!isCameraRunning}
          onClick={activateCamera}
        >
          ⏹️ 停止
        </button>
      </div>

      <div id="statusMessage"></div>

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
            itemQuery={itemCode}
            placeholder="QRコードで検索..."
            productTable={productTable}
            filter={product => product.item_code.includes(itemCode)}
            setItemQuery={setItemCode}
            handleOpenModal={handleInventoryOpenModal}
          />
        ) : (
          <Transactions
            itemQuery={itemCode}
            placeholder="QRコードで検索..."
            transactionTable={transactionTable}
            filter={transaction => transaction.item_code.includes(itemCode)}
            setItemQuery={setItemCode}
            handleOpenModal={handleTransactionOpenModal}
          />
        )}
      </div>

      <InventoryModal
        isOpen={isInventoryModalOpen}
        onClose={handleInventoryCloseModal}
        product={selectedProduct}
        supplierTable={supplierTable}
        onInventoryComplete={handleInventoryComplete} 
      />
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleTransactionCloseModal}
        transaction={selectedTransaction}
        supplierTable={supplierTable}
        onTransactionComplete={handleTransactionComplete}
        onDelete={handleTransactionDelete}
      />
    </div>
  );
}

export default TransactionView; 