import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginModal = ({ onClose }) => {
  const { login, authError, isLoading } = useAuth();
  const [processingProvider, setProcessingProvider] = useState(null);

  const handleLogin = async (provider) => {
    setProcessingProvider(provider);
    try {
      await login(provider);
      onClose(); // Close modal after successful login
    } catch (error) {
      console.error(`${provider} login failed:`, error);
    } finally {
      setProcessingProvider(null);
    }
  };

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <div className="auth-modal-header">
          <h2>Connect Wallet</h2>
          <button className="auth-close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="auth-modal-body">
          <p className="auth-description">
            Select a wallet to connect with MyGuard. Your connection allows secure contract analysis.
          </p>
          
          {authError && (
            <div className="auth-error">
              {authError}
            </div>
          )}
          
          <div className="wallet-buttons">
            <button 
              className={`wallet-button ${processingProvider === "Plug" ? "processing" : ""}`}
              onClick={() => handleLogin("Plug")}
              disabled={isLoading}
            >
              <div className="wallet-icon plug-icon"></div>
              <span className="wallet-name">Plug Wallet</span>
              {processingProvider === "Plug" && (
                <span className="loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              )}
            </button>
            
            <button 
              className={`wallet-button ${processingProvider === "Stoic" ? "processing" : ""}`}
              onClick={() => handleLogin("Stoic")}
              disabled={isLoading}
            >
              <div className="wallet-icon stoic-icon"></div>
              <span className="wallet-name">Stoic Wallet</span>
              {processingProvider === "Stoic" && (
                <span className="loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              )}
            </button>
            
            <button 
              className={`wallet-button ${processingProvider === "NFID" ? "processing" : ""}`}
              onClick={() => handleLogin("NFID")}
              disabled={isLoading}
            >
              <div className="wallet-icon nfid-icon"></div>
              <span className="wallet-name">NFID</span>
              {processingProvider === "NFID" && (
                <span className="loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              )}
            </button>
            
            <button 
              className={`wallet-button ${processingProvider === "Identity" ? "processing" : ""}`}
              onClick={() => handleLogin("Identity")}
              disabled={isLoading}
            >
              <div className="wallet-icon identity-icon"></div>
              <span className="wallet-name">Internet Identity</span>
              {processingProvider === "Identity" && (
                <span className="loading-indicator">
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                  <span className="loading-dot"></span>
                </span>
              )}
            </button>
          </div>
          
          <p className="auth-footer">
            Don't have a wallet? Learn about <a href="https://internetcomputer.org/docs/current/developer-docs/build/install-upgrade-remove" target="_blank" rel="noopener noreferrer">Internet Computer wallets</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
