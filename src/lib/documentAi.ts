export interface DocumentSection {
  id: string;
  title: string;
  originalText: string;
  aiGenerated: boolean;
  userIntent: string;
}

export interface AnalyzedDocument {
  title: string;
  documentType: string;
  sections: DocumentSection[];
  summary: string;
}

export async function analyzeDocument(fileContent: string, fileName: string): Promise<AnalyzedDocument> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `다음은 업로드된 문서 내용이야. 이 문서를 분석해서 JSON으로만 반환해줘. JSON 외 텍스트 절대 금지.

파일명: ${fileName}
내용:
${fileContent}

출력 형식:
{
  "title": "문서 제목",
  "documentType": "보고서|제안서|공문|계획서|기타",
  "summary": "문서 전체 요약 (2~3문장)",
  "sections": [
    {
      "id": "section_1",
      "title": "섹션 제목",
      "originalText": "원본 텍스트 내용",
      "aiGenerated": false,
      "userIntent": ""
    }
  ]
}`
          }]
        }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2000 }
      })
    }
  );

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as AnalyzedDocument;
}

export async function generateSectionText(
  sectionTitle: string,
  originalText: string,
  userIntent: string,
  documentType: string
): Promise<string> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `너는 전문 문서 작성 AI야. 아래 조건에 맞게 자연스럽고 사람이 쓴 것처럼 문서 내용을 작성해줘. 텍스트만 반환하고 다른 설명은 절대 하지 마.

문서 유형: ${documentType}
섹션 제목: ${sectionTitle}
원본 양식/예시: ${originalText}
작성자 의도: ${userIntent}

조건:
- 전문적이고 격식있는 문체 사용
- 원본 양식의 구조와 톤 유지
- 사람이 직접 쓴 것처럼 자연스럽게
- 불필요한 AI 투의 표현 금지`
          }]
        }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
      })
    }
  );

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}