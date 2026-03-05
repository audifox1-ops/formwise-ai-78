import { useState, useRef, useCallback, useEffect } from "react";
import {
  deepAnalyzeDocument,
  generateSectionText,
  AnalyzedDocument,
  DocumentSection,
} from "@/lib/documentAi";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const IMPORTANCE_COLOR = {
  high:   "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  low:    "bg-muted text-muted-foreground border-border",
};

const IMPORTANCE_LABEL = { high: "중요", medium: "보통", low: "낮음" };

// ✨ 새롭게 추가된 기능: 업로드된 원본 파일을 서버 없이 화면에 100% 가깝게 그려주는 뷰어 컴포넌트
function OriginalFileViewer({ file }: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [excelHtml, setExcelHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setLoading(true);
    setError(false);

    const renderFile = async () => {
      try {
        if (ext === 'pdf') {
          // PDF는 별도 처리 없이 iframe에서 즉시 렌더링됨
          setLoading(false);
        } else if (ext === 'docx') {
          // Word 문서 전용 렌더러 (글꼴, 표, 이미지 디자인 유지)
          // @ts-ignore
          const docx = await import('https://esm.sh/docx-preview@0.3.1');
          if (containerRef.current) {
            await docx.renderAsync(file, containerRef.current, null, {
              className: "docx-viewer",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
          }
          setLoading(false);
        } else if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
          // Excel/CSV 전용 렌더러 (셀 병합 및 원본 레이아웃 유지)
          // @ts-ignore
          const XLSX = await import('https://esm.sh/xlsx@0.18.5');
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_html(ws, { id: "excel-table" });
          setExcelHtml(html);
          setLoading(false);
        } else {
          // 지원하지 않는 포맷
          setError(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("미리보기 렌더링 실패:", err);
        setError(true);
        setLoading(false);
      }
    };

    renderFile();
  }, [file]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-10 text-center">
        <p className="text-4xl mb-4">📄</p>
        <p>이 파일 형식(PPT, HWP 등)의 시각적 원본 미리보기는 현재 브라우저에서 직접 지원하지 않습니다.</p>
        <p className="text-sm mt-2">하지만 AI 텍스트 분석 및 작성 기능은 정상적으로 작동합니다.</p>
      </div>
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase();

  // 1. PDF 100% 렌더링
  if (ext === 'pdf') {
    return <iframe src={URL.createObjectURL(file)} className="w-full h-full border-0 bg-white" title="PDF Preview" />;
  }

  // 2. 엑셀/CSV 렌더링
  if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
    return (
      <div className="w-full h-full overflow-auto bg-[#f3f2f1] p-6">
        <style dangerouslySetInnerHTML={{ __html: `
          #excel-table { border-collapse: collapse; width: max-content; background: white; font-family: sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          #excel-table th, #excel-table td { border: 1px solid #d2d2d2; padding: 6px 12px; font-size: 13px; color: #333; min-width: 80px; }
          #excel-table tr:first-child { background-color: #f3f2f1; font-weight: bold; }
        `}} />
        <div dangerouslySetInnerHTML={{ __html: excelHtml }} />
      </div>
    );
  }

  // 3. 워드 렌더링
  if (ext === 'docx') {
    return <div ref={containerRef} className="w-full h-full overflow-auto bg-[#f3f2f1] p-6" />;
  }

  return null;
}

export default function DocumentWriter() {
  const [step, setStep]         = useState<"upload"|"analyzing"|"deepResult"|"edit"|"done">("upload");
  const [doc, setDoc]           = useState<AnalyzedDocument | null>(null);
  const [rawText, setRawText]   = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // 원본 파일 저장용 상태
  const [loading, setLoading]   = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [intents, setIntents]   = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  const [writeMode, setWriteMode] = useState<"rewrite" | "new">("rewrite");
  const [isOriginalPreviewOpen, setIsOriginalPreviewOpen] = useState(false); // 원본 미리보기 모달
  
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setStep("analyzing");
    setLoading(true);
    setAnalyzeError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'hwp') {
      toast.info("HWP 파일은 브라우저 제약으로 인해 시각적 양식 복원이 어려울 수 있습니다.");
    }

    try {
      const text = await readFileAsText(file);
      
      if (!text || text.trim().length < 10) {
        throw new Error("텍스트를 추출할 수 없습니다. 내용이 비어있거나 암호화된 파일인지 확인해주세요.");
      }
      setRawText(text);
      toast.info("AI가 문서 내용을 심층 분석 중...");
      
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

  const handleStartEdit = () => {
    if (writeMode === "new" && doc) {
      setDoc(prev => prev ? {
        ...prev,
        sections: prev.sections.map(s => ({
          ...s,
          originalText: "",
        }))
      } : prev);
    }
    setStep("edit");
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
    } catch { 
      toast.error("생성 실패. 다시 시도해주세요."); 
    } finally { 
      setLoadingSection(null); 
    }
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
    a.download = `${doc?.title}_AI작성완료.txt`;
    a.click();
    toast.success("다운로드 완료!");
  };

  const reset = () => {
    setStep("upload"); setDoc(null);
    setRawText(""); setUploadedFile(null);
    setIntents({}); setEditingId(null);
    setAnalyzeError(null);
    setWriteMode("rewrite");
    setIsOriginalPreviewOpen(false);
  };

  const steps = [
    { key: "upload",     label: "① 업로드" },
    { key: "deepResult", label: "② 분석/양식확인" },
    { key: "edit",       label: "③ AI 작성" },
    { key: "done",       label: "④ 완료" },
  ];
  
  const stepOrder = ["upload","analyzing","deepResult","edit","done"];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <section className="relative py-24 px-6 bg-muted/20 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">AI 문서 작성</p>
        <h2 className="text-4xl font-bold mb-3">문서를 업로드하면<br />원본 양식을 확인하고 AI가 작성합니다</h2>
        <p className="text-muted-foreground mb-10">
          올려주신 문서의 디자인은 유지하며, 필요한 부분만 AI를 통해 스마트하게 편집하세요.
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
                PDF · DOCX · XLSX · CSV 지원<br />
                <span className="text-xs text-primary/80">원본 레이아웃 그대로 화면에서 확인하고 편집할 수 있습니다.</span>
              </p>
              <Button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                파일 선택하기
              </Button>
              <input ref={fileRef} type="file" className="hidden"
                accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.csv"
                onChange={handleFileInput} />
            </div>
          </div>
        )}

        {/* ── STEP 2: 분석 중 */}
        {step === "analyzing" && (
          <div className="border rounded-2xl p-16 text-center space-y-6">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-xl font-semibold mb-2">AI가 원본 양식을 분석하고 텍스트를 추출합니다</h3>
              <p className="text-muted-foreground text-sm">{fileName}</p>
            </div>
            <div className="flex justify-center gap-4 text-sm text-muted-foreground flex-wrap">
              {["양식 유지 렌더링 준비", "텍스트/표 데이터 추출", "문서 구조 파악", "작성 제안 생성"].map(t => (
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
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setIsOriginalPreviewOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    👀 원본 파일 미리보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset}>다시 업로드</Button>
                </div>
              </div>
            </div>

            <div className="bg-background border rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h4 className="font-bold text-lg">🧠 AI 심층 분석 결과</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnalysisCard icon="🎯" label="문서 목적"      value={doc.deepAnalysis.purpose} />
                <AnalysisCard icon="💡" label="핵심 메시지"    value={doc.deepAnalysis.coreMessage} />
                <AnalysisCard icon="👥" label="대상 독자"      value={doc.deepAnalysis.targetAudience} />
                <AnalysisCard icon="✍️" label="문체 · 톤"     value={`${doc.deepAnalysis.writingStyle} / ${doc.deepAnalysis.tone}`} />
              </div>
            </div>

            <div className="bg-background border rounded-2xl p-6 space-y-4">
              <h4 className="font-semibold">⚙️ AI 텍스트 편집 모드 선택</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setWriteMode("rewrite")}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    writeMode === "rewrite" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50 bg-muted/30"
                  }`}
                >
                  <div className="font-semibold mb-1">📝 기존 내용 수정하기</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">원본 파일에서 추출된 내용을 유지하며 AI를 통해 수정/보완합니다.</p>
                </button>
                <button
                  onClick={() => setWriteMode("new")}
                  className={`p-4 border rounded-xl text-left transition-all ${
                    writeMode === "new" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50 bg-muted/30"
                  }`}
                >
                  <div className="font-semibold mb-1">✨ 새 내용 작성하기</div>
                  <p className="text-xs text-muted-foreground leading-relaxed">기존 텍스트를 모두 비우고 구조만 유지한 채 완전히 새로 작성합니다.</p>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="lg" onClick={handleStartEdit}>
                다음 단계: 텍스트 내용 AI 편집 →
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
                  <span className="text-xs font-semibold text-primary uppercase tracking-widest">내용 편집 단계</span>
                  <h3 className="text-2xl font-bold mt-1">{doc.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    각 영역에 AI에게 지시할 작성 의도를 입력하세요.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" onClick={() => setIsOriginalPreviewOpen(true)}>
                    👀 원본 양식 보기
                  </Button>
                  <Button onClick={generateAll}>✦ 전체 AI 작성</Button>
                </div>
              </div>
            </div>

            {doc.sections.map(section => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{section.title}</h4>
                  </div>
                  {section.aiGenerated && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">✦ AI 작성됨</span>
                  )}
                </div>

                {editingId === section.id + "_edit" ? (
                  <div className="space-y-2">
                    <textarea className="w-full border rounded-xl px-4 py-3 text-sm bg-muted/50 outline-none focus:border-primary min-h-[120px] resize-y"
                      value={editText} onChange={e => setEditText(e.target.value)} autoFocus placeholder="내용을 입력하세요..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-muted/50 rounded-xl p-4 min-h-[80px]">
                    <div className={`text-sm text-foreground/90 whitespace-pre-wrap ${!section.originalText && "text-muted-foreground italic"}`}>
                      {section.originalText || "비어있는 텍스트 영역입니다. 의도를 입력하여 내용을 채워보세요."}
                    </div>
                    <button
                      onClick={() => { setEditingId(section.id + "_edit"); setEditText(section.originalText); }}
                      className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-all bg-background border rounded px-2 py-1 hover:text-primary">
                      ✏️ 텍스트 편집
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <input type="text"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm bg-muted/50 outline-none focus:border-primary"
                    placeholder="예) 문맥을 더 정중하게 수정해줘"
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

            <div className="flex justify-end gap-3">
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
                  <h3 className="text-2xl font-bold mb-1">문서 편집 완료!</h3>
                  <p className="text-muted-foreground text-sm">최종 텍스트를 확인하고 저장하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => setStep("edit")}>← 다시 편집</Button>
                  <Button onClick={exportDoc}>📥 다운로드</Button>
                </div>
              </div>
            </div>

            {doc.sections.map(section => (
              <div key={section.id} className="bg-background border rounded-2xl p-6 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-semibold">{section.title}</h4>
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
                  <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {section.originalText}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 브라우저 내장 100% 양식 지원 원본 파일 뷰어 모달 ── */}
      {isOriginalPreviewOpen && uploadedFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white shadow-2xl rounded-xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* 상단 헤더 */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 text-white z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-xl">📄</span>
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{uploadedFile.name}</h3>
                  <p className="text-xs text-zinc-400 mt-1">100% 원본 뷰어 (글꼴 및 디자인 유지 모드)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOriginalPreviewOpen(false)} 
                className="p-2 hover:bg-white/20 rounded transition-colors"
              >
                닫기 ✕
              </button>
            </div>
            
            {/* 100% 렌더링 뷰어 영역 */}
            <div className="flex-1 bg-zinc-100 flex items-center justify-center relative overflow-hidden">
              <OriginalFileViewer file={uploadedFile} />
            </div>
          </div>
        </div>
      )}

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

/** * 텍스트 추출용 (기존 AI 분석 엔진) */
async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buffer = await file.arrayBuffer();

  try {
    if (ext === 'docx') {
      // @ts-ignore
      const mammothModule = await import('https://esm.sh/mammoth@1.6.0');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }

    if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
      // @ts-ignore
      const XLSX = await import('https://esm.sh/xlsx@0.18.5');
      const workbook = XLSX.read(buffer, { type: 'array' });
      let text = '';
      workbook.SheetNames.forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
      });
      return text;
    }

    if (ext === 'pdf') {
      // @ts-ignore
      const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    }

    return decodeTextFallback(buffer);

  } catch (error) {
    return decodeTextFallback(buffer);
  }
}

function decodeTextFallback(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(uint8Array);
  } catch (err) {
    return new TextDecoder("euc-kr").decode(uint8Array);
  }
}
