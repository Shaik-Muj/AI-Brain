import React, { useState } from 'react';

interface RecommendationButtonProps {
  query?: string;
  context?: string;
  pdfId?: string;
}

const RecommendationButton: React.FC<RecommendationButtonProps> = ({ 
  query = "AI technology and data processing",
  context = "",
  pdfId = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [error, setError] = useState('');

  const getRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch("http://localhost:8000/pdf/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query,
          context,
          pdf_id: pdfId // Include PDF ID to get content-specific recommendations
        })
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={getRecommendations}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-full shadow-lg text-lg"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Get Suggestions'}
      </button>
      
      {recommendations.length > 0 && (
        <div className="absolute bottom-16 right-0 w-80 bg-white p-4 rounded-lg shadow-xl border border-gray-300">
          <h3 className="font-bold text-lg mb-2">Suggested Questions:</h3>
          <ul className="space-y-2">
            {recommendations.map((rec, idx) => (
              <li 
                key={idx}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded cursor-pointer"
                onClick={() => {
                  // Here you could set this as the current question
                  console.log("Selected:", rec);
                  // Close the recommendations panel
                  setRecommendations([]);
                }}
              >
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-16 right-0 w-64 bg-red-50 p-3 rounded-lg shadow-lg border border-red-300">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
    </div>
  );
};

export default RecommendationButton;
