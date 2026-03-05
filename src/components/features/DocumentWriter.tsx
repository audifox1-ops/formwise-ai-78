import { useState, useRef, useCallback } from "react";
import {
  deepAnalyzeDocument,
  generateSectionText,
  AnalyzedDocument,
  DocumentSection,
  DeepAnalysis,
} from "@/lib/documentAi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const IMPORTANCE_COLOR = {
  high:   "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low:    "bg-muted text-muted-foreground border-border",
};
const IMPORTANCE_LABEL = { high: "중요", medium: "보통", low: "낮음" };

export default function DocumentWriter() {
  const [step, setStep]         = useState<"upload"|"analyzing"|"deepResult"|"edit"|"done">("upload");
  const [doc, setDoc]           = useState<AnalyzedDocument | null>(null);
  const [rawText, setRawText]   = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading]   = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [intents, setIntents]   = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setFileName(file.name);
    setStep("analyzing");
    setLoading(true);
    setAnalyzeError(null);
    try {
      const text = await readFileAsText(file);
      if (!text || text.trim().length < 10) {
        throw new Error("텍스트를 읽을 수 없습니다. TXT 또는 DOCX 파일을 사용해주세요.");
      }
      setRawText(text);
      toast.info("AI가 문서를 심층 분석 중...");
      const result = await deepAnalyzeDocument(text, file.name);
      if (!result?.deepAnalysis) throw new Error("분석 결과가 올바르지 않습니다.");
      setDoc(result);
      const init: Record<string, string> = {};
      result.sections.forEach(s => { init[s.id] = ""; });
      setIntents(init);
      setStep("deepResult");
      toast.success("심층 분석 완료!");
    } catch (err: any) {
      const msg = err?.message ?? "알 수 없는 오류";
      setAnalyzeError(msg);
      toast.error("분석 실패: " + msg);
      setStep("upload");
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const onDragOver  = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const onDragLeave = useCallback(() => setIsDragging(false), []);
  const onDrop      = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, []);

  const saveEdit = (sectionId: string, field: "title" | "originalText") => {
    setDoc(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId ? { ...s, [field]: editText } : s
      )
    } : prev);
    setEditingId(null);
    toast.success("저장되었습니다.");
  };

  const deleteSection = (id: string) => {
    setDoc(prev => prev ? { ...prev, sections: prev.sections.filter(s => s.id !== id) } : prev);
    toast.success("섹션이 삭제되었습니다.");
  };

  const addSection = () => {
    const newId = `section_${Date.now()}`;
    setDoc(prev => prev ? {
      ...prev,
      sections: [...prev.sections, {
        id: newId, title: "새 섹션", originalText: "내용을 입력하세요.",
        aiGenerated: false, userIntent: "", importance: "medium"
      }]
    } : prev);
    setIntents(prev => ({ ...prev, [newId]: "" }));
  };

  const generateOne = async (section: DocumentSection) => {
    if (!intents[section.id]?.trim()) { toast.error("작성 의도를 입력해주세요."); return; }
    setLoadingSection(section.id);
    try {
      const text = await generateSectionText(
        section.title, section.originalText,
        intents[section.id], doc!.documentType, doc!.deepAnalysis
      );
      setDoc(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s =>
          s.id === section.id ? { ...s, originalText: text, aiGenerated: true } : s
        )
      } : prev);
      toast.success(`"${section.title}" 작성 완료!`);
    } catch { toast.error("생성 실패. 다시 시도해주세요."); }
    finally { setLoadingSection(null); }
  };

  const generateAll = async () => {
    const targets = doc?.sections.filter(s => intents[s.id]?.trim()) ?? [];
    if (!targets.length) { toast.error("의도를 입력한 섹션이 없습니다."); return; }
    for (const s of targets) await generateOne(s);
    setStep("done");
  };

  const exportDoc = () => {
    if (!doc) return;
    const content = doc.sections.map(s => `[${s.title}]\n${s.originalText}`).join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = window.document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc.title}_AI작성완료.txt`;
    a.click();
    toast.success("다운로드 완료!");
  };

  const reset = () => {
    setStep("upload"); setDoc(null);
    setRawText(""); setFileName("");
    setIntents({}); setEditingId(null);
    setAnalyzeError(null);
  };

  const steps = [
    { key: "upload",     label: "① 업로드" },
    { key: "deepResult", label: "② 심층 분석" },
    { key: "edit",       label: "③ AI 작성" },
    { key: "done",       label: "④ 완료" },
  ];
  const stepOrder = ["upload","analyzing","deepResult","edit","done"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <section className="py-24 px-6 bg-muted/20">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">AI 문서 작성</p>
        <h2 className="text-4xl font-bold mb-3">문서를 업로드하면<br />AI가 심층 분석 후 작성합니다</h2>
        <p className="text-muted-foreground mb-10">
          목적·톤·구조를 AI가 완전히 파악한 뒤 작성을 시작합니다.
        </p>

        {/* 진행 단계 바 */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`text-sm font-medium px-3 py-1 rounded-full transition-colors ${
                step === s.key || (step === "analyzing" && s.key === "upload")
                  ? "bg-primary text-primary-foreground"
                  : currentIdx > stepOrder.indexOf(s.key)
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}>{s.label}</span>
              {i < steps.length - 1 && <span className="text-muted-foreground">→</span>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: 업로드 */}
        {step === "upload" && (
          <div className="space-y-4">
            {analyzeError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-500">
                ⚠️ {analyzeError}
              </div>
            )}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-primary bg-primary/10 scale-[1.01]"
                  : "border-border hover:border-primary hover:bg-primary/5"
              }`}
            >
              <div className="text-6xl mb-4">{isDragging ? "📂" : "📄"}</div>
              <h3 className="text-xl font-semibold mb-2">
                {isDragging ? "여기에 놓으세요!" : "파일을 드래그하거나 클릭해서 업로드"}
              </h3>
              <p className="text-muted-foreground text-sm mb-6">
                TXT · DOCX · PDF · XLSX · PPTX 지원<br />
                <span className="text-xs">(텍스트 추출이 가능한 파일 권장)</span>
              </p>
              <Button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                파일 선택하기
              </Button>
              <input ref={fileRef} type="file" className="hidden"
                accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx"
                onChange={handleFileInput} />
            </div>
          </div>
        )}

        {/* ── STEP 2: 분석 중 */}
        {step === "analyzing" && (
          <div className="border rounded-2xl p-16 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">AI가 문서를 심층 분석하고 있습니다</h3>
              <p className="text-muted-foreground text-sm">{fileName}</p>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              {["문서 구조 파악", "문체·톤 분석", "핵심 키워드 추출", "개선 제안 생성"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: 심층 분석 결과 */}
        {step === "deepResult" && doc && (
          <div className="space-y-6">
            {/* 문서 기본 정보 */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-primary uppercase tracking-widest">{doc.documentType}</span>
                    <span className="text-xs text-muted-foreground">· {fileName}</span>
                  </div>
                  <h3 className="text-2xl font-bold">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{doc.summary}</p>
                </div>
                <Button variant="outline" size="sm" onClick={reset}>다시 업로드</Button>
              </div>
            </div>

            {/* 심층 분석 결과 */}
            <div className="bg-background border rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h4 className="font-bold text-lg">🧠 AI 심층 분석 결과</h4>
                <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-1.5">
                  <span className="text-sm text-muted-foreground">문서 품질</span>
                  <span className={`text-xl font-bold ${
                    doc.deepAnalysis.qualityScore >= 80 ? "text-green-500" :
                    doc.deepAnalysis.qualityScore >= 60 ? "text-yellow-500" : "text-red-500"
                  }`}>{doc.deepAnalysis.qualityScore}</span>
                  <span className="text-xs text-muted-foreground">/ 100</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnalysisCard icon="🎯" label="문서 목적"      value={doc.deepAnalysis.purpose} />
                <AnalysisCard icon="💡" label="핵심 메시지"    value={doc.deepAnalysis.coreMessage} />
                <AnalysisCard icon="👥" label="대상 독자"      value={doc.deepAnalysis.targetAudience} />
                <AnalysisCard icon="✍️" label="문체 · 톤"     value={`${doc.deepAnalysis.writingStyle} / ${doc.deepAnalysis.tone}`} />
                <AnalysisCard icon="⏱"  label="예상 읽기 시간" value={doc.deepAnalysis.estimatedReadTime} />
                <AnalysisCard icon="📊" label="품질 평가"      value={doc.deepAnalysis.qualityReason} />
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">🔑 핵심 키워드</p>
                <div className="flex flex-wrap gap-2">
                  {doc.deepAnalysis.keywords.map(k => (
                    <span key={k} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 font-medium">{k}</span>
                  ))}
                </div>
              </div>

              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-semibold mb-1">📐 구조 평가</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{doc.deepAnalysis.structureEvaluation}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">💬 AI 개선 제안</p>
                <div className="space-y-2">
                  {doc.deepAnalysis.suggestions.map((s, i) => (
                    <div key={i} className="flex gap-3 bg-muted/40 rounded-xl p-3">
                      <span className="text-primary font-bold text-sm flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 원본 텍스트 */}
            <div className="bg-background border rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">📄 원본 텍스트</h4>
                <span className="text-xs text-muted-foreground">{rawText.length.toLocaleString()}자</span>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 max-h-48 overflow-y-auto">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed font-sans">
                  {rawText.slice(0, 1500)}{rawText.length > 1500 ? "\n\n... (이하 생략)" : ""}
                </pre>
              </div>
            </div>

            {/* 감지된 섹션 */}
            <div className="bg-background border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="font-semibold">🗂 감지된 섹션 ({doc.sections.length}개)</h4>
                <Button size="sm" variant="outline" onClick={addSection}>+ 섹션 추가</Button>
              </div>
              {doc.sections.map(section => (
                <div key={section.id} className="border rounded-xl p-4 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    {editingId === section.id + "_title" ? (
                      <div className="flex gap-2 flex-1">
                        <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-background outline-none focus:border-primary"
                          value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                        <Button size="sm" onClick={() => saveEdit(section.id, "title")}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className="font-medium text-sm">{section.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${IMPORTANCE_COLOR[section.importance]}`}>
                          {IMPORTANCE_LABEL[section.importance]}
                        </span>
                        <button onClick={() => { setEditingId(section.id + "_title"); setEditText(section.title); }}
                          className="text-xs text-muted-foreground hover:text-primary transition-colors">✏️</button>
                      </div>
                    )}
                    <button onClick={() => deleteSection(section.id)}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors">🗑</button>
                  </div>

                  {editingId === section.id + "_original" ? (
                    <div className="space-y-2">
                      <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-background outline-none focus:border-primary min-h-[90px] resize-y"
                        value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap line-clamp-3 pr-16">
                        {section.originalText}
                      </p>
                      <button
                        onClick={() => { setEditingId(section.id + "_original"); setEditText(section.originalText); }}
                        className="absolute top-2 right-2 text-xs opacity-0 group-hover:opacity-100 transition-all bg-background border rounded px-2 py-1 hover:text-primary">
                        ✏️ 편집
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button size="lg" onClick={() => setStep("edit")}>
                확인 완료 · AI 작성 시작 →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: AI 작성 */}
        {step === "edit" && doc && (
          <div className="space-y-6">
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">{doc.documentType}</span>
                  <h3 className="text-2xl font-bold mt-1">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">각 섹션에 작성 의도를 입력 후 AI 작성을 시작하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setStep("deepResult")}>← 분석 결과</Button>
                  <Button onClick={generateAll}>✦ 전체 AI 작성</Button>
                </div>
              </div>
            </div>

            {doc.sections.map(section => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{section.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${IMPORTANCE_COLOR[section.importance]}`}>
                      {IMPORTANCE_LABEL[section.importance]}
                    </span>
                  </div>
                  {section.aiGenerated && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">✦ AI 작성됨</span>
                  )}
                </div>

                {editingId === section.id + "_edit" ? (
                  <div className="space-y-2">
                    <textarea className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/50 outline-none focus:border-primary min-h-[120px] resize-y"
                      value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-muted/50 rounded-xl p-4">
                    <p className={`text-sm leading-relaxed whitespace-pre-wrap pr-16 ${section.aiGenerated ? "text-foreground" : "text-muted-foreground"}`}>
                      {section.originalText}
                    </p>
                    <button
                      onClick={() => { setEditingId(section.id + "_edit"); setEditText(section.originalText); }}
                      className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-all bg-background border rounded px-2 py-1 hover:text-primary">
                      ✏️ 직접 편집
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input type="text"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm bg-muted/50 outline-none focus:border-primary"
                    placeholder="예) 3분기 매출 15% 증가, 신규 고객 확보 전략 중심으로"
                    value={intents[section.id] || ""}
                    onChange={e => setIntents(p => ({ ...p, [section.id]: e.target.value }))} />
                  <Button size="sm" onClick={() => generateOne(section)} disabled={loadingSection === section.id}>
                    {loadingSection === section.id
                      ? <span className="flex items-center gap-1"><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />작성 중</span>
                      : section.aiGenerated ? "재작성" : "AI 작성"}
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <Button size="lg" onClick={() => setStep("done")}>완료 · 최종 확인 →</Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: 완료 */}
        {step === "done" && doc && (
          <div className="space-y-6">
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-3xl mb-2">🎉</div>
                  <h3 className="text-2xl font-bold mb-1">문서 작성 완료!</h3>
                  <p className="text-muted-foreground text-sm">최종 내용을 확인하고 편집 후 다운로드하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setStep("edit")}>← 다시 편집</Button>
                  <Button onClick={exportDoc}>📥 다운로드</Button>
                  <Button variant="outline" onClick={reset}>새 문서 작성</Button>
                </div>
              </div>
            </div>

            {doc.sections.map(section => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{section.title}</h4>
                    {section.aiGenerated && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">✦ AI 작성</span>
                    )}
                  </div>
                  <button
                    onClick={() => { setEditingId(section.id + "_done"); setEditText(section.originalText); }}
                    className="text-xs text-muted-foreground hover:text-primary border rounded px-2 py-1 transition-colors">
                    ✏️ 편집
                  </button>
                </div>

                {editingId === section.id + "_done" ? (
                  <div className="space-y-2">
                    <textarea className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/50 outline-none focus:border-primary min-h-[120px] resize-y"
                      value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{section.originalText}</p>
                )}
              </div>
            ))}

            <div className="flex justify-center pt-4">
              <Button size="lg" onClick={exportDoc}>📥 최종 문서 다운로드</Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AnalysisCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="bg-muted/50 rounded-xl p-4">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{icon} {label}</p>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file, "utf-8");
  });
}