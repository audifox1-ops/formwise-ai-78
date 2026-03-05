export interface FormField {
  id: string;
  type: "text" | "email" | "textarea" | "select" | "radio" | "checkbox" | "date";
  label: string;
  required: boolean;
  placeholder: string; // Tab 자동완성을 위한 구체적 예시 (필수)
  options?: string[];
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface GeneratedForm {
  title: string;
  version: string;
  date: string;
  sections: FormSection[];
}

export async function generateFormWithAI(formType: string, prompt: string): Promise<GeneratedForm> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `당신은 한국의 대기업 및 공공기관 전문 문서 양식 설계자입니다.
다음 요청에 맞는 문서/양식 작성 템플릿을 JSON으로만 생성해줘. JSON 외 다른 텍스트 절대 포함 금지.

[요구사항 - 한국 업무환경 최적화]
1. 언어/표현: 한국어 비즈니스 용어, 격식있는 공손한 표현 방식 사용.
2. 문서 구조: 국내 기업/기관에서 일반적으로 사용하는 문서 구조 반영.
3. 실용성: 모든 필드에는 사용자가 Tab키를 누르면 바로 채워질 수 있는 매우 구체적이고 현실적인 한국어 예시(placeholder)를 필수로 작성할 것. (예: "홍길동", "2026-03-05", "본 보고서는 3분기 실적 향상을 위한...")

양식명: "${formType}"
추가 요청사항: "${prompt}"

출력 JSON 형식:
{
  "title": "생성된 폼의 공식 제목 (예: 신규 프로젝트 기안서)",
  "version": "v1.0",
  "date": "2026-03-06",
  "sections": [
    {
      "title": "섹션 제목 (예: 1. 기본 정보)",
      "description": "섹션 설명 (선택적)",
      "fields": [
        {
          "id": "고유영문ID",
          "type": "text|email|textarea|select|radio|checkbox|date",
          "label": "필드명",
          "required": true,
          "placeholder": "Tab 키로 바로 적용될 구체적인 예시 내용",
          "options": ["옵션1", "옵션2"] // select, radio, checkbox일 경우만
        }
      ]
    }
  ]
}`
          }]
        }],
        generationConfig: { temperature: 0.7 },
      }),
    }
  );

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const jsonStr = rawText.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  return JSON.parse(jsonStr);
}
