// src/components/ImageUploader.js
import { useState } from "react";
import axios from "axios";
import CropperComponent from "./CropperComponent";

const ImageUploader = () => {
  const [imageSrc, setImageSrc] = useState(null);
  const [file, setFile] = useState(null);
  const [cropCoordinates, setCropCoordinates] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);

  // Handle file input and convert to base64 for preview
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setUploadResults(null);
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  // Called when user clicks "Save Crop" in the Cropper
  // Convert react-easy-crop's {x, y, width, height} to {left, top, right, bottom}
  const handleCropSave = (cropData) => {
    const cropObj = {
      left: Math.round(cropData.x),
      top: Math.round(cropData.y),
      right: Math.round(cropData.x + cropData.width),
      bottom: Math.round(cropData.y + cropData.height),
    };
    setCropCoordinates((prev) => [...prev, cropObj]);
    alert("Crop saved! You can add more or finalize the upload.");
  };

  // Upload the file + array of crop coordinates
  const handleUpload = async () => {
    if (!file || cropCoordinates.length === 0) {
      alert("Please select an image and save at least one crop.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("crops", JSON.stringify(cropCoordinates));
    console.log("Sending form data:", formData.get('crops'));
    try {
      const response = await axios.post(
        "http://localhost:8000/images/multicrop",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setUploadResults(response.data);
      alert("Image cropped and uploaded successfully!");
    } catch (error) {
      console.error("Error uploading:", error);
      alert(`Error uploading crops: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4">Upload and Crop Image</h2>

      {/* File Input */}
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-violet-50 file:text-violet-700
                     hover:file:bg-violet-100"
        />
      </div>

      {/* Cropper + Saved Crops + Upload Button */}
      {imageSrc && (
        <div>
          {/* Replace CropperComponent with your React-Easy-Crop logic or any crop tool */}
          <CropperComponent imageSrc={imageSrc} onCropSave={handleCropSave} />

          {cropCoordinates.length > 0 && (
            <div className="bg-gray-100 p-2 rounded mb-4">
              <h4 className="text-lg font-medium mb-2">Saved Crops:</h4>
              <pre className="bg-white p-2 rounded">
                {JSON.stringify(cropCoordinates, null, 2)}
              </pre>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`px-4 py-2 ${
              isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white rounded transition-colors`}
          >
            {isUploading ? "Uploading..." : "Upload Crops"}
          </button>
        </div>
      )}

      {/* Display upload results */}
      {uploadResults && (
        <div className="mt-6 bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-800 mb-2">
            Upload Successful!
          </h3>
          <p className="mb-2">
            Original file:{" "}
            <span className="font-medium">{uploadResults.original_filename}</span>
          </p>
          <p className="mb-2">
            Number of crops:{" "}
            <span className="font-medium">
              {uploadResults.num_crops || uploadResults.crops.length}
            </span>
          </p>

          <div className="mt-4">
            <h4 className="font-medium mb-2">Cropped Images:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {uploadResults.crops.map((crop, index) => (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  <img
                    src={crop.url}
                    alt={`Crop ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-sm">
                    <p className="truncate">{crop.filename}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
