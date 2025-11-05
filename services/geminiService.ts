import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateQuiz = async (topic: string, numQuestions: number, numDescriptive: number): Promise<QuizQuestion[] | null> => {
  if (!process.env.API_KEY) {
    return null;
  }
  try {
    const numMultipleChoice = numQuestions - numDescriptive;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `中学校の「${topic}」に関するクイズを合計${numQuestions}問作成してください。そのうち${numDescriptive}問は記述形式の問題、${numMultipleChoice}問は4択の選択問題にしてください。JSON形式で、各問題にtype ('multiple-choice' or 'descriptive'), question, options (記述問題の場合は空配列), correctAnswer を含めてください。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                questions: {
                    type: Type.ARRAY,
                    description: "生成されたクイズ問題のリスト",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            type: { type: Type.STRING, description: "問題の形式 ('multiple-choice' or 'descriptive')" },
                            question: { type: Type.STRING, description: "問題文" },
                            options: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING },
                                description: "選択肢の配列。記述問題の場合は空配列。"
                            },
                            correctAnswer: { type: Type.STRING, description: "正解" },
                        },
                        required: ['type', 'question', 'options', 'correctAnswer']
                    }
                }
            },
            required: ['questions']
        },
      },
    });

    const jsonText = response.text.trim();
    const quizData = JSON.parse(jsonText);
    
    return quizData.questions as QuizQuestion[];

  } catch (error) {
    console.error("Error generating quiz:", error);
    return null;
  }
};