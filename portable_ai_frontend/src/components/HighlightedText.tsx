interface HighlightedTextProps {
  text: string;
  highlights: string[];
  points?: string[]; // ✅ Added to match props in App.tsx
}

const HighlightedText = ({ text, highlights }: HighlightedTextProps) => {
  if (!highlights.length) return <p>{text}</p>;

  const regex = new RegExp(`(${highlights.join("|")})`, "gi");
  const parts = text.split(regex);

  return (
    <p>
      {parts.map((part, index) =>
        highlights.includes(part) ? (
          <mark key={index} className="bg-yellow-200">{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
};

export default HighlightedText;
