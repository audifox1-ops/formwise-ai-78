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

// ── 1단계: 문서 심층 분석
export async function deepAnalyzeDocument(
  fileContent: string,
  fileName: string
): Promise<AnalyzedDocument> {
  const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(GEMINI_URL(API_KEY), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `너는 전문 문서 분석 AI야. 아래 문서를 심층적으로 분석해서 JSON으로만 반환해. JSON 외 텍스트 절대 금지.

파일명: ${fileName}
문서 내용:
"""
${fileContent.slice(0, 6000)}
"""

다음 형식으로 분석 결과를 반환해:
{
  "title": "문서 제목",
  "documentType": "보고서|제안서|공문|계획서|회의록|계약서|기획서|기타",
  "summary": "문서 전체 요약 (3문장 이내)",
  "deepAnalysis": {
    "purpose": "이 문서의 목적 (1~2문장)",
    "coreMessage": "핵심 메시지 또는 주장 (1문장)",
    "targetAudience": "예상 독자 또는 수신 대상",
    "writingStyle": "문체 설명 (예: 격식체, 구어체, 학술체 등)",
    "tone": "전반적인 톤 (예: 설득형, 정보 전달형, 지시형, 보고형)",
    "qualityScore": 85,
    "qualityReason": "품질 점수 이유 (1~2문장)",
    "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
    "suggestions": [
      "개선 제안 1",
      "개선 제안 2",
      "개선 제안 3"
    ],
    "structureEvaluation": "문서 구조에 대한 평가 (2~3문장)",
    "estimatedReadTime": "예상 읽기 시간 (예: 약 3분)"
  },
  "sections": [
    {
      "id": "section_1",
      "title": "섹션 제목",
      "originalText": "해당 섹션의 원본 텍스트",
      "aiGenerated": false,
      "userIntent": "",
      "importance": "high|medium|low"
    }
  ]
}`
        }]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 3000 }
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as AnalyzedDocument;
}

// ── 2단계: 섹션별 AI 텍스트 생성
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
원본 양식/예시: ${originalText}
작성자 의도: ${userIntent}${contextHint}

작성 조건:
- 전문적이고 격식 있는 문체 유지
- 원본 문서의 톤과 문체를 그대로 반영
- 사람이 직접 쓴 것처럼 자연스럽게
- AI 투의 표현, 상투적 문구 금지
- 작성자의 의도를 충실히 반영`
        }]
      }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 1000 }
    })
  });

  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}

// ── 폼 생성 (기존 유지)
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
      generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
    })
  });

  const data = await response.json();
  const text = data.candidates[0].content.parts[0].text;
  return JSON.parse(text.replace(/```json|```/g, "").trim()) as GeneratedForm;
}