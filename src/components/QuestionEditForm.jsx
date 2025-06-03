import React, { useState } from 'react';
import axios from 'axios';

const QuestionEditForm = ({ question, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState({
        question_number: question.question_number || '',
        file_name: question.file_name || '',
        question_text: question.question_text || '',
        isQuestionImage: question.isQuestionImage || false,
        question_image: question.question_image || '',
        isOptionImage: question.isOptionImage || false,
        options: question.options || [],
        option_images: question.option_images || [],
        section_name: question.section_name || '',
        question_type: question.question_type || '',
        topic: question.topic || '',
        exam_name: question.exam_name || '',
        subject: question.subject_name || '',
        chapter: question.chapter || '',
        answer: question.answer || ''
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleOptionsChange = (index, value) => {
        const newOptions = [...formData.options];
        newOptions[index] = value;
        setFormData(prev => ({
            ...prev,
            options: newOptions
        }));
    };

    const handleOptionImagesChange = (index, value) => {
        const newOptionImages = [...formData.option_images];
        newOptionImages[index] = value;
        setFormData(prev => ({
            ...prev,
            option_images: newOptionImages
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(
                `https://teacher-backend-xi.vercel.app/api/questions/${question._id}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            onUpdate(response.data);
        } catch (error) {
            console.error('Error updating question:', error);
            alert('Failed to update question: ' + error.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Question Number</label>
                    <input
                        type="text"
                        name="question_number"
                        value={formData.question_number}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">File Name</label>
                    <input
                        type="text"
                        name="file_name"
                        value={formData.file_name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Question Text */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Question Text</label>
                <textarea
                    name="question_text"
                    value={formData.question_text}
                    onChange={handleChange}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            {/* Image Settings */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="isQuestionImage"
                            checked={formData.isQuestionImage}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Has Question Image</span>
                    </label>
                    {formData.isQuestionImage && (
                        <input
                            type="text"
                            name="question_image"
                            value={formData.question_image}
                            onChange={handleChange}
                            placeholder="Question Image URL"
                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    )}
                </div>
                <div>
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            name="isOptionImage"
                            checked={formData.isOptionImage}
                            onChange={handleChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Has Option Images</span>
                    </label>
                </div>
            </div>

            {/* Options */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                {formData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionsChange(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                        {formData.isOptionImage && (
                            <input
                                type="text"
                                value={formData.option_images[index] || ''}
                                onChange={(e) => handleOptionImagesChange(index, e.target.value)}
                                placeholder="Image URL"
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Additional Fields */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Section Name</label>
                    <input
                        type="text"
                        name="section_name"
                        value={formData.section_name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Question Type</label>
                    <input
                        type="text"
                        name="question_type"
                        value={formData.question_type}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Topic</label>
                    <input
                        type="text"
                        name="topic"
                        value={formData.topic}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Exam Name</label>
                    <input
                        type="text"
                        name="exam_name"
                        value={formData.exam_name}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Chapter</label>
                    <input
                        type="text"
                        name="chapter"
                        value={formData.chapter}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Answer */}
            <div>
                <label className="block text-sm font-medium text-gray-700">Answer</label>
                <input
                    type="text"
                    name="answer"
                    value={formData.answer}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Save Changes
                </button>
            </div>
        </form>
    );
};

export default QuestionEditForm;
