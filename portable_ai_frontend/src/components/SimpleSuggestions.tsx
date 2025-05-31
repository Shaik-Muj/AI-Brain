// Simple test component to verify rendering works

interface SimpleSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

export default function SimpleSuggestions({ onSuggestionClick }: SimpleSuggestionsProps) {
  const suggestions = [
    "What is this document about?",
    "Can you summarize the main points?",
    "What are the key concepts explained?",
    "Tell me more details about this topic"
  ];

  return (
    <div style={{
      backgroundColor: '#e6f3ff',
      border: '3px solid #ff0000', // Red border to make it super obvious
      padding: '20px',
      margin: '20px 0',
      borderRadius: '10px'
    }}>
      <h3 style={{ 
        color: '#ff0000', 
        margin: '0 0 15px 0',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        🔥 TEST SUGGESTIONS (Should be visible!)
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              console.log("CLICKED:", suggestion);
              onSuggestionClick(suggestion);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '12px',
              margin: '8px 0',
              backgroundColor: '#ffffff',
              border: '2px solid #007acc',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f8ff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff';
            }}
          >
            💡 {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
