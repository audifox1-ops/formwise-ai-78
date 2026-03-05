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
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `다음 요청에 맞는 폼을 JSON으로만 생성해줘. JSON 외 다른 텍스트 절대 포함 금지.

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
    })
  });
  const data = await response.json();
  const text = data.content.map((i: any) => i.text || "").join("");
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as GeneratedForm;
}