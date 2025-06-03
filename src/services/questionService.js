import axios from 'axios';

const API_BASE_URL = 'https://question-banks.netlify.app/api';

export const fetchQuestions = async (fileName) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/questions`, {
            params: { file_name: fileName },
        });
        return response.data.data.questions || [];
    } catch (error) {
        console.error('Error fetching questions:', error);
        throw error;
    }
};

export const updateQuestion = async (questionId, updateData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/questions/${questionId}`,
            updateData,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error updating question:', error);
        throw error;
    }
};

export const prepareQuestionUpdateData = (question) => {
    return {
        question_number: question.question_number,
        file_name: question.file_name,
        question_text: question.question_text,
        isQuestionImage: question.isQuestionImage,
        question_image: question.isQuestionImage ? question.question_image : null,
        isOptionImage: question.isOptionImage,
        options: question.options || [],
        option_images: question.isOptionImage ? question.option_images : [],
        section_name: question.section_name,
        question_type: question.question_type,
        topic: question.topic,
        exam_name: question.exam_name,
        subject: question.subject,
        chapter: question.chapter,
        answer: question.answer
    };
}; 
