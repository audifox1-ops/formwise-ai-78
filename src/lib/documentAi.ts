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

function sanitizeJson(raw: string): string {
  // 코드블록 제거
  let clean = raw.replace(/```json|```/gi, "").trim();
  // JSON 문자열 값 안의 제어문자 제거
  clean = clean.replace(/[\u0000-\u001F\u007F]/g, (char) => {
    if (char === "\n") return "\\n";
    if (char === "\r") return "\\r";
    if (char === "\t") return "\\t";
    return "";
  });
  return clean;
}

export async function deepAnalyzeDocument(
  fileContent: string,
  fileName: string
): Promise<AnalyzedDocument> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  // 파일 내용의 특수문자 사전 정리
  const safeContent = fileContent
    .slice(0, 4000)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  const response = await fetch(GEMINI_URL(API_KEY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `너는 전문 문서 분석 AI야. 아래 문서를 심층 분석해서 반드시 유효한 JSON만 반환해. 규칙: 1)JSON 외 텍스트 금지 2)코드블록 금지 3)문자열 값 안에 줄바꿈 금지(공백으로 대체) 4)큰따옴표 안에 큰따옴표 금지.

파일명: ${fileName}
문서내용: ${safeContent}

반환형식:
{"title":"문서제목","documentType":"보고서","summary":"요약 한두문장","deepAnalysis":{"purpose":"목적 한문장","coreMessage":"핵심메시지 한문장","targetAudience":"대상독자","writingStyle":"문체","tone":"톤","qualityScore":80,"qualityReason":"품질이유 한문장","keywords":["키워드1","키워드2","키워드3","키워드4","키워드5"],"suggestions":["제안1","제안2","제안3"],"structureEvaluation":"구조평가 한두문장","estimatedReadTime":"약 3분"},"sections":[{"id":"section_1","title":"섹션제목","originalText":"섹션내용 한두문장","aiGenerated":false,"userIntent":"","importance":"high"}]}`
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000,
        responseMimeType: "application/json"
      }
    })
  });

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const clean = sanitizeJson(raw);

  try {
    return JSON.parse(clean) as AnalyzedDocument;
  } catch {
    // 파싱 실패시 JSON 부분만 추출 재시도
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]) as AnalyzedDocument;
    throw new Error("JSON 파싱 실패: " + clean.slice(0, 100));
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
          text: `너는 전문 문서 작성 AI야. 아래 조건에 맞게 자연스럽고 사람이 쓴 것처럼 작성해줘. 텍스트만 반환하고 다른 설명 절대 하지 마.

문서 유형: ${documentType}
섹션 제목: ${sectionTitle}
원본 양식: ${originalText}
작성자 의도: ${userIntent}${contextHint}

조건:
- 전문적이고 격식 있는 문체
- 원본 문서 톤과 문체 유지
- 사람이 직접 쓴 것처럼 자연스럽게
- AI 투의 표현 금지`
        }]
      }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
    })
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
      "options": ["옵션1","옵션2"]
    }
  ]
}`
        }]
      }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    })
  });

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return JSON.parse(text.replace(/```json|```/gi, "").trim()) as GeneratedForm;
}