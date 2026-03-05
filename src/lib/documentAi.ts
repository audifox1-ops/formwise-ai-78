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

export interface DocumentSection {
  id: string;
  title: string;
  originalText: string;
  aiGenerated: boolean;
  userIntent: string;
  importance: "high" | "medium" | "low";
}

export interface DeepAnalysis {
  purpose: string;
  coreMessage: string;
  targetAudience: string;
  writingStyle: string;
  tone: string;
  qualityScore: number;
  qualityReason: string;
  keywords: string[];
  suggestions: string[];
  structureEvaluation: string;
  estimatedReadTime: string;
}

export interface AnalyzedDocument {
  title: string;
  documentType: string;
  sections: DocumentSection[];
  summary: string;
  deepAnalysis: DeepAnalysis;
}

const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

function cleanJsonString(raw: string): string {
  // 1. 코드블록 제거
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  // 2. JSON 객체 부분만 추출
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start !== -1 && end !== -1) {
    s = s.slice(start, end + 1);
  }
  // 3. 제어문자 제거 (줄바꿈/탭은 유지)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  return s;
}

function safeFileContent(content: string): string {
  return content
    .slice(0, 3000)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\t/g, " ")
    .trim();
}

export async function deepAnalyzeDocument(
  fileContent: string,
  fileName: string
): Promise<AnalyzedDocument> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const safeContent = safeFileContent(fileContent);

  const prompt = `당신은 문서 분석 전문가입니다. 아래 문서를 분석하고 정확히 아래 JSON 형식으로만 응답하세요. JSON 외에 어떤 텍스트도 출력하지 마세요.

파일명: ${fileName}

문서 내용:
${safeContent}

응답 JSON 형식 (이 형식 그대로 값만 채워서 반환):
{
  "title": "문서 제목",
  "documentType": "보고서",
  "summary": "문서 요약",
  "deepAnalysis": {
    "purpose": "문서 목적",
    "coreMessage": "핵심 메시지",
    "targetAudience": "대상 독자",
    "writingStyle": "문체",
    "tone": "톤",
    "qualityScore": 80,
    "qualityReason": "품질 평가 이유",
    "keywords": ["키워드1", "키워드2", "키워드3"],
    "suggestions": ["제안1", "제안2", "제안3"],
    "structureEvaluation": "구조 평가",
    "estimatedReadTime": "약 3분"
  },
  "sections": [
    {
      "id": "section_1",
      "title": "섹션 제목",
      "originalText": "섹션 내용",
      "aiGenerated": false,
      "userIntent": "",
      "importance": "high"
    }
  ]
}`;

  const response = await fetch(GEMINI_URL(API_KEY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
      },
    }),
  });

  const data = await response.json();

  if (!data.candidates?.[0]) {
    throw new Error("Gemini 응답 없음: " + JSON.stringify(data));
  }

  const raw = data.candidates[0].content.parts[0].text ?? "";
  const clean = cleanJsonString(raw);

  try {
    return JSON.parse(clean) as AnalyzedDocument;
  } catch (e) {
    console.error("파싱 실패 원문:", raw.slice(0, 300));
    throw new Error("문서 분석 결과를 처리할 수 없습니다. 다시 시도해주세요.");
  }
}

export async function generateSectionText(
  sectionTitle: string,
  originalText: string,
  userIntent: string,
  documentType: string,
  deepAnalysis?: DeepAnalysis
): Promise<string> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const contextHint = deepAnalysis
    ? `\n문서 톤: ${deepAnalysis.tone}\n문체: ${deepAnalysis.writingStyle}\n대상 독자: ${deepAnalysis.targetAudience}\n핵심 키워드: ${deepAnalysis.keywords.join(", ")}`
    : "";

  const response = await fetch(GEMINI_URL(API_KEY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `당신은 전문 문서 작성가입니다. 아래 조건에 맞게 내용을 작성해주세요. 작성된 텍스트만 반환하고 설명은 하지 마세요.

문서 유형: ${documentType}
섹션 제목: ${sectionTitle}
원본 양식: ${originalText}
작성자 의도: ${userIntent}${contextHint}

조건: 전문적이고 격식있는 문체, 원본 톤 유지, 자연스럽게, AI 투 표현 금지`
        }]
      }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
    }),
  });

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

export async function generateFormWithAI(prompt: string): Promise<GeneratedForm> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(GEMINI_URL(API_KEY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
      "type": "text",
      "label": "필드명",
      "required": true,
      "placeholder": "힌트텍스트",
      "options": ["옵션1", "옵션2"]
    }
  ]
}`
        }]
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 },
    }),
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/gi, "").trim()) as GeneratedForm;
}