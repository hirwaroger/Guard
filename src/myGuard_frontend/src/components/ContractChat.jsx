import { useState, useEffect } from 'react';
import { myGuard_backend } from 'declarations/myGuard_backend';

function ContractChat() {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const chatExamples = [
    {
      category: "Contract Analysis",
      prompts: [
        "What makes a clause unfair?",
        "How can I identify risky contract terms?",
        "What should I look for in a rental agreement?"
      ]
    },
    {
      category: "Legal Terms",
      prompts: [
        "What is a force majeure clause?",
        "Explain what indemnification means",
        "What is the difference between warranties and guarantees?"
      ]
    },
    {
      category: "Best Practices",
      prompts: [
        "What should I do before signing a contract?",
        "How do I negotiate better contract terms?",
        "What are common contract pitfalls to avoid?"
      ]
    }
  ];

  const handleChat = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const answer = await myGuard_backend.chat_with_llm(input);
      setResponse(answer);
    } catch (error) {
      setResponse('Error: Failed to get response');
      console.error(error);
    }
    setLoading(false);
  };

  const handleExampleClick = (prompt) => {
    setInput(prompt);
  };

  const renderExamples = () => (
    <div className="examples-section">
      <h3>Try these examples:</h3>
      <div className="examples-list">
        {chatExamples.map(category => (
          <div key={category.category} className="example-category">
            <h4>{category.category}:</h4>
            {category.prompts.map(prompt => (
              <div 
                key={prompt} 
                className="example-item"
                onClick={() => handleExampleClick(prompt)}
              >
                • {prompt}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="contract-chat">
      <h2>Ask the Contract Assistant</h2>
      <form onSubmit={handleChat}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about contracts, legal terms, or clauses..."
          rows="4"
          className="chat-textarea"
        />
        <button 
          type="submit" 
          disabled={loading || !input}
          className="chat-button"
        >
          {loading ? (
            <>Thinking<span className="loading-dots">...</span></>
          ) : (
            'Ask Question'
          )}
        </button>
      </form>

      {renderExamples()}

      {response && (
        <div className="chat-response">
          <h3>Response:</h3>
          <div className="response-content">
            {response.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ContractChat;
