import { useState, useEffect } from 'react';

/**
 * レスポンシブデザイン用のカスタムフック
 * ウィンドウサイズを監視し、モバイル表示かどうかを判定
 * @param breakpoint ブレークポイント（デフォルト: 768px）
 * @returns isMobile - モバイル表示かどうかのboolean値
 */
const useResponsive = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < breakpoint);
    
    // 初回チェック
    checkIfMobile();
    
    // リサイズイベントリスナー
    window.addEventListener('resize', checkIfMobile);
    
    // クリーンアップ
    return () => window.removeEventListener('resize', checkIfMobile);
  }, [breakpoint]);

  return isMobile;
};

export default useResponsive; 