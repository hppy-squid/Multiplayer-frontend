const BASE_URL = "http://localhost:8080/api/question";

export async function getQuestionAndOptions(questionId: number) {
    const response = await fetch(`${BASE_URL}/questionAndOptions?question_id=${questionId}`);
    return response.json();
    
}

export function getCorrectAnswer(questionId: number) {
    return fetch(`${BASE_URL}/correctAnswer?question_id=${questionId}`);
}