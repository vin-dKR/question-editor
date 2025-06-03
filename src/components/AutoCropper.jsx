import { useState } from "react";
import axios from "axios";

const AutoCropUploader = () => {
  const [file, setFile] = useState(null);
  const [croppedResults, setCroppedResults] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleAutoCrop = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await axios.post(
        "http://localhost:8000/images/auto_crop",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      setCroppedResults(data.cropped_images);
      console.log("Auto-crop results:", data);
    } catch (error) {
      console.error("Auto-crop error:", error);
      alert("Failed to auto-crop the image.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-2">Auto-Crop Scans</h2>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleAutoCrop}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Auto Crop
      </button>

      {croppedResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Cropped Results:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {croppedResults.map((item, idx) => (
              <div key={idx} className="border p-2">
                <p className="text-sm mb-2">{item.filename}</p>
                <img src={item.url} alt={`Cropped ${idx}`} className="max-w-full" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoCropUploader;
