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

// CSV 텍스트를 HTML 표로 변환하는 경량 함수
function parseCSVtoHTML(csvText: string) {
  if (!csvText) return "";
  const lines = csvText.trim().split('\n');
  let html = '<table id="excel-table">';
  lines.forEach((line, i) => {
    if(!line.trim()) return;
    html += '<tr>';
    const cells = line.split(',');
    cells.forEach(cell => {
      const val = cell.trim();
      if(i === 0) html += `<th>${val}</th>`;
      else html += `<td>${val}</td>`;
    });
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

// 업로드된 원본 파일을 화면에 100% 가깝게 그려주는 뷰어 컴포넌트
function OriginalFileViewer({ file }: { file: File }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHtml, setContentHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    setLoading(true);

    const renderFile = async () => {
      try {
        if (ext === 'pdf') {
          // PDF는 iframe으로 즉시 렌더링 (아래 렌더링 조건문에서 분기 처리)
          setLoading(false);
        } 
        else if (ext === 'csv' || ext === 'txt') {
          const buffer = await file.arrayBuffer();
          const text = decodeTextFallback(buffer);
          if (ext === 'csv') {
            setContentHtml(parseCSVtoHTML(text));
          } else {
            setContentHtml(`<pre style="white-space: pre-wrap; font-family: inherit;">${text}</pre>`);
          }
          setLoading(false);
        } 
        else if (ext === 'docx') {
          const docx = await import(/* @vite-ignore */ 'https://esm.sh/docx-preview@0.3.1');
          if (containerRef.current) {
            await docx.renderAsync(file, containerRef.current, null, {
              className: "docx-viewer",
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
            });
          }
          setLoading(false);
        } 
        else if (['xlsx', 'xls'].includes(ext || '')) {
          const XLSX = await import(/* @vite-ignore */ 'https://esm.sh/xlsx@0.18.5');
          const buffer = await file.arrayBuffer();
          const wb = XLSX.read(buffer, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const html = XLSX.utils.sheet_to_html(ws, { id: "excel-table" });
          setContentHtml(html);
          setLoading(false);
        } 
        else if (['pptx', 'ppt', 'hwpx', 'hwp'].includes(ext || '')) {
          // PPT, HWP는 시각적 렌더링이 불가하므로 추출된 텍스트로 우회 렌더링
          const extractedText = await readFileAsText(file);
          setContentHtml(`
            <div style="max-width: 800px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-radius: 8px;">
               <h3 style="color: #ea580c; margin-bottom: 10px; font-size: 18px; font-weight: bold;">⚠️ 디자인 원본 뷰어 미지원 포맷</h3>
               <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; line-height: 1.5;">
                 PPT, HWP 파일은 모바일 브라우저 환경에서 슬라이드나 원본 양식 형태의 시각적 렌더링을 지원하지 않습니다.<br/>
                 대신 <b>AI가 분석을 위해 성공적으로 추출해 낸 텍스트 데이터</b>를 아래에 표시합니다.
               </p>
               <pre style="white-space: pre-wrap; font-family: 'Malgun Gothic', sans-serif; font-size: 14px; line-height: 1.8; color: #334155;">${extractedText || '텍스트를 추출할 수 없습니다. 이미지 위주의 파일일 수 있습니다.'}</pre>
            </div>
          `);
          setLoading(false);
        } 
        else {
          setContentHtml(`<div style="padding: 40px; text-align: center; color: #666;">지원하지 않는 파일 형식입니다.</div>`);
          setLoading(false);
        }
      } catch (err) {
        console.error("미리보기 렌더링 실패:", err);
        setContentHtml(`<div style="padding: 40px; text-align: center; color: red;">파일을 읽는 중 오류가 발생했습니다.</div>`);
        setLoading(false);
      }
    };

    renderFile();
  }, [file]);

  if (loading) {
    return <div className="flex items-center justify-center h-full"><div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  }

  const ext = file.name.split('.').pop()?.toLowerCase();

  // PDF 렌더링
  if (ext === 'pdf') {
    return <iframe src={URL.createObjectURL(file)} className="w-full h-full border-0 bg-white" title="PDF Preview" />;
  }

  // DOCX 렌더링
  if (ext === 'docx') {
    return <div ref={containerRef} className="w-full h-full overflow-auto bg-[#f1f5f9] p-6" />;
  }

  // 엑셀, CSV, 텍스트, PPT, HWP 렌더링
  return (
    <div className="w-full h-full overflow-auto bg-[#f1f5f9] p-4 sm:p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        #excel-table { border-collapse: collapse; width: max-content; background: white; font-family: sans-serif; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        #excel-table th, #excel-table td { border: 1px solid #cbd5e1; padding: 8px 14px; font-size: 13px; color: #334155; min-width: 80px; }
        #excel-table tr:first-child { background-color: #f8fafc; font-weight: bold; }
      `}} />
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  );
}

export default function DocumentWriter() {
  const [step, setStep]         = useState<"upload"|"analyzing"|"deepResult"|"edit"|"done">("upload");
  const [doc, setDoc]           = useState<AnalyzedDocument | null>(null);
  const [rawText, setRawText]   = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); 
  const [loading, setLoading]   = useState(false);
  const [loadingSection, setLoadingSection] = useState<string | null>(null);
  const [intents, setIntents]   = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  
  const [writeMode, setWriteMode] = useState<"rewrite" | "new">("rewrite");
  const [isOriginalPreviewOpen, setIsOriginalPreviewOpen] = useState(false);
  
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploadedFile(file);
    setStep("analyzing");
    setLoading(true);
    setAnalyzeError(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'hwp' || ext === 'ppt') {
      toast.info("구형 HWP/PPT 파일은 텍스트 추출이 완벽하지 않을 수 있습니다. 가급적 HWPX/PPTX를 권장합니다.");
    }

    try {
      const text = await readFileAsText(file);
      
      if (!text || text.trim().length < 5) {
        throw new Error("텍스트를 추출할 수 없습니다. 이미지만 있는 문서이거나 암호화된 파일일 수 있습니다.");
      }
      setRawText(text);
      toast.info("AI가 문서 내용을 심층 분석 중...");
      
      const result = await deepAnalyzeDocument(text, file.name);
      
      if (!result?.deepAnalysis || !result?.sections) {
        throw new Error("분석 결과가 올바르지 않습니다.");
      }
      setDoc(result);
      
      const init: Record<string, string> = {};
      (result.sections || []).forEach(s => { init[s.id] = ""; });
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
      sections: prev.sections?.map(s =>
        s.id === sectionId ? { ...s, [field]: editText } : s
      )
    } : prev);
    setEditingId(null);
    toast.success("저장되었습니다.");
  };

  const deleteSection = (id: string) => {
    setDoc(prev => prev ? { ...prev, sections: prev.sections?.filter(s => s.id !== id) } : prev);
    toast.success("섹션이 삭제되었습니다.");
  };

  const addSection = () => {
    const newId = `section_${Date.now()}`;
    setDoc(prev => prev ? {
      ...prev,
      sections: [...(prev.sections || []), {
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
        sections: prev.sections?.map(s => ({
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
        sections: prev.sections?.map(s =>
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
    const targets = doc?.sections?.filter(s => intents[s.id]?.trim()) ?? [];
    if (!targets.length) { toast.error("의도를 입력한 섹션이 없습니다."); return; }
    
    for (const s of targets) await generateOne(s);
    setStep("done");
  };

  const exportDoc = () => {
    if (!doc) return;
    const content = (doc.sections || []).map(s => `[${s.title}]\n${s.originalText}`).join("\n\n---\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const a = window.document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${doc?.title || '문서'}_AI작성완료.txt`;
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
    <section className="relative py-12 px-6 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">AI 문서 분석 및 재작성</h2>
        <p className="text-gray-500 mb-10 text-sm sm:text-base">
          업로드된 문서를 AI가 완벽히 이해하고 당신의 의도에 맞게 새롭게 작성합니다.
        </p>

        {/* 진행 단계 바 */}
        <div className="flex items-center gap-2 mb-10 flex-wrap">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span className={`text-sm font-medium px-4 py-1.5 rounded-full transition-colors ${
                step === s.key || (step === "analyzing" && s.key === "upload")
                  ? "bg-blue-600 text-white shadow-sm"
                  : currentIdx > stepOrder.indexOf(s.key)
                    ? "bg-blue-50 text-blue-600"
                    : "bg-gray-100 text-gray-400"
              }`}>{s.label}</span>
              {i < steps.length - 1 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>

        {/* ── STEP 1: 업로드 ── */}
        {step === "upload" && (
          <div className="space-y-4 animate-in fade-in duration-300">
            {analyzeError && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 font-medium">
                ⚠️ {analyzeError}
              </div>
            )}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-16 sm:p-24 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-blue-500 bg-blue-50 scale-[1.02]"
                  : "border-gray-200 hover:border-blue-400 hover:bg-blue-50/50"
              }`}
            >
              <div className="text-7xl mb-6 opacity-80">{isDragging ? "📂" : "📄"}</div>
              <h3 className="text-2xl font-bold mb-3 text-gray-800">
                {isDragging ? "여기에 파일을 놓으세요!" : "파일을 드래그하거나 클릭해서 업로드"}
              </h3>
              <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                PDF · DOCX · XLSX · CSV · PPTX · HWP(X) · TXT 지원<br />
                <span className="text-xs text-blue-500 mt-1 inline-block">모든 형태의 문서 데이터를 AI가 자동으로 읽어냅니다.</span>
              </p>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 rounded-xl" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
                기기에서 파일 선택
              </Button>
              <input ref={fileRef} type="file" className="hidden"
                accept=".txt,.doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.hwp,.hwpx,.csv"
                onChange={handleFileInput} />
            </div>
          </div>
        )}

        {/* ── STEP 2: 분석 중 ── */}
        {step === "analyzing" && (
          <div className="border border-gray-100 rounded-3xl p-20 text-center space-y-6 bg-white shadow-sm animate-in fade-in">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">AI가 문서를 해독하고 있습니다</h3>
              <p className="text-gray-500 text-sm">{fileName}</p>
            </div>
          </div>
        )}

        {/* ── STEP 3: 심층 분석 결과 ── */}
        {step === "deepResult" && doc && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase tracking-wider">{doc?.documentType || "문서"}</span>
                    <span className="text-xs text-gray-500">· {fileName}</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{doc?.title || "제목 없음"}</h3>
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">{doc?.summary || "요약 정보가 없습니다."}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setIsOriginalPreviewOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-sm">
                    👀 원본 파일 보기
                  </Button>
                  <Button variant="outline" size="sm" onClick={reset}>다시 업로드</Button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 sm:p-8 space-y-6">
              <h4 className="font-bold text-lg text-gray-800">🧠 AI 심층 분석 결과</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AnalysisCard icon="🎯" label="문서 목적"      value={doc?.deepAnalysis?.purpose || "-"} />
                <AnalysisCard icon="💡" label="핵심 메시지"    value={doc?.deepAnalysis?.coreMessage || "-"} />
                <AnalysisCard icon="👥" label="대상 독자"      value={doc?.deepAnalysis?.targetAudience || "-"} />
                <AnalysisCard icon="✍️" label="문체 · 톤"     value={`${doc?.deepAnalysis?.writingStyle || "-"} / ${doc?.deepAnalysis?.tone || "-"}`} />
              </div>
            </div>

            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                <h4 className="font-bold text-lg text-gray-800">🗂 감지된 문서 영역 ({(doc?.sections || []).length}개)</h4>
                <Button size="sm" variant="outline" onClick={addSection}>+ 빈 섹션 추가</Button>
              </div>
              
              {(doc?.sections || []).map((section, idx) => (
                <div key={section?.id || idx} className="border border-gray-100 rounded-xl p-5 space-y-3 bg-gray-50/50">
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-gray-200 pb-3">
                    {editingId === section.id + "_title" ? (
                      <div className="flex gap-2 flex-1">
                        <input className="flex-1 border rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-500 shadow-sm"
                          value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                        <Button size="sm" onClick={() => saveEdit(section.id, "title")}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 flex-wrap">
                        <span className="font-bold text-gray-800">{section.title || "제목 없음"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${IMPORTANCE_COLOR[section.importance] || IMPORTANCE_COLOR.medium}`}>
                          {IMPORTANCE_LABEL[section.importance] || "보통"}
                        </span>
                        <button onClick={() => { setEditingId(section.id + "_title"); setEditText(section.title); }}
                          className="text-xs text-gray-400 hover:text-blue-600 transition-colors ml-1">✏️ 수정</button>
                      </div>
                    )}
                    <button onClick={() => deleteSection(section.id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors bg-white px-2 py-1 rounded border shadow-sm">🗑 삭제</button>
                  </div>

                  {editingId === section.id + "_original" ? (
                    <div className="space-y-2 pt-2">
                      <textarea className="w-full border rounded-lg px-3 py-3 text-sm bg-white outline-none focus:border-blue-500 min-h-[100px] resize-y shadow-sm font-mono"
                        value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group relative bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pr-16 line-clamp-4 font-mono">
                        {section.originalText || "(내용 없음)"}
                      </p>
                      <button
                        onClick={() => { setEditingId(section.id + "_original"); setEditText(section.originalText); }}
                        className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-all bg-gray-100 border border-gray-200 rounded px-2 py-1 hover:text-blue-600 z-10 font-medium">
                        ✏️ 텍스트 편집
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50/30 border border-blue-100 rounded-2xl p-6 sm:p-8 space-y-5">
              <h4 className="font-bold text-lg text-gray-800">⚙️ AI 재작성 모드 선택</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setWriteMode("rewrite")}
                  className={`p-5 border rounded-xl text-left transition-all bg-white ${
                    writeMode === "rewrite" ? "border-blue-500 ring-2 ring-blue-100 shadow-md" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="font-bold text-gray-800 mb-1">📝 기존 내용 수정하기</div>
                  <p className="text-xs text-gray-500 leading-relaxed">원본 데이터를 유지하며 AI를 통해 문맥에 맞게 수정/보완합니다.</p>
                </button>
                <button
                  onClick={() => setWriteMode("new")}
                  className={`p-5 border rounded-xl text-left transition-all bg-white ${
                    writeMode === "new" ? "border-blue-500 ring-2 ring-blue-100 shadow-md" : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <div className="font-bold text-gray-800 mb-1">✨ 새 내용으로 작성</div>
                  <p className="text-xs text-gray-500 leading-relaxed">기존 텍스트를 모두 비우고 구조만 유지한 채 완전히 새로 작성합니다.</p>
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-md" onClick={handleStartEdit}>
                다음 단계: 텍스트 내용 AI 편집 →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: AI 작성 ── */}
        {step === "edit" && doc && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-md uppercase tracking-wider">내용 편집 단계</span>
                  <h3 className="text-2xl font-bold text-gray-900 mt-3">{doc?.title}</h3>
                  <p className="text-sm text-gray-600 mt-2">각 영역에 AI에게 지시할 작성 의도를 입력하세요.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="secondary" className="bg-white border" onClick={() => setIsOriginalPreviewOpen(true)}>
                    👀 원본 확인
                  </Button>
                  <Button onClick={generateAll} className="bg-blue-600">✦ 전체 AI 작성</Button>
                </div>
              </div>
            </div>

            {(doc?.sections || []).map((section, idx) => (
              <div key={section?.id || idx} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-4">
                  <h4 className="font-bold text-lg text-gray-800">{section.title}</h4>
                  {section.aiGenerated && (
                    <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded-full font-medium">✦ AI 작성됨</span>
                  )}
                </div>

                {editingId === section.id + "_edit" ? (
                  <div className="space-y-2 pt-2">
                    <textarea className="w-full border border-gray-300 rounded-xl p-4 text-sm bg-gray-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[140px] resize-y leading-relaxed"
                      value={editText} onChange={e => setEditText(e.target.value)} autoFocus placeholder="내용을 입력하세요..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="group relative bg-gray-50 border border-gray-100 rounded-xl p-5 min-h-[100px]">
                    <div className={`text-sm leading-relaxed whitespace-pre-wrap font-mono ${!section.originalText && "text-gray-400 italic"}`}>
                      {section.originalText || "비어있는 텍스트 영역입니다. 하단에 의도를 입력하여 내용을 채워보세요."}
                    </div>
                    <button
                      onClick={() => { setEditingId(section.id + "_edit"); setEditText(section.originalText); }}
                      className="absolute top-3 right-3 text-xs opacity-0 group-hover:opacity-100 transition-all bg-white border border-gray-200 rounded px-2 py-1 hover:text-blue-600 shadow-sm font-medium">
                      ✏️ 직접 편집
                    </button>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <input type="text"
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="예) 문맥을 더 정중하고 전문적으로 수정해줘"
                    value={intents[section.id] || ""}
                    onChange={e => setIntents(p => ({ ...p, [section.id]: e.target.value }))} />
                  <Button className="h-auto px-6 rounded-xl" onClick={() => generateOne(section)} disabled={loadingSection === section.id}>
                    {loadingSection === section.id
                      ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />생성중</span>
                      : section.aiGenerated ? "다시 작성" : "AI 작성"}
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-3 pt-6">
              <Button size="lg" variant="outline" className="h-14 px-8 rounded-xl" onClick={() => setStep("deepResult")}>
                ← 이전 단계
              </Button>
              <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-md bg-green-600 hover:bg-green-700" onClick={() => setStep("done")}>
                편집 완료 · 저장하기 →
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: 완료 ── */}
        {step === "done" && doc && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-3xl font-extrabold mb-2 text-green-900">문서 편집 완료!</h3>
              <p className="text-green-700 mb-8">최종 텍스트를 확인하고 필요시 복사하거나 파일로 다운로드하세요.</p>
              
              <div className="flex justify-center gap-3 flex-wrap">
                <Button variant="outline" className="bg-white" onClick={() => setStep("edit")}>← 다시 편집</Button>
                <Button className="bg-green-600 hover:bg-green-700 shadow-md px-8" onClick={exportDoc}>📥 TXT 파일로 다운로드</Button>
                <Button variant="secondary" className="bg-white" onClick={reset}>새 문서 시작</Button>
              </div>
            </div>

            {(doc?.sections || []).map((section, idx) => (
              <div key={section?.id || idx} className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3">
                  <h4 className="font-bold text-gray-800">{section.title}</h4>
                  <button
                    onClick={() => { setEditingId(section.id + "_done"); setEditText(section.originalText); }}
                    className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 rounded px-2 py-1 transition-colors bg-gray-50">
                    ✏️ 최종 수정
                  </button>
                </div>

                {editingId === section.id + "_done" ? (
                  <div className="space-y-2">
                    <textarea className="w-full border border-gray-300 rounded-xl p-4 text-sm bg-gray-50 outline-none focus:border-blue-500 min-h-[140px] resize-y font-mono"
                      value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(section.id, "originalText")}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-mono bg-gray-50 p-4 rounded-xl border border-gray-100">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm">
          <div className="bg-white shadow-2xl rounded-2xl w-full max-w-6xl h-[98vh] sm:h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 bg-[#1e293b] text-white z-10 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-xl">📄</span>
                </div>
                <div className="truncate">
                  <h3 className="text-sm font-bold truncate">{uploadedFile.name}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">원본 뷰어 확인</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOriginalPreviewOpen(false)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors flex shrink-0 items-center gap-1 text-sm font-medium"
              >
                ✕ 닫기
              </button>
            </div>
            
            <div className="flex-1 bg-slate-100 flex items-center justify-center relative overflow-hidden">
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
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1.5">{icon} {label}</p>
      <p className="text-sm text-slate-800 leading-relaxed">{value}</p>
    </div>
  );
}

// 파일에서 텍스트 추출 엔진 (PPT, HWP 지원 복구 포함)
async function readFileAsText(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  try {
    const buffer = await file.arrayBuffer();

    if (ext === 'csv' || ext === 'txt') {
      return decodeTextFallback(buffer);
    }

    if (ext === 'docx') {
      const mammothModule = await import(/* @vite-ignore */ 'https://esm.sh/mammoth@1.6.0');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value;
    }

    if (['xlsx', 'xls'].includes(ext || '')) {
      const XLSX = await import(/* @vite-ignore */ 'https://esm.sh/xlsx@0.18.5');
      const workbook = XLSX.read(buffer, { type: 'array' });
      let text = '';
      (workbook.SheetNames || []).forEach((sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        text += XLSX.utils.sheet_to_csv(sheet) + '\n\n';
      });
      return text;
    }

    if (ext === 'pdf') {
      const pdfjsLib = await import(/* @vite-ignore */ 'https://esm.sh/pdfjs-dist@3.11.174');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += (content.items || []).map((item: any) => item.str).join(' ') + '\n';
      }
      return text;
    }
    
    if (ext === 'pptx') {
      const JSZipModule = await import(/* @vite-ignore */ 'https://esm.sh/jszip@3.10.1');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = await JSZip.loadAsync(buffer);
      let text = '';
      const slideRegex = /ppt\/slides\/slide\d+\.xml/;
      for (const relativePath in zip.files) {
        if (slideRegex.test(relativePath)) {
          const xmlData = await zip.files[relativePath].async('text');
          const matches = xmlData.match(/<a:t>([^<]*)<\/a:t>/g);
          if (matches) {
            text += matches.map((m: string) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
          }
        }
      }
      return text;
    }

    if (ext === 'hwpx') {
       const JSZipModule = await import(/* @vite-ignore */ 'https://esm.sh/jszip@3.10.1');
       const JSZip = JSZipModule.default || JSZipModule;
       const zip = await JSZip.loadAsync(buffer);
       let text = '';
       for (const relativePath in zip.files) {
         if (relativePath.endsWith('.xml')) {
           const xmlData = await zip.files[relativePath].async('text');
           const matches = xmlData.match(/<hp:t[^>]*>([^<]*)<\/hp:t>/g);
           if (matches) {
              text += matches.map((m: string) => m.replace(/<[^>]+>/g, '')).join(' ') + '\n';
           }
         }
       }
       return text;
    }

    if (ext === 'hwp' || ext === 'ppt') {
       const fallbackText = decodeTextFallback(buffer);
       const matched = fallbackText.match(/[가-힣a-zA-Z0-9\s\.\,\!\?]{2,}/g);
       return matched ? matched.join(' ') : fallbackText;
    }

    return decodeTextFallback(buffer);

  } catch (error) {
    console.error("파일 추출 오류 (Fallback 시도):", error);
    try {
      return decodeTextFallback(await file.arrayBuffer());
    } catch {
      return "";
    }
  }
}

function decodeTextFallback(buffer: ArrayBuffer): string {
  try {
    const uint8Array = new Uint8Array(buffer);
    try {
      return new TextDecoder("utf-8", { fatal: true }).decode(uint8Array);
    } catch (err) {
      return new TextDecoder("euc-kr").decode(uint8Array);
    }
  } catch {
    return "";
  }
}
