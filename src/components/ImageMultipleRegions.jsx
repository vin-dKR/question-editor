import { useState, useRef, useEffect, useCallback } from "react";
import DraggableBox from './DraggableBox';
import QuestionEditor from './QuestionEditor';
import useUnsavedChanges from '../hooks/useUnsavedChanges';
import { cropAndUploadImage } from '../utils/imageUpload';
import { fetchQuestions, updateQuestion, prepareQuestionUpdateData } from '../services/questionService';
import toast, { Toaster } from 'react-hot-toast';

const ImageMultipleRegions = ({ onImageSelect, onBoxesChange, question, onQuestionChange }) => {
    // File + local preview
    const [selectedImage, setSelectedImage] = useState(null);
    const [fileName, setFileName] = useState("");
    const [imageSrc, setImageSrc] = useState(null);

    // Data from API
    const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
    const { data: questions, hasUnsavedChanges, updateData: updateQuestions, saveChanges: saveQuestions } = useUnsavedChanges([]);
    // console.log(...questions, "quesions")

    // Bounding boxes
    const [boxes, setBoxes] = useState([]);
    const [previewMap, setPreviewMap] = useState({});
    const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });

    const imageRef = useRef(null);
    const offscreenCanvasRef = useRef(document.createElement("canvas"));

    // Upload progress
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const [selectedImages, setSelectedImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [fileNames, setFileNames] = useState([]);

    // Fetch questions when fileName changes
    useEffect(() => {
        const loadQuestions = async () => {
            if (!fileName) return;
            setIsLoadingQuestions(true);
            try {
                const fetchedQuestions = await fetchQuestions(fileName);
                console.log("filename----", fileName)
                console.log("data", fetchedQuestions)
                updateQuestions(fetchedQuestions);
            } catch (error) {
                console.error("Error fetching questions:", error);
                alert("Error fetching questions:", error);
            } finally {
                setIsLoadingQuestions(false);
            }
        };
        loadQuestions();
    }, [fileName, updateQuestions]);

    // Handle file selection
    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const imageUrls = files.map(file => URL.createObjectURL(file));
            const names = files.map(file => file.name);
            setSelectedImages(imageUrls);
            setFileNames(names);
            setCurrentImageIndex(0);
            setSelectedImage(imageUrls[0]);
            setFileName(names[0]);
        }
    };

    const handleImageLoad = (e) => {
        const { naturalWidth, naturalHeight } = e.currentTarget;
        setNaturalSize({ width: naturalWidth, height: naturalHeight });
    };

    const updateBox = (id, newProps) => {
        setBoxes((prev) =>
            prev.map((box) => (box.id === id ? { ...box, ...newProps } : box))
        );
    };

    // Generate local previews of each bounding box
    const generateLocalPreviews = useCallback(() => {
        if (!imageRef.current || !imageSrc) return;

        const rect = imageRef.current.getBoundingClientRect();
        const displayW = rect.width;
        const displayH = rect.height;

        const scaleX = naturalSize.width / displayW;
        const scaleY = naturalSize.height / displayH;

        const previewImage = new Image();
        previewImage.src = imageSrc;

        previewImage.onload = () => {
            const offscreen = offscreenCanvasRef.current;
            const ctx = offscreen.getContext("2d");

            const newPreviewMap = {};

            const updatedBoxes = boxes.map((box) => {
                const left = box.x * scaleX;
                const top = box.y * scaleY;
                const width = box.width * scaleX;
                const height = box.height * scaleY;

                offscreen.width = width;
                offscreen.height = height;
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(
                    previewImage,
                    left,
                    top,
                    width,
                    height,
                    0,
                    0,
                    width,
                    height
                );

                const dataUrl = offscreen.toDataURL("image/png");
                if (box.name) {
                    newPreviewMap[box.name] = dataUrl;
                }
                return { ...box, preview: dataUrl };
            });

            setBoxes(updatedBoxes);
            setPreviewMap((old) => ({ ...old, ...newPreviewMap }));
        };
    }, [boxes, imageSrc, naturalSize.height, naturalSize.width]);

    useEffect(() => {
        if (boxes.length > 0) {
            generateLocalPreviews();
        }
    }, [boxes, generateLocalPreviews]);

    const resetState = () => {
        setSelectedImage(null);
        setFileName("");
        setImageSrc(null);
        setBoxes([]);
        setPreviewMap({});
        setNaturalSize({ width: 0, height: 0 });
        updateQuestions([]);
        setIsLoadingQuestions(false);
        setSelectedImages([]);
        setFileNames([]);
        setCurrentImageIndex(0);

        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.value = "";
        }
    };

    const handleUpload = async () => {
        if (!selectedImage || boxes.length === 0) {
            alert("Please select an image and add at least one box.");
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setUploadStatus('Starting upload...');

        const rect = imageRef.current.getBoundingClientRect();
        const displayW = rect.width;
        const displayH = rect.height;
        const scaleX = naturalSize.width / displayW;
        const scaleY = naturalSize.height / displayH;

        try {
            // Upload each box as a separate image
            const totalBoxes = boxes.length;
            const uploadPromises = boxes.map((box, index) => {
                const cropBox = {
                    name: box.name,
                    left: Math.round(box.x * scaleX),
                    top: Math.round(box.y * scaleY),
                    right: Math.round((box.x + box.width) * scaleX),
                    bottom: Math.round((box.y + box.height) * scaleY),
                    index,
                };
                return cropAndUploadImage(selectedImage, cropBox);
            });

            // Track upload progress
            let completedUploads = 0;
            const uploadedImages = await Promise.all(
                uploadPromises.map(async (promise) => {
                    const result = await promise;
                    completedUploads++;
                    setUploadProgress(Math.round((completedUploads / totalBoxes) * 100));
                    setUploadStatus(`Uploading image ${completedUploads} of ${totalBoxes}...`);
                    return result;
                })
            );

            setUploadStatus('Updating questions with new image URLs...');

            // Update questions with new image URLs
            const updatedQuestions = questions.map(question => {
                const updatedQ = { ...question };

                if (updatedQ.isQuestionImage && updatedQ.question_image) {
                    const foundImage = uploadedImages.find(img => img.name === updatedQ.question_image);
                    if (foundImage) {
                        updatedQ.question_image = foundImage.url;
                    }
                }

                if (updatedQ.isOptionImage && updatedQ.option_images) {
                    updatedQ.option_images = updatedQ.option_images.map(opt => {
                        const foundImage = uploadedImages.find(img => img.name === opt);
                        return foundImage ? foundImage.url : opt;
                    });
                }

                return updatedQ;
            });

            // Save the updated questions
            saveQuestions(updatedQuestions);

            setUploadStatus('Saving changes to backend...');

            // Update the backend
            let completedUpdates = 0;
            const totalUpdates = updatedQuestions.filter(q => q.isQuestionImage || q.isOptionImage).length;

            for (const question of updatedQuestions) {
                if (question.isQuestionImage || question.isOptionImage) {
                    try {
                        const updateData = prepareQuestionUpdateData(question);
                        await updateQuestion(question.id, updateData);
                        completedUpdates++;
                        setUploadProgress(Math.round((completedUpdates / totalUpdates) * 100));
                        setUploadStatus(`Updating question ${completedUpdates} of ${totalUpdates}...`);
                    } catch (error) {
                        console.error(`Failed to update question ${question.id}:`, error);
                        alert(`Failed to update question ${question.id}: ${error.message}`);
                    }
                }
            }

            setUploadStatus('Upload completed successfully!');
            setTimeout(() => {
                alert("Upload successful!");
                resetState();
            }, 1000);

        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('Upload failed!');
            alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleQuestionUpdate = (updatedQuestion) => {
        console.log('Updating question:', updatedQuestion);
        updateQuestions(prev => prev.map(q =>
            q.id === updatedQuestion.id ? updatedQuestion : q
        ));
    };

    const handleToggleImageType = (questionId, type, value) => {
        console.log('Toggling image type:', { questionId, type, value });
        updateQuestions(prev =>
            prev.map(q =>
                q.id === questionId ? { ...q, [type]: value } : q
            )
        );
    };

    const handleAddBoxToQuestion = (question, type, optionIndex = null) => {
        let name = '';
        if (type === 'question') {
            if (question.question_image) {
                name = question.question_image;
            } else {
                name = `${question.id}_${question.question_number}_${fileName}`;
                updateQuestions(prev => prev.map(q =>
                    q.id === question.id ? { ...q, question_image: name } : q
                ));
            }
        } else if (type === 'option' && optionIndex !== null) {
            if (question.option_images && question.option_images[optionIndex]) {
                name = question.option_images[optionIndex];
            } else {
                name = `${question.id}_${question.question_number}_option${optionIndex + 1}_${fileName}`;
                updateQuestions(prev => prev.map(q => {
                    if (q.id === question.id) {
                        const newOpts = [...(q.option_images || [])];
                        newOpts[optionIndex] = name;
                        return { ...q, option_images: newOpts };
                    }
                    return q;
                }));
            }
        }

        // Check if a box already exists for this question/option
        const existingBox = boxes.find(box =>
            box.questionId === question.id &&
            box.type === type &&
            (type === 'question' ? true : box.optionIndex === optionIndex)
        );

        if (existingBox) {
            // If box exists, remove it
            setBoxes(prev => prev.filter(b => b.id !== existingBox.id));

            // Clear the image URL
            if (type === 'question') {
                updateQuestions(prev => prev.map(q =>
                    q.id === question.id ? { ...q, question_image: null } : q
                ));
            } else {
                updateQuestions(prev => prev.map(q => {
                    if (q.id === question.id) {
                        const newOpts = [...(q.option_images || [])];
                        newOpts[optionIndex] = null;
                        return { ...q, option_images: newOpts };
                    }
                    return q;
                }));
            }
        } else {
            // Add new box
            const newBox = {
                id: Date.now() + Math.random(),
                x: 50,
                y: 50,
                width: 100,
                height: 100,
                name,
                preview: null,
                questionId: question.id,
                optionIndex: type === 'option' ? optionIndex : null,
                type,
                className: type === 'question' ? 'question-box' : 'option-box'
            };
            setBoxes(prev => [...prev, newBox]);
        }
    };

    const handlePrevImage = () => {
        if (currentImageIndex > 0) {
            const newIndex = currentImageIndex - 1;
            setCurrentImageIndex(newIndex);
            setSelectedImage(selectedImages[newIndex]);
            setFileName(fileNames[newIndex]);
            onImageSelect(selectedImages[newIndex], fileNames[newIndex]);
            // Reset boxes for the new image
            setBoxes([]);
            onBoxesChange([]);
        }
    };

    const handleNextImage = () => {
        if (currentImageIndex < selectedImages.length - 1) {
            const newIndex = currentImageIndex + 1;
            setCurrentImageIndex(newIndex);
            setSelectedImage(selectedImages[newIndex]);
            setFileName(fileNames[newIndex]);
            onImageSelect(selectedImages[newIndex], fileNames[newIndex]);
            // Reset boxes for the new image
            setBoxes([]);
            onBoxesChange([]);
        }
    };

    const handleUpdateAllQuestions = async (fileName) => {
        if (!fileName) {
            toast.error('No file name provided');
            return;
        }

        // Start the update process in the background
        const updatePromise = new Promise(async (resolve, reject) => {
            try {
                // Get all questions for this file
                const questionsToUpdate = questions.filter(q => q.file_name === fileName);

                // Update each question in the background
                const updatePromises = questionsToUpdate.map(async (question) => {
                    try {
                        const updateData = prepareQuestionUpdateData(question);
                        await updateQuestion(question.id, updateData);
                        return { success: true, questionId: question.id };
                    } catch (error) {
                        console.error(`Failed to update question ${question.id}:`, error);
                        return { success: false, questionId: question.id, error };
                    }
                });

                const results = await Promise.all(updatePromises);
                const failedUpdates = results.filter(r => !r.success);

                if (failedUpdates.length > 0) {
                    reject(new Error(`${failedUpdates.length} questions failed to update`));
                } else {
                    resolve();
                }
            } catch (error) {
                reject(error);
            } finally {
                setIsUpdating(false);
            }
        });

        // Show the toast notification
        toast.promise(updatePromise, {
            loading: 'Updating questions in background...',
            success: 'All questions updated successfully!',
            error: (err) => `Failed to update: ${err.message}`
        });

        // Immediately move to next file if available
        if (currentImageIndex < selectedImages.length - 1) {
            handleNextImage();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <Toaster
                position="top-right"
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#4ade80',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#ef4444',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            {/* Navbar */}
            <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
                <div className="mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                🖼️ Question Editor
                            </h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg cursor-pointer transition-all border border-gray-300">
                                    📁 Choose Files
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                        multiple
                                    />
                                </label>
                                {fileName && (
                                    <span className="text-sm text-gray-600 max-w-xs truncate">
                                        {fileName} ({currentImageIndex + 1}/{selectedImages.length})
                                    </span>
                                )}
                            </div>

                            {selectedImage && (
                                <button
                                    onClick={resetState}
                                    disabled={isUploading}
                                    className={`px-4 py-2 ${isUploading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-red-600 hover:bg-red-700'
                                        } text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2`}
                                >
                                    🗑️ Clear & Start New
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Upload Progress */}
            {isUploading && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm text-gray-600">{uploadStatus}</p>
                        <p className="text-sm font-medium text-blue-600">{uploadProgress}%</p>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="">
                {!selectedImage ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <div className="text-8xl mb-4">📷</div>
                            <h2 className="text-2xl font-semibold text-gray-600 mb-2">No Image Selected</h2>
                            <p className="text-gray-500 mb-4">
                                Choose an image file from the navbar to start cropping and selecting regions
                            </p>
                            <div className="text-sm text-gray-400">
                                Supported formats: JPG, PNG, GIF
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex" style={{ height: "calc(100vh - 140px)" }}>
                        {/* Main Image Area */}
                        <div className="flex-1 px-4 flex flex-col relative">
                            <h1 className="text-2xl font-bold mb-4">
                                Selected image and bounding boxes
                            </h1>
                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                <div className="relative max-w-full max-h-full">
                                    <img
                                        ref={imageRef}
                                        src={selectedImage}
                                        alt="Selected"
                                        onLoad={handleImageLoad}
                                        style={{
                                            display: "block",
                                            maxWidth: "100%",
                                            maxHeight: "calc(100vh - 150px)",
                                            width: "auto",
                                            height: "auto",
                                            border: "1px solid #ccc",
                                            objectFit: "contain",
                                        }}
                                    />
                                    {boxes.map((box) => (
                                        <DraggableBox
                                            key={box.id}
                                            id={box.id}
                                            x={box.x}
                                            y={box.y}
                                            width={box.width}
                                            height={box.height}
                                            label={box.name}
                                            onUpdate={updateBox}
                                            onDelete={(id) => {
                                                const boxToDelete = boxes.find(b => b.id === id);
                                                if (boxToDelete) {
                                                    // Clear the image URL when box is deleted
                                                    if (boxToDelete.type === 'question') {
                                                        updateQuestions(prev => prev.map(q =>
                                                            q.id === boxToDelete.questionId ? { ...q, question_image: null } : q
                                                        ));
                                                    } else {
                                                        updateQuestions(prev => prev.map(q => {
                                                            if (q.id === boxToDelete.questionId) {
                                                                const newOpts = [...(q.option_images || [])];
                                                                newOpts[boxToDelete.optionIndex] = null;
                                                                return { ...q, option_images: newOpts };
                                                            }
                                                            return q;
                                                        }));
                                                    }
                                                }
                                                setBoxes(prev => prev.filter(b => b.id !== id));
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Questions Panel */}
                        <div className="w-1/2 border-l border-gray-200 pl-6 overflow-y-auto bg-gray-50">
                            <div className="relative sticky top-0 bg-gray-50 pb-4 mb-6 border-b border-gray-200 z-100">
                                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                                    📋 Questions Preview
                                </h1>
                                <p className="text-gray-600 text-sm">
                                    Configure image settings and manage bounding boxes for each question
                                </p>
                            </div>

                            {isLoadingQuestions ? (
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-2 bg-blue-100 rounded-full animate-pulse"></div>
                                    </div>
                                    <div className="mt-6 text-center">
                                        <h3 className="text-xl font-semibold text-gray-700 mb-2">🔍 Fetching Questions</h3>
                                        <p className="text-gray-500 mb-4">
                                            Searching for questions related to <span className="font-medium text-blue-600">{fileName}</span>
                                        </p>
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ) : questions && questions.length > 0 ? (
                                <div className="space-y-6">
                                    {questions.map((question) => (
                                        <QuestionEditor
                                            key={question.id}
                                            question={question}
                                            onUpdate={handleQuestionUpdate}
                                            onToggleImageType={(type, value) => handleToggleImageType(question.id, type, value)}
                                            onAddBox={(type, optionIndex) => handleAddBoxToQuestion(question, type, optionIndex)}
                                            onDeleteBox={(boxId) => setBoxes(prev => prev.filter(b => b.id !== boxId))}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">📄</div>
                                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Questions Found</h3>
                                    <p className="text-gray-500">
                                        No questions available for this image. Please select a different image or check your data.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Controls */}
                <div className="flex items-center justify-between mt-4 px-4">
                    <button
                        onClick={handlePrevImage}
                        disabled={currentImageIndex === 0}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentImageIndex === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Image {currentImageIndex + 1} of {selectedImages.length}
                    </span>

                    <div className="flex flex-row gap-4">

                        <button
                            onClick={handleNextImage}
                            disabled={currentImageIndex === selectedImages.length - 1}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${currentImageIndex === selectedImages.length - 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                        >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-4">
                            {questions && questions.length > 0 && (
                                <button
                                    onClick={() => handleUpdateAllQuestions(fileName)}
                                    disabled={isUpdating}
                                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2"
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Updating All Questions...
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                            </svg>
                                            Update + Next
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageMultipleRegions;
