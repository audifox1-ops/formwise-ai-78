import { useState, useRef, useEffect } from "react";
import { generateFormWithAI, GeneratedForm, FormField } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AiFormBuilder() {
  const [formType, setFormType] = useState(""); 
  const [prompt, setPrompt] = useState("");     
  const [form, setForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ── 탭 상태 추가 ("input": 정보입력, "preview": 결과미리보기) ──
  const [activeTab, setActiveTab] = useState<"input" | "preview">("input");

  const [formData, setFormData] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return { start: "#1d4ed8", end: "#60a5fa", color: "#3b82f6", image: "none" };
  };

  const theme = getTheme(formType || form?.title || "");

  useEffect(() => {
    const savedData = localStorage.getItem("documentFormData");
    const savedTemplate = localStorage.getItem("documentFormTemplate");
    const savedFormType = localStorage.getItem("documentFormType");
    
    if (savedData) setFormData(JSON.parse(savedData));
    if (savedTemplate) {
      setForm(JSON.parse(savedTemplate));
      // 저장된 폼이 있으면 자동으로 미리보기 탭으로 이동할지 여부 결정
      // setActiveTab("preview"); 
    }
    if (savedFormType) setFormType(savedFormType);
  }, []);

  const handleInputChange = (id: string, value: string) => {
    const newData = { ...formData, [id]: value };
    setFormData(newData);
    localStorage.setItem("documentFormData", JSON.stringify(newData));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, field: FormField) => {
    if (e.key === "Tab" && !formData[field.id] && field.placeholder) {
      e.preventDefault();
      handleInputChange(field.id, field.placeholder);
      toast.success("예시 내용이 적용되었습니다.");
    }
  };

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
      
      // 생성 완료 시 자동으로 '미리보기' 탭으로 이동
      setActiveTab("preview");
    } catch {
      toast.error("양식 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setFormData({});
    localStorage.removeItem("documentFormData");
    toast.info("입력된 내용이 초기화되었습니다.");
  };

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
        setActiveTab("preview"); // 파일 업로드 시 미리보기로 이동
      } catch {
        toast.error("잘못된 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-4 sm:p-8 print:p-0 print:bg-white">
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

        @media print {
          body { font-size: 11pt; font-family: 'Times New Roman', serif, 'Malgun Gothic'; }
          .no-print { display: none !important; }
          .document-output { display: block !important; width: 100%; margin: 0; padding: 0; }
          
          .gradient-header-bg {
            background: linear-gradient(135deg, var(--accent-color-start), var(--accent-color-end)) !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .gradient-header-bg::before {
            background-image: var(--header-bg-image) !important;
            opacity: 0.15 !important;
            mix-blend-mode: normal !important;
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
          input, textarea, select {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            resize: none;
            outline: none;
            padding: 0 !important;
            color: black !important;
          }
          input:placeholder-shown, textarea:placeholder-shown { opacity: 0.4; }
        }
      `}} />

      <div className="max-w-4xl mx-auto">
        
        {/* ── 탭 내비게이션 (인쇄 시 숨김) ── */}
        <div className="flex space-x-1 border-b border-gray-200 mb-8 no-print">
          <button
            onClick={() => setActiveTab("input")}
            className={`flex-1 py-3 px-4 text-center text-sm font-bold transition-all ${
              activeTab === "input"
                ? "border-b-2 text-[var(--accent-color)]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg"
            }`}
            style={activeTab === "input" ? { borderColor: "var(--accent-color)" } : {}}
          >
            📝 양식 설정
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-3 px-4 text-center text-sm font-bold transition-all ${
              activeTab === "preview"
                ? "border-b-2 text-[var(--accent-color)]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-t-lg"
            }`}
            style={activeTab === "preview" ? { borderColor: "var(--accent-color)" } : {}}
          >
            📄 생성된 양식 (미리보기/출력)
          </button>
        </div>

        {/* ── 탭 1: 양식 설정 패널 ── */}
        {activeTab === "input" && (
          <div className="w-full space-y-6 no-print animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {formType || "[양식명]"} 작성 도우미
              </h1>
              <p className="text-sm text-gray-500 mb-8 pb-6 border-b">
                정보를 입력하면 업무에 최적화된 양식이 자동 생성됩니다.
              </p>

              <form onSubmit={handleGenerate} className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="text-[var(--accent-color)]">■</span> 기본 정보
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <label className="text-sm font-semibold text-gray-700 block mb-2">[양식명] 제목*</label>
                    <input 
                      type="text" 
                      required
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                      placeholder="예: 신규 프로젝트 기안서, 연차 휴가 신청서"
                      value={formType}
                      onChange={e => setFormType(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <span className="text-[var(--accent-color)]">■</span> 주요 내용 / 요구사항
                  </h3>
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-[var(--accent-color)] outline-none"
                      placeholder="양식에 반드시 포함되어야 할 항목이나 요청사항을 적어주세요."
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t flex flex-col sm:flex-row gap-3">
                  <Button type="submit" className="flex-1 h-12 text-md font-bold bg-[var(--accent-color)] hover:bg-opacity-90" disabled={loading}>
                    {loading ? "양식 생성 중..." : `${formType || '[양식명]'} 생성하기`}
                  </Button>
                </div>
              </form>
            </div>

            {/* 데이터 관리 컨트롤 */}
            {form && (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button type="button" variant="outline" onClick={downloadDataFile} className="w-full text-sm h-11">
                  💾 파일로 저장
                </Button>
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full text-sm h-11">
                  📂 불러오기
                </Button>
                <Button type="button" variant="destructive" onClick={clearForm} className="w-full text-sm h-11">
                  🗑️ 데이터 초기화
                </Button>
                <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={uploadDataFile} />
              </div>
            )}
          </div>
        )}

        {/* ── 탭 2: 미리보기 및 생성 패널 (인쇄 대상) ── */}
        <div className={`${activeTab === "preview" ? "block animate-in fade-in duration-300" : "hidden print:block"} document-output w-full`}>
          {!form ? (
            <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-2xl bg-white/50 no-print">
              <span className="text-5xl mb-4 text-[var(--accent-color)] opacity-40">📄</span>
              <p className="text-lg font-medium text-gray-600 mb-2">생성된 양식이 없습니다.</p>
              <p className="text-sm text-gray-500">"양식 설정" 탭에서 정보를 입력하고 생성해주세요.</p>
              <Button onClick={() => setActiveTab("input")} variant="outline" className="mt-6">설정 탭으로 이동</Button>
            </div>
          ) : (
            <div className="bg-transparent print:bg-white">
              <div className="flex items-center justify-between mb-6 no-print bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <span className="text-[var(--accent-color)] mr-2">📄</span>
                  {formType || "[양식명]"} 미리보기
                </h2>
                <button 
                  onClick={() => window.print()} 
                  className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition duration-300 flex items-center font-medium shadow-sm"
                >
                  <span className="mr-2">🖨️</span> PDF 저장 / 인쇄
                </button>
              </div>

              {/* ── 실제 인쇄 영역 ── */}
              <div className="bg-gray-50 print:bg-white pb-8">
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

                            {field.type === "textarea" && (
                              <textarea
                                className="w-full border rounded-lg p-3.5 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition-all text-gray-900 placeholder:text-gray-400 min-h-[120px] text-[15px] leading-relaxed"
                                placeholder={`(Tab 입력) ${field.placeholder}`}
                                value={formData[field.id] || ""}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, field)}
                              />
                            )}

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

                            {field.type === "checkbox" && (
                              <div className="flex flex-wrap gap-5 pt-2">
                                {field.options?.map(o => {
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
