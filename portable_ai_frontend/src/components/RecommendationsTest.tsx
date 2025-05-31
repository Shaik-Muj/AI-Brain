import { useState } from "react";

export default function RecommendationsTest() {
  const [query, setQuery] = useState("");
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const fetchRecommendations = async () => {
    if (!query.trim()) return;
    
    try {
      console.log("Fetching recommendations for:", query);
      const res = await fetch("http://localhost:8000/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const data = await res.json();
      console.log("Recommendations response:", data);
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: "white", 
      zIndex: 9999,
      padding: "2rem"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Recommendations Test</h1>
      
      <div>
        <input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter query for recommendations"
          style={{ padding: "0.5rem", width: "100%", marginBottom: "1rem" }}
        />
        
        <button 
          onClick={fetchRecommendations}
          style={{ 
            padding: "0.5rem 1rem", 
            backgroundColor: "blue", 
            color: "white",
            cursor: "pointer"
          }}
        >
          Get Recommendations
        </button>
      </div>
      
      {recommendations.length > 0 && (
        <div style={{ marginTop: "2rem" }}>
          <h2>Recommendations:</h2>
          <ul>
            {recommendations.map((rec, index) => (
              <li key={index} style={{ margin: "0.5rem 0", color: "blue" }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
