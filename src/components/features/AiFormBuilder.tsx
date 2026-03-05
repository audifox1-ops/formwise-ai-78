import { useState, useRef, useEffect } from "react";
import { generateFormWithAI, GeneratedForm, FormField } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AiFormBuilder() {
  const [formType, setFormType] = useState(""); // 양식명 (예: 보도자료, 보고서)
  const [prompt, setPrompt] = useState("");     // 주요 내용 (추가 요청사항)
  const [form, setForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 입력 폼 데이터 상태 (로컬 스토리지 연동)
  const [formData, setFormData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 1. 양식명에 따른 동적 테마 설정 ──
  const getTheme = (type: string) => {
    if (type.includes("보도") || type.includes("뉴스") || type.includes("언론")) {
      return { start: "#1e3a8a", end: "#3b82f6", color: "#2563eb", image: "url('https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000')" };
    }
    if (type.includes("보고") || type.includes("기안") || type.includes("품의")) {
      return { start: "#0f172a", end: "#334155", color: "#475569", image: "url('https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000')" };
    }
    if (type.includes("계약") || type.includes("동의") || type.includes("신청")) {
      return { start: "#064e3b", end: "#10b981", color: "#059669", image: "url('https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000')" };
    }
    // 기본 테마 (파란색 계열)
    return { start: "#1d4ed8", end: "#60a5fa", color: "#3b82f6", image: "none" };
  };

  const theme = getTheme(formType || form?.title || "");

  // ── 2. 로컬 스토리지 자동 저장 및 불러오기 ──
  useEffect(() => {
    const savedData = localStorage.getItem("documentFormData");
    const savedTemplate = localStorage.getItem("documentFormTemplate");
    const savedFormType = localStorage.getItem("documentFormType");
    
    if (savedData) setFormData(JSON.parse(savedData));
    if (savedTemplate) setForm(JSON.parse(savedTemplate));
    if (savedFormType) setFormType(savedFormType);
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const newData = { ...formData, [id]: value };
    setFormData(newData);
    localStorage.setItem("documentFormData", JSON.stringify(newData));
  };

  // ── 3. Tab 키 예시 내용 자동 적용 (placeholder) ──
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, field: FormField) => {
    if (e.key === "Tab" && !formData[field.id] && field.placeholder) {
      e.preventDefault();
      handleInputChange(field.id, field.placeholder);
      toast.success("예시 내용이 적용되었습니다.");
    }
  };

  // ── 4. 양식 생성 (AI 호출) ──
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formType.trim()) { toast.error("양식명을 입력해주세요."); return; }
    
    setLoading(true);
    try {
      localStorage.setItem("documentFormType", formType);
      const result = await generateFormWithAI(formType, prompt);
      setForm(result);
      localStorage.setItem("documentFormTemplate", JSON.stringify(result));
      toast.success(`${formType} 양식이 생성되었습니다.`);
    } catch {
      toast.error("양식 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  // ── 5. 양식 초기화 ──
  const clearForm = () => {
    setFormData({});
    localStorage.removeItem("documentFormData");
    toast.info("입력된 내용이 초기화되었습니다.");
  };

  // ── 6. 데이터 파일 다운로드 (.json) ──
  const downloadDataFile = () => {
    if (!form) return;
    const exportData = { type: formType, template: form, data: formData };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formType || '양식'}_데이터_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("데이터가 파일로 저장되었습니다.");
  };

  // ── 7. 데이터 파일 업로드 (.json) ──
  const uploadDataFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.type) {
          setFormType(json.type);
          localStorage.setItem("documentFormType", json.type);
        }
        if (json.template) {
          setForm(json.template);
          localStorage.setItem("documentFormTemplate", JSON.stringify(json.template));
        }
        if (json.data) {
          setFormData(json.data);
          localStorage.setItem("documentFormData", JSON.stringify(json.data));
        }
        toast.success("데이터를 성공적으로 불러왔습니다.");
      } catch {
        toast.error("잘못된 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // 초기화
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans p-4 sm:p-8 print:p-0 print:bg-white">
      
      {/* ── 동적 테마 및 인쇄(@media print) 최적화 CSS ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --accent-color: ${theme.color};
          --accent-color-light: ${theme.color}20;
          --accent-color-start: ${theme.start};
          --accent-color-end: ${theme.end};
          --header-bg-image: ${theme.image};
        }
        
        .gradient-header-bg {
          position: relative;
          background: linear-gradient(135deg, var(--accent-color-start), var(--accent-color-end));
          overflow: hidden;
        }
        .gradient-header-bg::before {
          content: "";
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background-image: var(--header-bg-image);
          background-size: cover;
          background-position: center;
          opacity: 0.15;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        
        .material-section {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          margin-bottom: 24px;
          padding: 32px;
        }
        
        .section-heading {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          border-bottom: 2px solid var(--accent-color-light);
          padding-bottom: 8px;
          margin-bottom: 20px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .accent-border {
          border-left: 4px solid var(--accent-color);
          padding-left: 16px;
        }

        /* ── 프린트 전용 스타일 ── */
        @media print {
          body { font-size: 11pt; font-family: 'Times New Roman', serif, 'Malgun Gothic'; }
          .no-print { display: none !important; }
          .document-output { font-family: 'Times New Roman', serif; width: 100%; margin: 0; padding: 0; }
          
          /* 프린트 시에도 배경 및 그림자 유지 */
          .gradient-header-bg {
            background: linear-gradient(135deg, var(--accent-color-start), var(--accent-color-end)) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .gradient-header-bg::before {
            background-image: var(--header-bg-image) !important;
            opacity: 0.15 !important;
            mix-blend-mode: normal !important; /* 인쇄 호환성 */
          }
          .material-section {
            box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            border: 1px solid #e5e7eb !important;
            background-color: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            break-inside: avoid;
          }
          .section-heading {
            border-bottom: 1px solid #d1d5db !important;
          }
          /* 인쇄 시 입력 컨트롤을 일반 텍스트처럼 표시 */
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            resize: none;
            outline: none;
            padding: 0 !important;
            color: black !important;
          }
          /* 값이 없는 필드 희미하게 처리 */
          input:placeholder-shown, textarea:placeholder-shown { opacity: 0.4; }
        }
      `}} />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* ── 좌측: 정보 입력 패널 (인쇄 시 숨김) ── */}
        <div className="w-full lg:w-1/3 space-y-6 no-print">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              {formType || "[양식명]"} 작성 도우미
            </h1>
            <p className="text-sm text-gray-500 mb-6 pb-4 border-b">
              몇 가지 정보만 입력하면 전문적인 {formType || "[양식명]"}이(가) 완성됩니다.
            </p>

            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-[var(--accent-color)]">■</span> 정보 입력
                </h3>
                
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 text-sm">기본 정보</h4>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">[양식명] 제목*</label>
                    <input 
                      type="text" 
                      required
                      className="w-full border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                      placeholder="예: 영업부 3분기 실적 보고서, 연차 휴가 신청서"
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="space-y-2 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="font-semibold text-gray-700 text-sm">주요 내용</h4>
                  <textarea 
                    className="w-full border rounded-md p-2.5 text-sm min-h-[100px] focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                    placeholder="양식에 포함될 구체적인 항목이나 요청사항을 적어주세요."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="submit" className="col-span-2 h-12 text-md bg-[var(--accent-color)] hover:bg-opacity-90" disabled={loading}>
                  {loading ? "생성 중..." : `${formType || '[양식명]'} 생성하기`}
                </Button>
                <Button type="button" variant="outline" onClick={downloadDataFile} className="w-full text-xs h-10">
                  💾 데이터 파일로 저장
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full text-xs h-10">
                  📂 데이터 파일 불러오기
                </Button>
                <Button type="button" variant="destructive" onClick={clearForm} className="col-span-2 text-xs h-10 mt-2">
                  🗑️ 양식 초기화
                </Button>
                <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={uploadDataFile} />
              </div>
            </form>
          </div>
        </div>

        {/* ── 우측: 생성된 문서 영역 (인쇄 대상) ── */}
        <div className="w-full lg:w-2/3 document-output">
          {!form ? (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-white/50 no-print">
              <span className="text-5xl mb-4 text-[var(--accent-color)] opacity-50">📄</span>
              <p className="text-lg font-medium text-gray-600">좌측 양식을 작성하고</p>
              <p className="text-gray-500">"{formType || '[양식명]'} 생성하기" 버튼을 클릭하세요</p>
            </div>
          ) : (
            <div className="bg-transparent print:bg-white">
              
              {/* 문서 상단 툴바 (인쇄 시 숨김) */}
              <div className="flex items-center justify-between mb-6 no-print bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <span className="text-[var(--accent-color)] mr-2">📄</span>
                  생성된 {formType || "[양식명]"}
                </h2>
                <button 
                  onClick={() => window.print()} 
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition duration-300 flex items-center font-medium shadow-sm"
                >
                  <span className="mr-2">🖨️</span> PDF 저장
                </button>
              </div>

              {/* ── 실제 인쇄되는 문서 영역 ── */}
              <div className="bg-gray-50 print:bg-white pb-8">
                
                {/* 동적 그라디언트 헤더 */}
                <div className="gradient-header-bg text-white p-10 sm:p-14 rounded-t-xl print:rounded-none mb-8 shadow-md print:shadow-none">
                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 relative z-10 break-keep leading-tight">
                    {form.title}
                  </h1>
                  <div className="flex gap-4 text-sm opacity-90 relative z-10 font-mono bg-black/20 w-fit px-3 py-1.5 rounded">
                    <span>버전: {form.version}</span>
                    <span>|</span>
                    <span>작성일: {form.date}</span>
                  </div>
                </div>

                {/* 섹션 반복 렌더링 */}
                <div className="px-0 sm:px-2">
                  {form.sections.map((section, sIdx) => (
                    <div key={sIdx} className="material-section">
                      <h2 className="section-heading text-xl sm:text-2xl">
                        <span style={{ color: "var(--accent-color)" }}>❖</span> {section.title}
                      </h2>
                      
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-6 accent-border leading-relaxed bg-gray-50 p-3 rounded-r-lg">
                          {section.description}
                        </p>
                      )}
                      
                      <div className="space-y-6">
                        {section.fields.map(field => (
                          <div key={field.id} className="space-y-2 group">
                            <label className="text-sm font-bold text-gray-800 flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </label>
                            
                            {/* 텍스트 / 날짜 / 이메일 등 */}
                            {["text", "email", "date"].includes(field.type) && (
                              <input
                                type={field.type}
                                className="w-full border-b border-gray-300 py-2.5 bg-transparent focus:border-[var(--accent-color)] outline-none transition-colors text-gray-900 placeholder:text-gray-400 text-[15px]"
                                placeholder={`(Tab 입력) ${field.placeholder}`}
                                value={formData[field.id] || ""}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, field)}
                              />
                            )}

                            {/* 긴 글 (Textarea) */}
                            {field.type === "textarea" && (
                              <textarea
                                className="w-full border rounded-lg p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition-all text-gray-900 placeholder:text-gray-400 min-h-[120px] text-[15px] leading-relaxed"
                                placeholder={`(Tab 입력) ${field.placeholder}`}
                                value={formData[field.id] || ""}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, field)}
                              />
                            )}

                            {/* 드롭다운 (Select) */}
                            {field.type === "select" && (
                              <select
                                className="w-full border-b border-gray-300 py-2.5 bg-transparent outline-none text-gray-900 text-[15px]"
                                value={formData[field.id] || ""}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                              >
                                <option value="" className="text-gray-400">선택해주세요</option>
                                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                              </select>
                            )}

                            {/* 라디오 버튼 */}
                            {field.type === "radio" && (
                              <div className="flex flex-wrap gap-5 pt-2">
                                {field.options?.map(o => (
                                  <label key={o} className="flex items-center gap-2 text-[15px] cursor-pointer text-gray-800">
                                    <input
                                      type="radio"
                                      name={field.id}
                                      value={o}
                                      checked={formData[field.id] === o}
                                      onChange={e => handleInputChange(field.id, e.target.value)}
                                      className="accent-[var(--accent-color)] w-4 h-4"
                                    />
                                    {o}
                                  </label>
                                ))}
                              </div>
                            )}

                            {/* 체크박스 */}
                            {field.type === "checkbox" && (
                              <div className="flex flex-wrap gap-5 pt-2">
                                {field.options?.map(o => {
                                  // 체크박스 다중 선택 처리를 위해 배열로 관리 (콤마로 구분된 문자열)
                                  const currentValues = formData[field.id] ? formData[field.id].split(',') : [];
                                  return (
                                    <label key={o} className="flex items-center gap-2 text-[15px] cursor-pointer text-gray-800">
                                      <input
                                        type="checkbox"
                                        value={o}
                                        checked={currentValues.includes(o)}
                                        onChange={e => {
                                          const isChecked = e.target.checked;
                                          let newValues;
                                          if (isChecked) newValues = [...currentValues, o];
                                          else newValues = currentValues.filter(val => val !== o);
                                          handleInputChange(field.id, newValues.join(','));
                                        }}
                                        className="accent-[var(--accent-color)] w-4 h-4 rounded-sm"
                                      />
                                      {o}
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                            
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
