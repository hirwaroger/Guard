import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfileMenu = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Format principal ID to be shorter for display
  const formatPrincipal = (principal) => {
    if (!principal) return '';
    return principal.length > 12 
      ? `${principal.substring(0, 6)}...${principal.substring(principal.length - 6)}`
      : principal;
  };

  return (
    <div className="user-profile">
      <button 
        className="profile-button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <div className="user-avatar">
          <span>{user?.provider?.charAt(0) || '?'}</span>
        </div>
        <span className="user-principal">{formatPrincipal(user?.principal)}</span>
      </button>
      
      {isMenuOpen && (
        <div className="profile-dropdown">
          <div className="dropdown-header">
            <div className="provider-info">
              <span className="provider-label">Connected with</span>
              <span className="provider-name">{user?.provider}</span>
            </div>
          </div>
          <div className="dropdown-content">
            <div className="principal-display">
              <span className="principal-label">Principal ID</span>
              <span className="principal-value">{user?.principal}</span>
            </div>
          </div>
          <div className="dropdown-footer">
            <button className="logout-button" onClick={logout}>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileMenu;
