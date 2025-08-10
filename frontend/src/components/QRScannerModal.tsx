import React, { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import useResponsive from '../hooks/useResponsive';
import './Inventory.css';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (itemCode: string) => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const isMobile = useResponsive();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [qrScanner, setQrScanner] = useState<QrScanner | null>(null);
  const [isCameraRunning, setIsCameraRunning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('カメラを開始してください');

  useEffect(() => {
    if (isOpen && videoRef.current) {
      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          setScanStatus('QRコードを読み取りました！');
          onScan(result.data);
          onClose();
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );
      setQrScanner(scanner);
    }

    return () => {
      if (qrScanner) {
        qrScanner.destroy();
        setQrScanner(null);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && qrScanner) {
      qrScanner.start();
      setIsCameraRunning(true);
      setScanStatus('カメラが開始されました。QRコードをスキャンしてください。');
    } else if (qrScanner) {
      qrScanner.stop();
      setIsCameraRunning(false);
    }
  }, [isOpen, qrScanner]);

  const handleClose = () => {
    if (qrScanner) {
      qrScanner.stop();
      setIsCameraRunning(false);
    }
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className={`modal-content ${isMobile ? 'modal-mobile' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">QRコードスキャナー</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="scanner-container">
            <video 
              ref={videoRef} 
              className="scanner-video"
              muted
            />
            {/* <div className="scanner-overlay">
              <div className="scan-region"></div>
            </div> */}
            <div className="scanner-status">
              <p>{scanStatus}</p>
            </div>
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            onClick={handleClose} 
            className="btn btn-secondary"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal; 