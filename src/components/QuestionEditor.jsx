import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { updateQuestion, prepareQuestionUpdateData } from '../services/questionService';
import { renderMixedLatex } from '../utils/latex-render';
import { refineTextWithAI } from '../services/aiService';
import toast from 'react-hot-toast';

const QuestionEditor = ({ question, onUpdate, onToggleImageType, onUpdateAllQuestions }) => {
    const [refiningField, setRefiningField] = useState(null);
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
            let newValue = tempValues[property];
            if (property === 'answer' && question.question_type?.toLowerCase() === 'subjective') {
                if (Array.isArray(newValue)) {
                    newValue = newValue.map(v => typeof v === 'string' ? v : (v && v.text ? v.text : JSON.stringify(v))).join(' ');
                } else if (typeof newValue === 'object' && newValue !== null) {
                    newValue = newValue.text || JSON.stringify(newValue);
                } else if (typeof newValue !== 'string') {
                    newValue = newValue && newValue.toString ? newValue.toString() : '';
                }
            }
            const updatedQuestion = {
                ...question,
                [property]: newValue
            };
            onUpdate(updatedQuestion);
            setEditingField(null);
            setTempValues({});
        }
    };

    const handleRefineField = async (property, index = null) => {
        const fieldIdentifier = index !== null ? `${property}_${index}` : property;
        setRefiningField(fieldIdentifier);

        let textToRefine = '';
        if (property === 'options' && index !== null) {
            textToRefine = question.options[index];
        } else {
            textToRefine = question[property];
        }

        if (!textToRefine) {
            toast.error("There is no text to refine.");
            setRefiningField(null);
            return;
        }

        const refinePromise = refineTextWithAI(textToRefine);

        toast.promise(refinePromise, {
            loading: 'Refining content with AI...',
            success: (refinedText) => {
                let updatedQuestion = { ...question };
                if (property === 'options' && index !== null) {
                    const newOptions = [...updatedQuestion.options];
                    newOptions[index] = refinedText;
                    updatedQuestion.options = newOptions;
                } else {
                    updatedQuestion[property] = refinedText;
                }
                onUpdate(updatedQuestion);
                setRefiningField(null);
                return 'Content refined successfully!';
            },
            error: (err) => {
                setRefiningField(null);
                return `Refinement failed: ${err.message}`;
            }
        });
    };

    const handleUpdateQuestion = async () => {
        console.log(question.id)
        if (!question.id) {
            alert('Question ID is missing');
            return;
        }

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
        }
    };


    const handleToggleFlag = async () => {
        const updatedQuestion = {
            ...question,
            flagged: !question.flagged,
        };
        onUpdate(updatedQuestion); // Update parent state immediately

        try {
            // Persist the flag change to the backend
            await toast.promise(updateQuestion(question.id, { flagged: updatedQuestion.flagged }), {
                loading: 'Updating flag status...',
                success: 'Flag status updated!',
                error: 'Could not update flag status.',
            });
        } catch (error) {
            // The toast promise will handle displaying the error.
            // We can also revert the state change if we want.
            onUpdate(question); // Revert optimistic update on failure
        }
    };

    const renderField = (label, property, type = 'text', options = null) => {
        const isEditing = editingField === property;
        let value = isEditing ? (tempValues[property] ?? question[property] ?? '') : (question[property] ?? '');

        // Fix: For subjective answers, always use string
        if (property === 'answer' && question.question_type?.toLowerCase() === 'subjective') {
            if (Array.isArray(value)) {
                value = value.map(v => typeof v === 'string' ? v : (v && v.text ? v.text : JSON.stringify(v))).join(' ');
            } else if (typeof value === 'object' && value !== null) {
                value = value.text || JSON.stringify(value);
            } else if (typeof value !== 'string') {
                value = value && value.toString ? value.toString() : '';
            }
        }

        // Determine if we should expand the answer field
        const expandAnswer = property === 'answer' && isEditing && question.question_type?.toLowerCase() === 'subjective';

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
            <div className={`relative${expandAnswer ? ' col-span-3' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{label}</label>
                    <div className="flex items-center gap-2">
                        {property === 'question_text' && !isEditing && (
                            <button
                                onClick={() => handleRefineField('question_text')}
                                disabled={refiningField === 'question_text'}
                                className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                title="Refine with AI"
                            >
                                {refiningField === 'question_text' ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                )}
                            </button>
                        )}
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
                        {value ? renderMixedLatex(value) : 'Not set'}
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
                    <div className="flex items-center gap-2">
                        {!isEditing && (
                            <button
                                onClick={() => handleRefineField(property)}
                                disabled={refiningField === property}
                                className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                title="Refine with AI"
                            >
                                {refiningField === property ? (
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                )}
                            </button>
                        )}
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
                </div>
                {isEditing ? (
                    <div className="flex gap-2">
                        <textarea
                            value={value}
                            onChange={e => handleTempChange(property, e.target.value)}
                            onBlur={() => handleEditComplete(property)}
                            rows={3}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm "
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
                        {value ? renderMixedLatex(value) : 'Not set'}
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
                        {value ? renderMixedLatex(value) : 'Not set'}
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
                            {options.map((option, index) => (
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
                        {value ? renderMixedLatex(value) : 'Not set'}
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
                <div className="grid grid-cols-7 gap-3">
                    <div className="col-span-3">{renderField('Question Type', 'question_type', 'select', questionTypes)}</div>
                    <div className="col-span-2">{renderField('Section Name', 'section_name', 'select', sectionNames)}</div>
                    <div className="col-span-2">{renderField('Topic', 'topic')}</div>
                    {/*
                    {renderField('Exam Name', 'exam_name')}
                    {renderField('Subject', 'subject')}
                    {renderField('Chapter', 'chapter')}
                    */}
                </div>
                <div className="mt-2 w-1/2">
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
                                            {option ? renderMixedLatex(option) : 'Not set'}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => handleRefineField('options', index)}
                                                disabled={refiningField === `options_${index}`}
                                                className="p-1 text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                                                title="Refine with AI"
                                            >
                                                {refiningField === `options_${index}` ? (
                                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                                    </svg>
                                                )}
                                            </button>
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
                                        </div>
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
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Update Buttons */}
                <div className="border-t pt-3 flex justify-between items-center">
                    <button
                        onClick={handleToggleFlag}
                        className={`p-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            question.flagged
                                ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300 focus:ring-indigo-500'
                        }`}
                        title={question.flagged ? 'Unflag Question' : 'Flag Question for Review'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4a1 1 0 01-.8 1.6H6a3 3 0 01-3-3V6zm3-1a1 1 0 00-1 1v4a1 1 0 001 1h7.25l-2.1-2.8a1 1 0 010-1.2L10.25 5H6z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all font-medium flex items-center gap-2 text-sm"
                        onClick={handleUpdateQuestion}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
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
        flagged: PropTypes.bool
    }).isRequired,
    onUpdate: PropTypes.func.isRequired,
    onToggleImageType: PropTypes.func.isRequired,
    onAddBox: PropTypes.func.isRequired,
    onDeleteBox: PropTypes.func.isRequired,
    onUpdateAllQuestions: PropTypes.func.isRequired,
};

export default QuestionEditor; 
