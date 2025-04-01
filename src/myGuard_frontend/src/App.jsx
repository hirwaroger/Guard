import { useState, useEffect, useRef } from 'react';
import { myGuard_backend } from 'declarations/myGuard_backend';

function App() {
  const [contractText, setContractText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Hello! I can help analyze your contracts. Need assistance?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    myGuard_backend.get_dataset_size()
      .then(() => {
        setSystemReady(true);
      })
      .catch(err => {
        console.error("Backend communication error:", err);
        setSystemReady(false);
      });
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  useEffect(() => {
    const accepted = localStorage.getItem('termsAccepted');
    if (accepted) {
      setTermsAccepted(true);
      setShowWelcomeModal(false);
    }
  }, []);

  function handleAnalyzeContract(event) {
    event.preventDefault();
    
    if (!contractText.trim()) {
      alert('Please enter contract text');
      return;
    }
    
    setIsAnalyzing(true);
    
    myGuard_backend.analyze_contract(contractText)
      .then((result) => {
        setAnalysisResult(result);
        setTimeout(() => {
          document.querySelector('.analysis-results')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 200);
      })
      .catch((error) => {
        console.error('Analysis error:', error);
        alert('Error analyzing contract: ' + error.message);
      })
      .finally(() => {
        setIsAnalyzing(false);
      });
  }

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (userInput.trim() === '') return;

    const newUserMessage = { type: 'user', text: userInput };
    setChatMessages([...chatMessages, newUserMessage]);
    
    const userQuestion = userInput.toLowerCase();
    setUserInput('');

    setTimeout(() => {
      let botResponse;
      
      if (userQuestion.includes('help') || userQuestion.includes('how')) {
        botResponse = { 
          type: 'bot', 
          text: 'To analyze a contract, paste your text in the main textarea and click "Analyze Contract". I\'ll identify potentially risky clauses and flag them for your review.' 
        };
      } else if (userQuestion.includes('risky') || userQuestion.includes('risk')) {
        botResponse = { 
          type: 'bot', 
          text: 'Risky clauses might include unfair terms, unclear language, or provisions that heavily favor one party. Our analysis helps identify these potential issues.' 
        };
      } else {
        botResponse = { 
          type: 'bot', 
          text: 'I\'m here to help with contract analysis. Try asking about how to use the tool or what makes a clause risky.'
        };
      }
      
      setChatMessages(prev => [...prev, botResponse]);
    }, 800);
  };

  function getStatusText(label) {
    switch(label) {
      case "Allowed": return "No problem with this";
      case "Not Allowed": return "This is risky";
      case "Unclassified": return "Neutral";
      default: return "";
    }
  }

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setShowWelcomeModal(false);
    localStorage.setItem('termsAccepted', 'true');
  };

  return (
    <div className="app-container">
      {showWelcomeModal && (
        <div className="modal-overlay">
          <div className="welcome-modal">
            <img src="/logo.png" alt="MyGuard Logo" className="modal-logo" />
            <h2>Welcome to MyGuard</h2>
            <p className="modal-description">
              MyGuard is your AI-powered contract analysis assistant. We help you identify potentially risky clauses 
              and provide insights into your legal documents.
            </p>
            <div className="features-grid">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <h3>Smart Analysis</h3>
                <p>AI-powered contract clause analysis</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <h3>Instant Results</h3>
                <p>Get immediate insights and recommendations</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🤖</span>
                <h3>AI Assistant</h3>
                <p>Chat with our AI for guidance</p>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <h3>Secure</h3>
                <p>Your data remains private and secure</p>
              </div>
            </div>
            <div className="terms-section">
              <h4>Terms of Use</h4>
              <div className="terms-content">
                <p>By using MyGuard, you agree to:</p>
                <ul>
                  <li>Use this tool for educational purposes only</li>
                  <li>Not submit sensitive or confidential information</li>
                  <li>Understand that this is not legal advice</li>
                  <li>Accept that results are AI-generated and may require professional review</li>
                </ul>
              </div>
              <label className="terms-checkbox">
                <input 
                  type="checkbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                I accept the terms and conditions
              </label>
            </div>
            <button 
              className="accept-button"
              disabled={!termsAccepted}
              onClick={handleAcceptTerms}
            >
              Get Started
            </button>
          </div>
        </div>
      )}
      
      <header className="app-header">
        <div className="header-content">
          <div className="logo-container">
            <img src="/logo.png" alt="MyGuard Logo" className="logo" />
          </div>
          <div className="brand-container">
            <h1>MyGuard</h1>
            <p className="tagline">AI-Powered Contract Analysis</p>
          </div>
        </div>
      </header>
      
      <main className="content">
        <section className="analyzer-section">
          <h2>Analyze Your Contract</h2>
          
          <div className="privacy-notice">
            <strong>Notice:</strong> For demonstration purposes only. Do not input sensitive information.
          </div>
          
          <form onSubmit={handleAnalyzeContract} className="contract-form">
            <div className="input-container">
              <textarea
                id="contractText"
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
                placeholder="Paste your contract text here..."
                className="contract-textarea"
              ></textarea>
            </div>
            
            <button 
              type="submit" 
              disabled={isAnalyzing || !systemReady} 
              className={`analyze-button ${isAnalyzing ? 'analyzing' : ''}`}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Contract'}
            </button>
          </form>
          
          {analysisResult && (
            <div className="analysis-results">
              <h3>Analysis Results</h3>
              
              <div className="results-summary">
                <div className="summary-card">
                  <div className="summary-value">{analysisResult.total_clauses}</div>
                  <div className="summary-label">Total Clauses</div>
                </div>
                <div className="summary-card safe">
                  <div className="summary-value">{analysisResult.allowed_clauses}</div>
                  <div className="summary-label">Safe Clauses</div>
                </div>
                <div className="summary-card risky">
                  <div className="summary-value">{analysisResult.not_allowed_clauses}</div>
                  <div className="summary-label">Risky Clauses</div>
                </div>
              </div>
              
              {analysisResult.not_allowed_clauses > 0 && (
                <div className="risk-alert">
                  <strong>Attention:</strong> {analysisResult.not_allowed_clauses} potentially risky clause{analysisResult.not_allowed_clauses !== 1 ? 's' : ''} detected
                </div>
              )}
              
              <div className="clause-results">
                <h4>Clause Analysis:</h4>
                <ul className="clause-list">
                  {analysisResult.clause_breakdown.map((item, index) => (
                    <li 
                      key={index}
                      className={`clause-item ${item.label.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className="clause-status">
                        {getStatusText(item.label)}
                      </div>
                      <div className="clause-content">{item.clause}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      </main>
      
      <div className={`chatbot-container ${isChatOpen ? 'open' : ''}`}>
        {isChatOpen ? (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div className="chatbot-title">
                <div className="chatbot-avatar">
                  <img src="/logo2.svg" alt="Assistant" />
                </div>
                <span>Contract Assistant</span>
              </div>
              <button className="chatbot-close" onClick={() => setIsChatOpen(false)}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div key={index} className={`message ${message.type}`}>
                  {message.type === 'bot' && (
                    <div className="message-avatar">
                      <img src="/logo2.svg" alt="Bot" />
                    </div>
                  )}
                  <div className="message-content">
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chatbot-input" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Ask about contract analysis..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />
              <button type="submit">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <button className="chatbot-button" onClick={() => setIsChatOpen(true)}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        )}
      </div>
      
      <footer className="app-footer">
        <p>MyGuard &copy; 2023 | AI-Powered Contract Analysis | Educational purposes only</p>
      </footer>
    </div>
  );
}

export default App;
