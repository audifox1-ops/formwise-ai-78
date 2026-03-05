import { useState, useRef } from "react";
import { analyzeDocument, generateSectionText, AnalyzedDocument, DocumentSection } from "@/lib/documentAi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DocumentWriter() {
  const [step, setStep] = useState<"upload" | "analyze" | "edit" | "done">("upload");
  const [document, setDocument] = useState<AnalyzedDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [intents, setIntents] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "text/plain",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];

    setLoading(true);
    setStep("analyze");
    toast.info("문서를 분석하고 있습니다...");

    try {
      const text = await readFileAsText(file);
      const result = await analyzeDocument(text, file.name);
      setDocument(result);
      const initialIntents: Record<string, string> = {};
      result.sections.forEach(s => { initialIntents[s.id] = ""; });
      setIntents(initialIntents);
      setStep("edit");
      toast.success("문서 분석 완료!");
    } catch {
      toast.error("분석 실패. 텍스트 기반 파일(.txt, .docx 등)을 사용해주세요.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateSection = async (section: DocumentSection) => {
    const intent = intents[section.id];
    if (!intent.trim()) {
      toast.error("작성 의도를 먼저 입력해주세요.");
      return;
    }
    setLoadingSection(section.id);
    try {
      const generated = await generateSectionText(
        section.title,
        section.originalText,
        intent,
        document!.documentType
      );
      setDocument(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sections: prev.sections.map(s =>
            s.id === section.id
              ? { ...s, originalText: generated, aiGenerated: true }
              : s
          )
        };
      });
      toast.success(`"${section.title}" 작성 완료!`);
    } catch {
      toast.error("생성 실패. 다시 시도해주세요.");
    } finally {
      setLoadingSection(null);
    }
  };

  const handleGenerateAll = async () => {
    if (!document) return;
    const sectionsWithIntent = document.sections.filter(s => intents[s.id]?.trim());
    if (sectionsWithIntent.length === 0) {
      toast.error("최소 하나의 섹션에 작성 의도를 입력해주세요.");
      return;
    }
    for (const section of sectionsWithIntent) {
      await handleGenerateSection(section);
    }
    setStep("done");
  };

  const handleExport = () => {
    if (!document) return;
    const content = document.sections
      .map(s => `[${s.title}]\n${s.originalText}`)
      .join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `${document.title}_AI작성완료.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("문서가 다운로드되었습니다!");
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">AI 문서 작성</p>
        <h2 className="text-4xl font-bold mb-3">문서 양식을 업로드하면<br />AI가 대신 작성해드립니다</h2>
        <p className="text-muted-foreground mb-10">
          보고서, 제안서, 공문서 등 어떤 양식이든 업로드하면<br />
          AI가 구조를 분석하고 내용을 자동으로 작성합니다.
        </p>

        {/* STEP 1: 업로드 */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">문서 파일을 업로드하세요</h3>
            <p className="text-muted-foreground text-sm mb-4">
              TXT, DOCX, PDF, XLSX, PPTX 지원
            </p>
            <Button>파일 선택하기</Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* STEP 2: 분석 중 */}
        {step === "analyze" && (
          <div className="border rounded-2xl p-16 text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">문서를 분석하고 있습니다...</h3>
            <p className="text-muted-foreground text-sm">양식 구조, 섹션, 톤을 파악하고 있어요</p>
          </div>
        )}

        {/* STEP 3: 편집 */}
        {step === "edit" && document && (
          <div className="space-y-6">
            {/* 문서 요약 */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">{document.documentType}</span>
                  <h3 className="text-2xl font-bold mt-1">{document.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{document.summary}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => { setStep("upload"); setDocument(null); }}>
                    다시 업로드
                  </Button>
                  <Button onClick={handleGenerateAll}>
                    ✦ 전체 AI 작성
                  </Button>
                </div>
              </div>
            </div>

            {/* 섹션별 편집 */}
            {document.sections.map((section) => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold text-lg">{section.title}</h4>
                  {section.aiGenerated && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
                      ✦ AI 작성 완료
                    </span>
                  )}
                </div>

                {/* 원본 내용 */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    {section.aiGenerated ? "AI 작성 내용" : "원본 내용"}
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{section.originalText}</p>
                </div>

                {/* 작성 의도 입력 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">작성 의도 입력</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm bg-muted/50 outline-none focus:border-primary"
                      placeholder="예) 3분기 매출 15% 증가, 신규 고객 확보 전략 중심으로 작성"
                      value={intents[section.id] || ""}
                      onChange={(e) => setIntents(prev => ({ ...prev, [section.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      onClick={() => handleGenerateSection(section)}
                      disabled={loadingSection === section.id}
                    >
                      {loadingSection === section.id ? (
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          작성 중
                        </span>
                      ) : "AI 작성"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4: 완료 */}
        {step === "done" && document && (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-2xl font-bold mb-2">문서 작성이 완료되었습니다!</h3>
              <p className="text-muted-foreground text-sm mb-6">AI가 모든 섹션을 전문적으로 작성했습니다.</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={handleExport}>📥 문서 다운로드</Button>
                <Button variant="outline" onClick={() => { setStep("upload"); setDocument(null); }}>새 문서 작성</Button>
              </div>
            </div>

            {document.sections.map((section) => (
              <div key={section.id} className="bg-background border rounded-2xl p-6">
                <h4 className="font-semibold mb-3">{section.title}</h4>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{section.originalText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}