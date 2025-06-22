import OpenAI from 'openai';

// Ensure you have VITE_OPENAI_API_KEY in your .env.local file
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    throw new Error('VITE_OPENAI_API_KEY is not set in your environment variables. Please add it to your .env.local file.');
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // This is required for client-side usage
});

export const refineTextWithAI = async (text) => {
    const systemPrompt = 'You are a LaTeX formatting expert. Your job is to find and correctly wrap all LaTeX/math expressions using inline LaTeX delimiters.';
    
    const userPrompt = `
Your task is to format LaTeX expressions in the provided text. Use inline math delimiters only: \\\\(...\\\\)

✅ Rules:
1. Detect all LaTeX or math expressions — such as fractions, square roots, Greek letters, subscripts, superscripts, equations, symbols, etc.
2. Wrap ONLY the math expressions using inline math delimiters: \\\\(...\\\\)
3. DO NOT wrap full sentences — only the math parts.
4. Replace any other math delimiters like \`$\`, \`$.....$\`, \`\\\\[....\\\\]\`, \`[....]\`, etc. with \\\\(...\\\\)
5. Do NOT alter or add/remove any text or content — only wrap the math where necessary.
6. Preserve spacing, punctuation, and formatting outside math expressions.

🧪 Input:
text: "${text}"

🎯 Output format (valid JSON):
{
  "refined_text": "..."
}

Example: For every math expression, wrap it in \\\\(...\\\\). For example:
- Input: The value is 2x + 3.
- Output: The value is \\\\(2x + 3\\\\).

- Input: The answer is 4.12 \\times 10^{-15} V s.
- Output: The answer is \\\\(4.12 \\times 10^{-15} V s\\\\).
    `.trim();

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini', // This model is good with JSON mode
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            response_format: { type: 'json_object' }
        });

        if (response.choices && response.choices[0]) {
            const refinedData = JSON.parse(response.choices[0].message.content);
            if (typeof refinedData.refined_text === 'string') {
                return refinedData.refined_text;
            } else {
                 throw new Error('AI response did not contain a valid refined_text string.');
            }
        } else {
            throw new Error('Invalid response structure from OpenAI API');
        }

    } catch (error) {
        console.error('Error refining question with AI:', error);
        throw new Error('Failed to get a response from the AI. Please check your API key and console for more details.');
    }
}; 