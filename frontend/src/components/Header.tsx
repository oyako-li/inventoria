import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import useResponsive from '../hooks/useResponsive';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const isMobile = useResponsive();

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>
            📦 
            {!isMobile && <span className="title-text">在庫管理システム</span>}
          </h1>
          {!isMobile && <p>QRコードをスキャンして在庫を自動管理</p>}
        </div>
        
        <div className="header-right">
          {user && (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-email">{user.email}</span>
              <button onClick={logout} className="logout-btn">
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 