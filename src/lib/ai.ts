export interface FormField {
  type: "text" | "email" | "textarea" | "select" | "radio" | "checkbox";
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface GeneratedForm {
  title: string;
  description: string;
  fields: FormField[];
}

export async function generateFormWithAI(prompt: string): Promise<GeneratedForm> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음 요청에 맞는 폼을 JSON으로만 생성해줘. JSON 외 다른 텍스트 절대 포함 금지.

요청: "${prompt}"

출력 형식:
{
  "title": "폼 제목",
  "description": "폼 설명",
  "fields": [
    {
      "type": "text|email|textarea|select|radio|checkbox",
      "label": "필드명",
      "required": true,
      "placeholder": "힌트텍스트",
      "options": ["옵션1","옵션2"]
    }
  ]
}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as GeneratedForm;
}