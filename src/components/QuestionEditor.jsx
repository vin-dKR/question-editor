import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { deleteImageFromSupabase } from '../utils/imageUpload';
import { updateQuestion, prepareQuestionUpdateData } from '../services/questionService';

const QuestionEditor = ({ question, onUpdate, onToggleImageType, onUpdateAllQuestions }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [editingField, setEditingField] = useState(null);
    const [tempValues, setTempValues] = useState({});

    const questionTypes = [
        'Subjective',
        'Single Correct Type Questions',
        'Multiple Correct Type Questions',
        'Comprehension Type Questions',
        'Matrix Match Type Question',
        'Other/Miscellaneous'
    ];

    const sectionNames = [
        'EXERCISE (S-1)',
        'EXERCISE (S-2)',
        'EXERCISE (O-1)',
        'EXERCISE (O-2)',
        'EXERCISE (J-M)',
        'EXERCISE (J-A)',
        'EXERCISE (CBSE)',
        'EXERCISE (E-1)',
        'EXERCISE (E-2)'
    ];


    const handlePropertyChange = (property, value) => {
        const updatedQuestion = {
            ...question,
            [property]: value
        };
        console.log('Updating question with:', updatedQuestion);
        onUpdate(updatedQuestion);
        setEditingField(null);
        setTempValues({});
    };

    const handleTempChange = (property, value) => {
        setTempValues(prev => ({
            ...prev,
            [property]: value
        }));
    };

    const handleEditComplete = (property) => {
        if (tempValues[property] !== undefined) {
            const updatedQuestion = {
                ...question,
                [property]: tempValues[property]
            };
            console.log('Completing edit with:', updatedQuestion);
            onUpdate(updatedQuestion);
            setEditingField(null);
            setTempValues({});
        }
    };

    {/*
    const handleDeleteImage = async (type, optionIndex = null) => {
        try {
            let fileName;
            if (type === 'question') {
                fileName = question.question_image?.split('/').pop();
                if (fileName) {
                    await deleteImageFromSupabase(fileName);
                    handlePropertyChange('question_image', null);
                }
            } else if (type === 'option' && optionIndex !== null) {
                const optionImage = question.option_images?.[optionIndex];
                if (optionImage) {
                    fileName = optionImage.split('/').pop();
                    await deleteImageFromSupabase(fileName);
                    const newOptionImages = [...(question.option_images || [])];
                    newOptionImages[optionIndex] = null;
                    handlePropertyChange('option_images', newOptionImages);
                }
            }
        } catch (error) {
            console.error('Error deleting image:', error);
            alert(`Failed to delete image: ${error.message}`);
        }
    };

    const handleUploadImage = async (type, optionIndex = null) => {
        if (!question.file_name) {
            alert('Please select an image file first');
            return;
        }

        setUploadStatus('Uploading image...');

        try {
            // Delete existing image if any
            await handleDeleteImage(type, optionIndex);

            // Get the image element
            const imageElement = document.querySelector('img[alt="Selected"]');
            if (!imageElement) {
                throw new Error('No image selected');
            }

            // Get the bounding box for this question/option
            const boxSelector = type === 'question' ? '.question-box' : '.option-box';
            const boxes = document.querySelectorAll(boxSelector);
            const box = type === 'question' ? boxes[0] : boxes[optionIndex];

            if (!box) {
                throw new Error(`No bounding box found for ${type} image`);
            }

            const rect = box.getBoundingClientRect();
            const imageRect = imageElement.getBoundingClientRect();

            // Calculate crop coordinates relative to the image
            const cropBox = {
                name: type === 'question'
                    ? `${question.question_number}_${question.file_name}`
                    : `${question.question_number}_option${optionIndex + 1}_${question.file_name}`,
                left: Math.round((rect.left - imageRect.left) * (imageElement.naturalWidth / imageRect.width)),
                top: Math.round((rect.top - imageRect.top) * (imageElement.naturalHeight / imageRect.height)),
                right: Math.round((rect.right - imageRect.left) * (imageElement.naturalWidth / imageRect.width)),
                bottom: Math.round((rect.bottom - imageRect.top) * (imageElement.naturalHeight / imageRect.height)),
                index: optionIndex || 0
            };

            // Upload image
            const result = await cropAndUploadImage(imageElement.src, cropBox);

            // Update question with new image URL
            if (type === 'question') {
                handlePropertyChange('question_image', result.url);
            } else {
                const newOptionImages = [...(question.option_images || [])];
                newOptionImages[optionIndex] = result.url;
                handlePropertyChange('option_images', newOptionImages);
            }

            setUploadStatus('Upload successful!');
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('Upload failed!');
            alert(`Upload failed: ${error.message}`);
        } finally {
        }
    };
    */}

    const handleUpdateQuestion = async () => {
        console.log(question.id)
        if (!question.id) {
            alert('Question ID is missing');
            return;
        }

        setIsUpdating(true);
        setUploadStatus('Updating question...');

        try {
            const updateData = prepareQuestionUpdateData(question);
            console.log("updateData ------------------", updateData)
            const updatedRes = await updateQuestion(question.id, updateData);
            console.log("updatedRes from api", updatedRes)
            setUploadStatus('Update successful!');
        } catch (error) {
            console.error('Update failed:', error);
            setUploadStatus('Update failed!');
            alert(`Update failed: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateAllQuestions = async () => {
        if (!question.file_name) {
            alert('No file name associated with this question');
            return;
        }

        setIsUpdating(true);
        setUploadStatus('Updating all questions...');

        try {
            await onUpdateAllQuestions(question.file_name);
            setUploadStatus('All questions updated successfully!');
        } catch (error) {
            console.error('Update failed:', error);
            setUploadStatus('Update failed!');
            alert(`Update failed: ${error.message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    {/*
    const handleAddOptionImage = () => {
        const newOptionImages = [...(question.option_images || []), ""];
        handlePropertyChange('option_images', newOptionImages);
    };

    const handleRemoveOptionImage = (index) => {
        const newOptionImages = [...(question.option_images || [])];
        newOptionImages.splice(index, 1);
        handlePropertyChange('option_images', newOptionImages);
    };

    const handleUploadOptionImages = async () => {
        if (!question.file_name) {
            alert('Please select an image file first');
            return;
        }

        setUploadStatus('Uploading option images...');

        try {
            // Delete existing option images
            if (question.option_images) {
                for (let i = 0; i < question.option_images.length; i++) {
                    await handleDeleteImage('option', i);
                }
            }

            const imageElement = document.querySelector('img[alt="Selected"]');
            if (!imageElement) {
                throw new Error('No image selected');
            }

            // Get all option boxes for this question
            const optionBoxes = document.querySelectorAll(`.option-box[data-question-id="${question.id}"]`);
            if (optionBoxes.length === 0) {
                throw new Error('No option boxes found. Please add boxes first.');
            }

            const imageRect = imageElement.getBoundingClientRect();
            const uploadPromises = Array.from(optionBoxes).map(async (box, index) => {
                const rect = box.getBoundingClientRect();

                // Calculate crop coordinates relative to the image
                const cropBox = {
                    name: `${question.question_number}_option${index + 1}_${question.file_name}`,
                    left: Math.round((rect.left - imageRect.left) * (imageElement.naturalWidth / imageRect.width)),
                    top: Math.round((rect.top - imageRect.top) * (imageElement.naturalHeight / imageRect.height)),
                    right: Math.round((rect.right - imageRect.left) * (imageElement.naturalWidth / imageRect.width)),
                    bottom: Math.round((rect.bottom - imageRect.top) * (imageElement.naturalHeight / imageRect.height)),
                    index
                };

                return cropAndUploadImage(imageElement.src, cropBox);
            });

            const results = await Promise.all(uploadPromises);

            // Update option images with new URLs
            const newOptionImages = results.map(result => result.url);
            handlePropertyChange('option_images', newOptionImages);

            // Update the question in the database
            const updateData = prepareQuestionUpdateData({
                ...question,
                option_images: newOptionImages
            });
            await updateQuestion(question.id, updateData);

            setUploadStatus('Option Images Upload successful!');
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadStatus('Option Images Upload failed!');
            alert(`Upload failed: ${error.message}`);
        } finally {
        }
    };

    */}

    const renderField = (label, property, type = 'text', options = null) => {
        const isEditing = editingField === property;
        const value = isEditing ? (tempValues[property] ?? question[property] ?? '') : (question[property] ?? '');

        // Special handling for answer field based on question type
        if (property === 'answer') {
            const questionType = question.question_type?.toLowerCase();
            if (questionType === 'subjective') {
                return renderTextField(label, property, value, isEditing);
            } else if (questionType === 'single correct type questions') {
                return renderSingleCorrectAnswer(label, property, value, isEditing);
            } else if (questionType === 'multiple correct type questions') {
                return renderMultipleCorrectAnswer(label, property, value, isEditing);
            }
        }

        return (
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setEditingField(property);
                                setTempValues(prev => ({
                                    ...prev,
                                    [property]: question[property] ?? ''
                                }));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        {type === 'select' ? (
                            <select
                                value={value}
                                onChange={e => handleTempChange(property, e.target.value)}
                                onBlur={() => handleEditComplete(property)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            >
                                <option value="">Select {label}</option>
                                {options.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        ) : type === 'textarea' ? (
                            <textarea
                                value={value}
                                onChange={e => handleTempChange(property, e.target.value)}
                                onBlur={() => handleEditComplete(property)}
                                rows={3}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        ) : (
                            <input
                                type={type}
                                value={value}
                                onChange={e => handleTempChange(property, e.target.value)}
                                onBlur={() => handleEditComplete(property)}
                                className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                        )}
                        <button
                            onClick={() => {
                                setEditingField(null);
                                setTempValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[property];
                                    return newValues;
                                });
                            }}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="w-full px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        {value || 'Not set'}
                    </div>
                )}
            </div>
        );
    };

    const renderTextField = (label, property, value, isEditing) => {
        return (
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setEditingField(property);
                                setTempValues(prev => ({
                                    ...prev,
                                    [property]: question[property] ?? ''
                                }));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <textarea
                            value={value}
                            onChange={e => handleTempChange(property, e.target.value)}
                            onBlur={() => handleEditComplete(property)}
                            rows={3}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                        <button
                            onClick={() => {
                                setEditingField(null);
                                setTempValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[property];
                                    return newValues;
                                });
                            }}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="w-full px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        {value || 'Not set'}
                    </div>
                )}
            </div>
        );
    };

    const renderSingleCorrectAnswer = (label, property, value, isEditing) => {
        const options = ['A', 'B', 'C', 'D'];
        return (
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setEditingField(property);
                                setTempValues(prev => ({
                                    ...prev,
                                    [property]: question[property] ?? ''
                                }));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <select
                            value={value}
                            onChange={e => handleTempChange(property, e.target.value)}
                            onBlur={() => handleEditComplete(property)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        >
                            <option value="">Select Answer</option>
                            {options.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                setEditingField(null);
                                setTempValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[property];
                                    return newValues;
                                });
                            }}
                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <div className="w-full px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        {value || 'Not set'}
                    </div>
                )}
            </div>
        );
    };

    const renderMultipleCorrectAnswer = (label, property, value, isEditing) => {
        const options = ['A', 'B', 'C', 'D'];
        const selectedValues = value ? value.split(',').map(v => v.trim()) : [];
        
        return (
            <div className="relative">
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    {!isEditing && (
                        <button
                            onClick={() => {
                                setEditingField(property);
                                setTempValues(prev => ({
                                    ...prev,
                                    [property]: question[property] ?? ''
                                }));
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </button>
                    )}
                </div>
                {isEditing ? (
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                            {options.map(option => (
                                <label key={option} className="flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input
                                        type="checkbox"
                                        checked={selectedValues.includes(option)}
                                        onChange={(e) => {
                                            const newValues = e.target.checked
                                                ? [...selectedValues, option]
                                                : selectedValues.filter(v => v !== option);
                                            // Sort the values alphabetically before joining
                                            const sortedValues = newValues.sort();
                                            const answerString = sortedValues.join(', ');
                                            handleTempChange(property, answerString);
                                            // Immediately update the question with the new answer
                                            const updatedQuestion = {
                                                ...question,
                                                [property]: answerString
                                            };
                                            onUpdate(updatedQuestion);
                                        }}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{option}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    setEditingField(null);
                                    setTempValues(prev => {
                                        const newValues = { ...prev };
                                        delete newValues[property];
                                        return newValues;
                                    });
                                }}
                                className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                        {value || 'Not set'}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">Question {question.question_number}</h3>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-2 py-1">
                            <span className="text-sm font-medium text-black">📷 Question Image:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={question.isQuestionImage}
                                    onChange={e => onToggleImageType('isQuestionImage', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        <div className="flex items-center gap-2 bg-white bg-opacity-10 rounded-lg px-2 py-1">
                            <span className="text-sm font-medium text-black">🖼️ Option Images:</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={question.isOptionImage}
                                    onChange={e => onToggleImageType('isOptionImage', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    {renderField('Question Type', 'question_type', 'select', questionTypes)}
                    {renderField('Section Name', 'section_name', 'select', sectionNames)}
                    {renderField('Topic', 'topic')}
                    {/*
                    {renderField('Exam Name', 'exam_name')}
                    {renderField('Subject', 'subject')}
                    {renderField('Chapter', 'chapter')}
                    */}
                    {renderField('Answer', 'answer')}
                </div>

                {/* Question Text */}
                <div className="mt-2">
                    {renderField('Question Text', 'question_text', 'textarea')}
                </div>

                {/* Options Section */}
                <div className="border-t pt-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">Options</h4>
                        <button
                            onClick={() => {
                                const newOptions = [...(question.options || [])];
                                newOptions.push('');
                                handlePropertyChange('options', newOptions);
                            }}
                            className="px-2 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                        >
                            Add Option
                        </button>
                    </div>
                    <div className="space-y-2">
                        {(question.options || []).map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500 w-6">{index + 1}.</span>
                                {editingField === `option_${index}` ? (
                                    <>
                                        <input
                                            type="text"
                                            value={tempValues[`option_${index}`] ?? option ?? ''}
                                            onChange={e => handleTempChange(`option_${index}`, e.target.value)}
                                            onBlur={() => {
                                                const newOptions = [...question.options];
                                                newOptions[index] = tempValues[`option_${index}`];
                                                handlePropertyChange('options', newOptions);
                                            }}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                            placeholder={`Option ${index + 1}`}
                                        />
                                        <button
                                            onClick={() => {
                                                setEditingField(null);
                                                setTempValues(prev => {
                                                    const newValues = { ...prev };
                                                    delete newValues[`option_${index}`];
                                                    return newValues;
                                                });
                                            }}
                                            className="px-2 py-1 text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                                            {option || 'Not set'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingField(`option_${index}`);
                                                setTempValues(prev => ({
                                                    ...prev,
                                                    [`option_${index}`]: option ?? ''
                                                }));
                                            }}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => {
                                        const newOptions = [...question.options];
                                        newOptions.splice(index, 1);
                                        handlePropertyChange('options', newOptions);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Update Buttons */}
                <div className="border-t pt-3 flex justify-end">
                    <button
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2 text-sm"
                        onClick={handleUpdateQuestion}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        Update Question
                    </button>
                </div>

                {/* Status Message */}
                {uploadStatus && (
                    <div className={`text-sm font-medium ${uploadStatus.includes('successful') ? 'text-green-600' :
                        uploadStatus.includes('failed') ? 'text-red-600' :
                            'text-blue-600'
                        }`}>
                        {uploadStatus}
                    </div>
                )}
            </div>
        </div>
    );
};

QuestionEditor.propTypes = {
    question: PropTypes.shape({
        id: PropTypes.string.isRequired,
        question_number: PropTypes.number.isRequired,
        question_text: PropTypes.string.isRequired,
        isQuestionImage: PropTypes.bool,
        question_image: PropTypes.string,
        isOptionImage: PropTypes.bool,
        options: PropTypes.array,
        option_images: PropTypes.array,
        section_name: PropTypes.string,
        question_type: PropTypes.string,
        topic: PropTypes.string,
        exam_name: PropTypes.string,
        subject: PropTypes.string,
        chapter: PropTypes.string,
        answer: PropTypes.string,
        file_name: PropTypes.string,
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onToggleImageType: PropTypes.func.isRequired,
    onAddBox: PropTypes.func.isRequired,
    onDeleteBox: PropTypes.func.isRequired,
    onUpdateAllQuestions: PropTypes.func.isRequired,
};

export default QuestionEditor; 
