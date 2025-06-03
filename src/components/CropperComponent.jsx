// src/components/CropperComponent.js
import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import PropTypes from "prop-types";

const CropperComponent = ({ imageSrc, onCropSave }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [selections, setSelections] = useState([]); // Store all selections

  // Called whenever the user stops dragging or resizing the selection
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle "Save Crop" button click
  const handleSaveCrop = () => {
    if (croppedAreaPixels) {
      // Add the current selection to the list with a unique ID
      const newSelection = {
        ...croppedAreaPixels,
        id: Date.now(),
      };
      setSelections(prev => [...prev, newSelection]);
      onCropSave(croppedAreaPixels);
    }
  };

  return (
    <div className="relative w-full h-[500px] mb-8">
      <div className="relative h-full bg-gray-200 rounded-lg overflow-hidden">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={undefined} // Allow free-form cropping without aspect ratio constraint
          onCropChange={setCrop}
          onCropComplete={onCropComplete}
          onZoomChange={setZoom}
          objectFit="contain"
          minZoom={0.5}
          maxZoom={3}
          cropShape="rect"
          showGrid={true}
          restrictPosition={false} // Allow the crop area to move outside the image boundaries
          disableAutomaticStylesInjection={false}
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: '#262626',
            },
            cropAreaStyle: {
              border: '2px solid #2563eb', // Blue border for active selection
              color: 'rgba(37, 99, 235, 0.5)',
            },
            mediaStyle: {
              backgroundColor: '#262626',
            },
          }}
        />

        {/* Overlay to show existing selections */}
        {selections.map((selection, index) => (
          <div
            key={selection.id}
            style={{
              position: 'absolute',
              border: '2px solid #10b981', // Green border for saved selections
              background: 'rgba(16, 185, 129, 0.1)',
              left: `${selection.x}`,
              top: `${selection.y}`,
              width: `${selection.width}`,
              height: `${selection.height}`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <span className="absolute -top-6 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded">
              Selection {index + 1}
            </span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-4">
        <div className="flex items-center gap-2 flex-1 w-full">
          <label className="text-sm text-gray-600 whitespace-nowrap">Zoom:</label>
          <input
            type="range"
            value={zoom}
            min={0.5}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          {selections.length > 0 && (
            <button
              onClick={() => setSelections([])}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleSaveCrop}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Selection
          </button>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium mb-2 text-blue-800">Instructions</h3>
        <ul className="list-disc pl-5 text-sm text-blue-700 space-y-1">
          <li>Drag the image to position it</li>
          <li>Use the zoom slider to zoom in/out</li>
          <li>Drag the corners or edges of the selection box to resize it</li>
          <li>Click &quot;Add Selection&quot; when you&apos;re happy with your crop</li>
        </ul>
      </div>

      {/* Show list of selections */}
      {selections.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Selections ({selections.length})</h3>
          <div className="space-y-2">
            {selections.map((selection, index) => (
              <div key={selection.id} className="flex items-center justify-between bg-white p-2 rounded">
                <span>Selection {index + 1}: {Math.round(selection.x)},{Math.round(selection.y)} - {Math.round(selection.width)}x{Math.round(selection.height)}</span>
                <button
                  onClick={() => setSelections(prev => prev.filter(s => s.id !== selection.id))}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

CropperComponent.propTypes = {
  imageSrc: PropTypes.string.isRequired,
  onCropSave: PropTypes.func.isRequired
};

export default CropperComponent;
