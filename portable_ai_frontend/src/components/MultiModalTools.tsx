import { useState } from "react";

type Props = {
  onVisionCaption: (text: string) => void;
  onVideoExtract: (text: string) => void;
};

const MultiModalTools = ({ onVisionCaption, onVideoExtract }: Props) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const handleImageAnalyze = async () => {
    if (!imageFile) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", imageFile);

    try {
      const res = await fetch("http://localhost:8000/multimodal/analyze-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.caption) onVisionCaption(data.caption);
    } catch (err) {
      console.error("Image captioning error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoExtract = async () => {
    if (!videoUrl.trim()) return;
    setLoading(true);
    setVideoError(null);

    const formData = new FormData();
    formData.append("video_url", videoUrl);

    try {
      const res = await fetch("http://localhost:8000/multimodal/extract-from-video", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.text && data.text.trim()) {
        onVideoExtract(data.text);
      } else {
        setVideoError("No meaningful transcript found.");
      }
    } catch (err) {
      console.error("Video transcription error:", err);
      setVideoError("Transcription failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow space-y-4">
      <div>
        <h2 className="font-semibold">Upload Image</h2>
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        <button
          onClick={handleImageAnalyze}
          disabled={!imageFile || loading}
          className="bg-green-600 text-white px-4 py-1 rounded disabled:opacity-50 ml-2"
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </div>

      <div>
        <h2 className="font-semibold">YouTube Video URL</h2>
        <input
          type="text"
          placeholder="Paste YouTube URL..."
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="border px-2 py-1 rounded w-2/3"
        />
        <button
          onClick={handleVideoExtract}
          disabled={!videoUrl || loading}
          className="bg-purple-600 text-white px-4 py-1 rounded disabled:opacity-50 ml-2"
        >
          {loading ? "Extracting..." : "Extract Text"}
        </button>
        {videoError && <p className="text-red-500 mt-1">{videoError}</p>}
      </div>
    </div>
  );
};

export default MultiModalTools;
