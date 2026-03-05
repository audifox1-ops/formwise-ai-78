import { useState, useRef } from "react";
import { analyzeDocument, generateSectionText, AnalyzedDocument, DocumentSection } from "@/lib/documentAi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DocumentWriter() {
  const [step, setStep] = useState<"upload" | "analyze" | "verify" | "edit" | "done">("upload");
  const [document, setDocument] = useState<AnalyzedDocument | null>(null);
  const [rawText, setRawText] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [intents, setIntents] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // ── 파일 업로드 & 분석
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStep("analyze");
    setLoading(true);
    toast.info("문서를 분석하고 있습니다...");
    try {
      const text = await readFileAsText(file);
      setRawText(text);
      const result = await analyzeDocument(text, file.name);
      setDocument(result);
      const initialIntents: Record<string, string> = {};
      result.sections.forEach(s => { initialIntents[s.id] = ""; });
      setIntents(initialIntents);
      setStep("verify"); // 분석 후 검증 단계로
      toast.success("분석 완료! 내용을 확인해주세요.");
    } catch {
      toast.error("분석 실패. 텍스트 기반 파일을 사용해주세요.");
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  // ── 섹션 원본 텍스트 직접 수정
  const handleEditOriginal = (section: DocumentSection) => {
    setEditingId(section.id + "_original");
    setEditText(section.originalText);
  };

  const handleSaveOriginal = (sectionId: string) => {
    setDocument(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, originalText: editText } : s
        )
      };
    });
    setEditingId(null);
    toast.success("수정이 저장되었습니다.");
  };

  // ── 섹션 제목 수정
  const handleEditTitle = (section: DocumentSection) => {
    setEditingId(section.id + "_title");
    setEditText(section.title);
  };

  const handleSaveTitle = (sectionId: string) => {
    setDocument(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === sectionId ? { ...s, title: editText } : s
        )
      };
    });
    setEditingId(null);
    toast.success("제목이 수정되었습니다.");
  };

  // ── 섹션 삭제
  const handleDeleteSection = (sectionId: string) => {
    setDocument(prev => {
      if (!prev) return prev;
      return { ...prev, sections: prev.sections.filter(s => s.id !== sectionId) };
    });
    toast.success("섹션이 삭제되었습니다.");
  };

  // ── 섹션 추가
  const handleAddSection = () => {
    if (!document) return;
    const newId = `section_${Date.now()}`;
    setDocument(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        sections: [...prev.sections, {
          id: newId,
          title: "새 섹션",
          originalText: "내용을 입력하세요.",
          aiGenerated: false,
          userIntent: ""
        }]
      };
    });
    setIntents(prev => ({ ...prev, [newId]: "" }));
    toast.success("섹션이 추가되었습니다.");
  };

  // ── AI 단일 섹션 작성
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

  // ── 전체 AI 작성
  const handleGenerateAll = async () => {
    if (!document) return;
    const targets = document.sections.filter(s => intents[s.id]?.trim());
    if (targets.length === 0) {
      toast.error("최소 하나의 섹션에 작성 의도를 입력해주세요.");
      return;
    }
    for (const section of targets) {
      await handleGenerateSection(section);
    }
    setStep("done");
  };

  // ── 내보내기
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

  const reset = () => {
    setStep("upload");
    setDocument(null);
    setRawText("");
    setFileName("");
    setIntents({});
    setEditingId(null);
  };

  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">AI 문서 작성</p>
        <h2 className="text-4xl font-bold mb-3">문서 양식을 업로드하면<br />AI가 대신 작성해드립니다</h2>
        <p className="text-muted-foreground mb-10">
          보고서, 제안서, 공문서 등 어떤 양식이든 업로드하면<br />
          AI가 구조를 분석하고 내용을 자동으로 작성합니다.
        </p>

        {/* 진행 단계 표시 */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {[
            { key: "upload", label: "① 업로드" },
            { key: "verify", label: "② 내용 확인" },
            { key: "edit",   label: "③ AI 작성" },
            { key: "done",   label: "④ 완료" },
          ].map((s, i, arr) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                step === s.key
                  ? "bg-primary text-primary-foreground"
                  : ["verify","edit","done"].includes(step) && i < arr.findIndex(x => x.key === step)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}>
                {s.label}
              </span>
              {i < arr.length - 1 && <span className="text-muted-foreground text-sm">→</span>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: 업로드 */}
        {step === "upload" && (
          <div
            className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
            onClick={() => fileRef.current?.click()}
          >
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold mb-2">문서 파일을 업로드하세요</h3>
            <p className="text-muted-foreground text-sm mb-6">TXT, DOCX, PDF, XLSX, PPTX 지원</p>
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

        {/* ── STEP 2: 분석 중 */}
        {step === "analyze" && (
          <div className="border rounded-2xl p-16 text-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">문서를 분석하고 있습니다...</h3>
            <p className="text-muted-foreground text-sm">양식 구조, 섹션, 톤을 파악하고 있어요</p>
          </div>
        )}

        {/* ── STEP 3: 업로드 결과 확인 & 검증 */}
        {step === "verify" && document && (
          <div className="space-y-6">
            {/* 분석 요약 */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">✅ 업로드 완료</p>
                  <h3 className="text-2xl font-bold">{document.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">{document.documentType}</span> · {document.sections.length}개 섹션 감지 · {fileName}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{document.summary}</p>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>다시 업로드</Button>
              </div>
            </div>

            {/* 원본 텍스트 확인 */}
            <div className="bg-background border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">📄 원본 텍스트 확인</h4>
                <span className="text-xs text-muted-foreground">{rawText.length.toLocaleString()}자</span>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
                  {rawText.slice(0, 1500)}{rawText.length > 1500 ? "\n\n... (이하 생략)" : ""}
                </pre>
              </div>
            </div>

            {/* 감지된 섹션 확인 및 편집 */}
            <div className="bg-background border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold">🗂 감지된 섹션 확인 · 편집</h4>
                <Button size="sm" variant="outline" onClick={handleAddSection}>+ 섹션 추가</Button>
              </div>
              <p className="text-xs text-muted-foreground">AI가 분석한 섹션 구조입니다. 틀린 부분은 지금 수정하세요.</p>

              {document.sections.map((section) => (
                <div key={section.id} className="border rounded-xl p-4 space-y-3 bg-muted/20">
                  {/* 섹션 제목 */}
                  <div className="flex items-center justify-between gap-2">
                    {editingId === section.id + "_title" ? (
                      <div className="flex gap-2 flex-1">
                        <input
                          className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus:border-primary font-medium"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          autoFocus
                        />
                        <Button size="sm" onClick={() => handleSaveTitle(section.id)}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="font-medium text-sm">{section.title}</span>
                        <button onClick={() => handleEditTitle(section)} className="text-xs text-muted-foreground hover:text-primary transition-colors">✏️ 수정</button>
                      </div>
                    )}
                    <button
                      onClick={() => handleDeleteSection(section.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-2"
                    >🗑 삭제</button>
                  </div>

                  {/* 섹션 내용 */}
                  {editingId === section.id + "_original" ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-primary min-h-[100px] resize-y"
                        value={editText}
                        onChange={e => setEditText(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveOriginal(section.id)}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pr-16">
                        {section.originalText}
                      </p>
                      <button
                        onClick={() => handleEditOriginal(section)}
                        className="absolute top-2 right-2 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all bg-background border rounded px-2 py-1"
                      >✏️ 편집</button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 확인 완료 → 다음 단계 */}
            <div className="flex justify-end">
              <Button size="lg" onClick={() => setStep("edit")}>
                확인 완료 · AI 작성 시작 →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: AI 작성 */}
        {step === "edit" && document && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">{document.documentType}</span>
                  <h3 className="text-2xl font-bold mt-1">{document.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">각 섹션에 작성 의도를 입력하고 AI 작성을 시작하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setStep("verify")}>← 돌아가기</Button>
                  <Button onClick={handleGenerateAll}>✦ 전체 AI 작성</Button>
                </div>
              </div>
            </div>

            {document.sections.map((section) => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold text-lg">{section.title}</h4>
                  {section.aiGenerated && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">✦ AI 작성됨</span>
                  )}
                </div>

                {/* 내용 표시 / 편집 */}
                {editingId === section.id + "_ai" ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/50 outline-none focus:border-primary min-h-[120px] resize-y"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveOriginal(section.id)}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-muted/50 rounded-xl p-4">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap pr-16 ${section.aiGenerated ? "text-foreground" : "text-muted-foreground"}`}>
                      {section.originalText}
                    </p>
                    <button
                      onClick={() => { setEditingId(section.id + "_ai"); setEditText(section.originalText); }}
                      className="absolute top-3 right-3 text-xs text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all bg-background border rounded px-2 py-1"
                    >✏️ 직접 편집</button>
                  </div>
                )}

                {/* 의도 입력 + AI 작성 */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm bg-muted/50 outline-none focus:border-primary"
                    placeholder="예) 3분기 매출 15% 증가, 신규 고객 확보 전략 중심으로"
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
                    ) : section.aiGenerated ? "재작성" : "AI 작성"}
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button size="lg" onClick={() => setStep("done")}>완료 · 최종 확인 →</Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: 완료 & 최종 편집 */}
        {step === "done" && document && (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="text-2xl font-bold mb-1">문서 작성 완료!</h3>
                  <p className="text-muted-foreground text-sm">최종 내용을 확인하고 필요하면 직접 편집 후 다운로드하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setStep("edit")}>← 다시 편집</Button>
                  <Button onClick={handleExport}>📥 문서 다운로드</Button>
                  <Button variant="outline" onClick={reset}>새 문서 작성</Button>
                </div>
              </div>
            </div>

            {document.sections.map((section) => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{section.title}</h4>
                  <div className="flex items-center gap-2">
                    {section.aiGenerated && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">✦ AI 작성</span>
                    )}
                    <button
                      onClick={() => { setEditingId(section.id + "_done"); setEditText(section.originalText); }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors border rounded px-2 py-1"
                    >✏️ 편집</button>
                  </div>
                </div>

                {editingId === section.id + "_done" ? (
                  <div className="space-y-2">
                    <textarea
                      className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/50 outline-none focus:border-primary min-h-[120px] resize-y"
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveOriginal(section.id)}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {section.originalText}
                  </p>
                )}
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={handleExport}>📥 최종 문서 다운로드</Button>
            </div>
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