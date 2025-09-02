// const url ='http://localhost:5001';
const url = 'https://learn-leap.onrender.com';

// const url ="https://learn-leap.onrender.com";

/**
 * Generates a quiz from text content using Gemini AI via backend service
 * @param {string} content - The text content to generate a quiz from
 * @param {number} questionCount - Number of questions to generate
 * @returns {Promise<Array>} - Array of quiz questions
 */
export const generateQuizFromContent = async (content, questionCount = 5) => {

  console.log(url);
  try {
    const response = await fetch(`${url}/api/generate-quiz`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, questionCount }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate quiz');
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating quiz:', error);
    throw error;
  }
};

/**
 * Analyzes text content and extracts key concepts via backend service
 * @param {string} content - The text content to analyze
 * @returns {Promise<Object>} - Analysis results with key concepts
 */
export const analyzeContentForQuiz = async (content) => {
  try {
    const response = await fetch(`${url}/api/analyze-content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to analyze content');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing content:', error);
    throw error;
  }
};

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Sends a YouTube URL to the backend for transcription.
 * @param {string} url The YouTube video URL.
 * @returns {Promise<string>} The transcribed text.
 */
export const transcribeAudioFromUrl = async (url) => {
  const response = await fetch(`${API_BASE_URL}/transcribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errData = await response.json();
    throw new Error(errData.error || 'Failed to transcribe video.');
  }

  const { transcript } = await response.json();
  return transcript;
};

/**
 * Sends content to the backend for AI-powered analysis.
 * @param {string} content The text content to analyze.
 * @returns {Promise<object>} An object containing the content analysis.
 */
// export const analyzeContentForQuiz = async (content) => {
//   const response = await fetch(`${API_BASE_URL}/analyze-content`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ content }),
//   });

//   if (!response.ok) {
//     const errData = await response.json();
//     throw new Error(errData.error || 'Failed to analyze content.');
//   }

//   return response.json();
// };

// /**
//  * Sends content to the backend to generate a quiz.
//  * @param {string} content The text content for the quiz.
//  * @param {number} questionCount The number of questions to generate.
//  * @returns {Promise<Array>} An array of question objects.
//  */
// export const generateQuizFromContent = async (content, questionCount) => {
//   const response = await fetch(`${API_BASE_URL}/generate-quiz`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ content, questionCount }),
//   });

//   if (!response.ok) {
//     const errData = await response.json();
//     throw new Error(errData.error || 'Failed to generate quiz.');
//   }

//   return response.json();
// };

