"use server";

import Groq from "groq-sdk";
import OpenAI from "openai";

interface ReceiptData {
	merchant?: string;
	amount?: number;
	date?: string;
	currency?: string;
	category?: string;
	items?: string[];
}

export async function ExtractReceiptData(imageBase64: string): Promise<{
	success: boolean;
	data?: ReceiptData;
	error?: string;
}> {
	const groqApiKey = process.env.GROQ_API_KEY;
	const openRouterApiKey = process.env.OPENROUTER_API_KEY;

	if (!groqApiKey && !openRouterApiKey) {
		return { success: false, error: "No AI API keys configured" };
	}

	const prompt = `You are a receipt/transaction analyzer. Extract the following information from this receipt or bank statement image:
- Merchant/Store name
- Total amount (number only, no currency symbols)
- Date (in YYYY-MM-DD format if possible)
- Currency (USD, EUR, etc.)
- Suggested category (one of: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Travel, Other)
- List of items purchased (if visible)

Return ONLY a valid JSON object with these exact keys: merchant, amount, date, currency, category, items (array).
If you cannot find a field, use null. Be precise with the amount.`;

	// Try Groq with llama-3.2-90b-vision-preview first
	if (groqApiKey) {
		try {
			const groq = new Groq({ apiKey: groqApiKey });

			const completion = await groq.chat.completions.create({
				model: "llama-3.2-90b-vision-preview",
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: prompt },
							{
								type: "image_url",
								image_url: { url: imageBase64 },
							},
						],
					},
				],
				temperature: 0.1,
				max_tokens: 1000,
			});

			const responseText = completion.choices[0]?.message?.content || "";
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);

			if (jsonMatch) {
				const data = JSON.parse(jsonMatch[0]) as ReceiptData;
				return { success: true, data };
			}
		} catch (error: any) {
			console.error("Groq vision error:", error.message);
		}
	}

	// Fallback to OpenRouter with gpt-4o
	if (openRouterApiKey) {
		try {
			const client = new OpenAI({
				baseURL: "https://openrouter.ai/api/v1",
				apiKey: openRouterApiKey,
			});

			const completion = await client.chat.completions.create({
				model: "openai/gpt-4o",
				messages: [
					{
						role: "user",
						content: [
							{ type: "text", text: prompt },
							{
								type: "image_url",
								image_url: { url: imageBase64 },
							},
						],
					},
				],
				temperature: 0.1,
				max_tokens: 1000,
			});

			const responseText = completion.choices[0]?.message?.content || "";
			const jsonMatch = responseText.match(/\{[\s\S]*\}/);

			if (jsonMatch) {
				const data = JSON.parse(jsonMatch[0]) as ReceiptData;
				return { success: true, data };
			}
		} catch (error: any) {
			console.error("OpenRouter vision error:", error.message);
		}
	}

	return {
		success: false,
		error: "Failed to extract receipt data from all providers",
	};
}
