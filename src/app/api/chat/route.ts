import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: NextRequest) {
  try {
    const { messages, documentContent, systemPrompt } = await request.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemMessage = `${systemPrompt}

You are a helpful voice assistant. Keep your responses concise and conversational since they will be spoken aloud. Avoid using markdown formatting, bullet points, or numbered lists in your responses.

${documentContent ? `Here is the document content you have access to for reference:
---
${documentContent}
---

You can answer questions about this document, but you are also able to answer general questions on any topic.` : 'You can answer general questions on any topic.'}`;

    const chatHistory = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const contents = [
      { role: "user", parts: [{ text: systemMessage }] },
      { role: "model", parts: [{ text: "I understand. I'll act as a helpful voice assistant. I'll keep my responses concise and conversational. How can I help you?" }] },
      ...chatHistory,
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const responseText = response.text || "I couldn't generate a response.";

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
