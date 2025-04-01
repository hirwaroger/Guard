import { useState, useEffect, useRef } from 'react';
import { myGuard_backend } from 'declarations/myGuard_backend';

// Add new TypewriterText component
function TypewriterText({ text, speed = 30, onComplete = () => {} }) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, speed);
      
      return () => clearTimeout(timer);
    } else if (!isComplete) {
      setIsComplete(true);
      onComplete();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  useEffect(() => {
    // Reset when text changes
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return <span>{displayedText}<span className="cursor"></span></span>;
}

function App() {
  const [contractText, setContractText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [systemReady, setSystemReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { type: 'bot', text: 'Hello! I am MyGuard, your AI contract assistant. How can I help you analyze your contracts today?', typing: false }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [clauseExplanations, setClauseExplanations] = useState({});
  const [isExplaining, setIsExplaining] = useState(false);
  const [animatedMessage, setAnimatedMessage] = useState(null);
  const [typingMessageId, setTypingMessageId] = useState(null);

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
    
    const userQuestion = userInput;
    setUserInput('');
    setIsBotTyping(true);

    // Add advanced typing indicator message
    const typingIndicatorId = Date.now();
    setChatMessages(prev => [...prev, { 
      id: typingIndicatorId, 
      type: 'bot-typing', 
      text: '' 
    }]);
    setTypingMessageId(typingIndicatorId);

    const formattedPrompt = `As MyGuard, ${userQuestion}`;
    
    myGuard_backend.chat_with_llm(formattedPrompt)
      .then(response => {
        // Remove typing indicator
        setChatMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));
        setTypingMessageId(null);
        
        // Add message that will be animated with typewriter effect
        const newMessageId = Date.now();
        const botResponse = { 
          id: newMessageId,
          type: 'bot', 
          text: response,
          typing: true
        };
        setChatMessages(prev => [...prev, botResponse]);
        setAnimatedMessage(newMessageId);
      })
      .catch(error => {
        setChatMessages(prev => prev.filter(msg => msg.id !== typingIndicatorId));
        setTypingMessageId(null);
        
        const errorResponse = { 
          type: 'bot', 
          text: `Sorry, I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
          typing: false
        };
        setChatMessages(prev => [...prev, errorResponse]);
      })
      .finally(() => {
        setIsBotTyping(false);
      });
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

  const handleExplainClause = (clause) => {
    if (clauseExplanations[clause]) return;
    
    setIsExplaining(true);
    
    // Add a temporary explanation with loading indicator
    setClauseExplanations(prev => ({
      ...prev,
      [clause]: { loading: true, text: '' }
    }));
    
    const prompt = `As MyGuard, explain simply why this contract clause is risky: "${clause}"`;
    
    myGuard_backend.chat_with_llm(prompt)
      .then(response => {
        setClauseExplanations(prev => ({
          ...prev,
          [clause]: { loading: false, text: response }
        }));
      })
      .catch(error => {
        console.error("Error getting explanation:", error);
        setClauseExplanations(prev => ({
          ...prev,
          [clause]: { loading: false, text: "Sorry, I couldn't generate an explanation for this clause." }
        }));
      })
      .finally(() => {
        setIsExplaining(false);
      });
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
              {isAnalyzing ? (
                <span className="analyzing-text">
                  <span className="dot-animation">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                  </span>
                  <span>Analyzing</span>
                </span>
              ) : 'Analyze Contract'}
            </button>
          </form>
          
          {analysisResult && (
            <div className="analysis-results">
              <h3>Analysis Results</h3>
              
              <div className="results-summary">
                <div className="summary-card">
                  <div className="summary-value">{analysisResult.total_clauses.toString()}</div>
                  <div className="summary-label">Total Clauses</div>
                </div>
                <div className="summary-card safe">
                  <div className="summary-value">{analysisResult.allowed_clauses.toString()}</div>
                  <div className="summary-label">Safe Clauses</div>
                </div>
                <div className="summary-card risky">
                  <div className="summary-value">{analysisResult.not_allowed_clauses.toString()}</div>
                  <div className="summary-label">Risky Clauses</div>
                </div>
              </div>
              
              {analysisResult.not_allowed_clauses > 0 && (
                <div className="risk-alert">
                  <strong>Attention:</strong> {analysisResult.not_allowed_clauses.toString} potentially risky clause{analysisResult.not_allowed_clauses !== 1 ? 's' : ''} detected
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
                        {item.label === "Not Allowed" && (
                          <button 
                            onClick={() => handleExplainClause(item.clause)}
                            className="why-button"
                            disabled={isExplaining || (clauseExplanations[item.clause] && !clauseExplanations[item.clause].loading)}
                          >
                            {clauseExplanations[item.clause]?.loading ? (
                              <span className="button-dots">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                              </span>
                            ) : (clauseExplanations[item.clause] ? "✓" : "Why?")}
                          </button>
                        )}
                      </div>
                      <div className="clause-content">{item.clause}</div>
                      {clauseExplanations[item.clause] && !clauseExplanations[item.clause].loading && (
                        <div className="clause-explanation">
                          <div className="explanation-icon">💡</div>
                          <div className="explanation-text">
                            <TypewriterText 
                              text={clauseExplanations[item.clause].text} 
                              speed={15}
                            />
                          </div>
                        </div>
                      )}
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
                  <img src="/logo.png" alt="Assistant" />
                </div>
                <span>MyGuard Contract Assistant</span>
              </div>
              <button className="chatbot-close" onClick={() => setIsChatOpen(false)}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div key={message.id || index} className={`message ${message.type}`}>
                  {(message.type === 'bot' || message.type === 'bot-typing') && (
                    <div className="message-avatar">
                      <img src="/logo.png" alt="Bot" />
                    </div>
                  )}
                  <div className="message-content">
                    {message.type === 'bot-typing' ? (
                      <div className="typing-indicator">
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                        <span className="typing-dot"></span>
                      </div>
                    ) : message.typing ? (
                      <TypewriterText 
                        text={message.text}
                        onComplete={() => {
                          setChatMessages(prev => 
                            prev.map(msg => 
                              msg.id === message.id ? {...msg, typing: false} : msg
                            )
                          );
                          setAnimatedMessage(null);
                        }}
                      />
                    ) : (
                      message.text
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form className="chatbot-input" onSubmit={handleSendMessage}>
              <textarea
                placeholder="Ask about contract analysis..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                disabled={isBotTyping}
                rows={1}
              />
              <button type="submit" disabled={isBotTyping}>
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </form>
          </div>
        ) : (
          <>
            <button className="chatbot-button" onClick={() => setIsChatOpen(true)}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </button>
          </>
        )}
      </div>
      
      <footer className="app-footer">
        <p>MyGuard &copy; 2025 | AI-Powered Contract Analysis | Educational purposes only</p>
      </footer>
      
      <style jsx>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: #f7fafc;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #2d3748;
        }
        
        .app-header {
          background-color: #2c5282;
          padding: 20px;
          color: white;
          text-align: center;
        }
        
        .header-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }
        
        .brand-container h1 {
          margin: 0;
          font-size: 2.5em;
        }
        
        .brand-container .tagline {
          font-size: 1.2em;
          font-weight: 300;
        }
        
        main.content {
          flex: 1;
          padding: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .welcome-modal {
          background: #fff;
          border-radius: 8px;
          padding: 20px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          margin: 20px auto;
          text-align: center;
        }
        
        /* Improve spacing on the analysis results section */
        .analysis-results {
          margin-top: 30px;
          padding: 20px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Style chatbot container and button for better visual appeal */
        .chatbot-button {
          position: fixed;
          right: 20px;
          bottom: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background-color: #2c5282;
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 100;
        }
        
        .chatbot-button:hover {
          background-color: #3182ce;
          transform: scale(1.05);
        }
        
        /* Responsive adjustments */
        @media (max-width: 600px) {
          .app-header, main.content, .app-footer {
            padding: 10px;
          }
          .brand-container h1 {
            font-size: 1.8em;
          }
        }
        
        .why-button {
          margin-left: 10px;
          padding: 2px 8px;
          background: #5d5d5d;
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: bold;
          cursor: pointer;
          transition: background-color 0.3s;
          min-width: 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        
        .why-button:hover {
          background: #444;
        }
        
        .why-button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        
        .clause-explanation {
          display: flex;
          background: #f5f5f5;
          border-left: 3px solid #ff9800;
          margin-top: 8px;
          padding: 10px;
          border-radius: 4px;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .explanation-icon {
          margin-right: 10px;
          font-size: 16px;
        }
        
        .explanation-text {
          color: #333;
        }
        
        .typing-indicator {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          padding: 8px 0;
        }
        
        .typing-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 4px;
          border-radius: 50%;
          background-color: #999;
          animation: bounce 1.3s linear infinite;
        }
        
        .typing-dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        
        .typing-dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        
        .analyzing-text {
          display: flex;
          align-items: center;
        }
        
        .dot-animation {
          display: inline-block;
          margin-right: 4px;
        }
        
        .dot {
          animation: bounce 1.3s linear infinite;
          display: inline-block;
        }
        
        .dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        
        .dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        
        .button-dots {
          display: flex;
          justify-content: center;
        }
        
        .button-dots .dot {
          width: 4px;
          height: 4px;
          background-color: white;
          border-radius: 50%;
          margin: 0 2px;
          animation: bounce 1.3s linear infinite;
        }
        
        .button-dots .dot:nth-child(2) {
          animation-delay: 0.15s;
        }
        
        .button-dots .dot:nth-child(3) {
          animation-delay: 0.3s;
        }
        
        .cursor {
          display: inline-block;
          width: 3px;
          height: 14px;
          background-color: #333;
          margin-left: 2px;
          animation: blink 1s infinite;
          vertical-align: middle;
        }
        
        .chatbot-input textarea {
          width: calc(100% - 50px);
          min-height: 40px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          resize: vertical;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        .chatbot-input textarea:focus {
          outline: none;
          border-color: #2c5282;
          box-shadow: 0 0 5px rgba(44,82,130,0.5);
        }
        
        @keyframes bounce {
          0%, 60%, 100% {
            transform: translateY(0);
          }
          30% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes blink {
          0%, 49% {
            opacity: 1;
          }
          50%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default App;