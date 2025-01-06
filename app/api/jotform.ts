import type { JotFormResponse } from "./model";
import { createRoomie } from "./model/roomie";
import { createRoomieArrendador } from "./model/roomieArrendador";
import { getUserInfo } from "./mongodb";

const API_KEY = "import.meta.env.VITE_JOTFORM_APIKEY;"
console.log(API_KEY)
export async function editSubmission(questionId: string, newAnswer: string, submissionId: string) {
    try {
        const requestBody = {
            [questionId]: newAnswer,
        };
        const response = await fetch(`https://api.jotform.com/submission/${submissionId}?apiKey=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Submission updated successfully:", result);
        return result;
    } catch (error) {
        console.error("Error updating submission:", error);
        throw error;
    }
}

async function getSubmission(submission_id: string): Promise<JotFormResponse> {
    try {
        const response = await fetch(`https://api.jotform.com/submission/${submission_id}?apiKey=${API_KEY}`);
        const data: JotFormResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching submission:", error);
        throw error;
    }
}

export async function getRoomie(celular: string) {
    const roomieInfo = await getUserInfo(celular)
    const submission = getSubmission(roomieInfo.submission_id)
    const roomie = createRoomie(submission)
    return roomie
}

export async function getRoomieArrendador(celular: string) {
    const roomieArrendadorInfo = await getUserInfo(celular)
    const submission = getSubmission(roomieArrendadorInfo.submission_id)
    const roomieArrendador = createRoomieArrendador(submission)
    return roomieArrendador
}

