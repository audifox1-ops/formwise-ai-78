import { useState, useRef, useEffect } from "react";
import { generateFormWithAI, GeneratedForm, FormField } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AiFormBuilder() {
  const [formType, setFormType] = useState(""); 
  const [prompt, setPrompt] = useState("");     
  const [form, setForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);
  
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
    if (!formType.trim()) { toast.error("양식 이름을 입력해주세요."); return; }
    
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
        setActiveTab("preview"); 
      } catch {
        toast.error("잘못된 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; 
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans p-4 sm:p-8 print:p-0 print:bg-white">
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
          border-radius: 16px;
          box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.05);
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
            padding: 24px !important;
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
        
        {/* ── 상단 탭 내비게이션 ── */}
        <div className="flex space-x-2 border-b border-gray-200 mb-8 no-print">
          <button
            onClick={() => setActiveTab("input")}
            className={`py-3 px-6 text-sm font-bold transition-all border-b-2 ${
              activeTab === "input"
                ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-t-xl"
            }`}
          >
            📝 양식 설정
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`py-3 px-6 text-sm font-bold transition-all border-b-2 ${
              activeTab === "preview"
                ? "border-[var(--accent-color)] text-[var(--accent-color)]"
                : "border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100/50 rounded-t-xl"
            }`}
          >
            📄 생성된 양식 (미리보기/출력)
          </button>
        </div>

        {/* ── 탭 1: 양식 설정 ── */}
        {activeTab === "input" && (
          <div className="w-full no-print animate-in fade-in duration-300">
            <div className="bg-white p-8 sm:p-14 rounded-3xl shadow-sm border border-gray-100">
              
              <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-3 tracking-tight">어떤 양식이 필요하신가요?</h1>
                <p className="text-gray-500 text-sm sm:text-base">AI가 한국 비즈니스 환경에 맞는 전문적인 문서를 즉시 만들어드립니다.</p>
              </div>

              <form onSubmit={handleGenerate} className="max-w-2xl mx-auto space-y-6">
                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">
                    양식 이름 <span className="text-red-500">*</span>
                  </label>
                  
                  {/* ✨ 추가된 기능: 대중적인 양식 드롭다운 선택기 */}
                  <div className="relative mb-3">
                    <select
                      className="w-full appearance-none bg-white border border-gray-200 rounded-xl p-3.5 pr-10 text-sm text-gray-700 focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color-light)] outline-none transition-all cursor-pointer shadow-sm font-medium hover:bg-gray-50"
                      onChange={(e) => {
                        if (e.target.value) setFormType(e.target.value);
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled hidden>💡 아이디어가 필요하다면? 자주 쓰는 양식 빠른 선택...</option>
                      <optgroup label="보고 / 기안">
                        <option value="주간 업무 보고서">주간 업무 보고서</option>
                        <option value="월간 실적 보고서">월간 실적 보고서</option>
                        <option value="신규 프로젝트 기안서">신규 프로젝트 기안서</option>
                        <option value="품의서 (지출 결의서)">품의서 (지출 결의서)</option>
                      </optgroup>
                      <optgroup label="인사 / 총무">
                        <option value="연차/반차 휴가 신청서">연차/반차 휴가 신청서</option>
                        <option value="출장 신청 및 복명서">출장 신청 및 복명서</option>
                        <option value="업무 인수인계서">업무 인수인계서</option>
                        <option value="근로 계약서">근로 계약서</option>
                        <option value="사직서">사직서</option>
                      </optgroup>
                      <optgroup label="영업 / 마케팅">
                        <option value="제품/서비스 제안서">제품/서비스 제안서</option>
                        <option value="보도자료">보도자료</option>
                        <option value="고객 만족도 설문지">고객 만족도 설문지</option>
                        <option value="회의록 (의사록)">회의록 (의사록)</option>
                      </optgroup>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
                      ▼
                    </div>
                  </div>

                  <input 
                    type="text" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base focus:bg-white focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color-light)] outline-none transition-all"
                    placeholder="위에서 선택하거나 직접 입력하세요 (예: 재택근무 신청서)"
                    value={formType}
                    onChange={e => setFormType(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-gray-700 block mb-2 ml-1">
                    필수 포함 내용 <span className="text-gray-400 font-normal">(선택)</span>
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-base min-h-[140px] focus:bg-white focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color-light)] outline-none transition-all resize-y"
                    placeholder="양식에 반드시 들어가야 할 항목이나 특별한 요청사항을 편하게 적어주세요."
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg font-bold bg-[var(--accent-color)] hover:bg-opacity-90 rounded-2xl shadow-md hover:shadow-lg transition-all mt-2" 
                  disabled={loading}
                >
                  {loading ? "양식 생성 중..." : "✨ AI 양식 생성하기"}
                </Button>
                
                {/* 부가 기능 (파일 불러오기/저장/초기화) */}
                <div className="flex flex-col items-center justify-center pt-8">
                  <input type="file" ref={fileInputRef} accept=".json" className="hidden" onChange={uploadDataFile} />
                  
                  {!form ? (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-gray-400 hover:text-gray-600 underline underline-offset-4 transition-colors">
                      기존 데이터 파일(.json) 불러오기
                    </button>
                  ) : (
                    <div className="flex flex-wrap gap-4 sm:gap-6 border-t border-gray-100 pt-6 w-full justify-center">
                      <button type="button" onClick={downloadDataFile} className="text-sm font-medium text-gray-500 hover:text-[var(--accent-color)] flex items-center gap-1 transition-colors">
                        💾 파일로 저장
                      </button>
                      <span className="text-gray-300">|</span>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-gray-500 hover:text-[var(--accent-color)] flex items-center gap-1 transition-colors">
                        📂 불러오기
                      </button>
                      <span className="text-gray-300">|</span>
                      <button type="button" onClick={clearForm} className="text-sm font-medium text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                        🗑️ 양식 초기화
                      </button>
                    </div>
                  )}
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ── 탭 2: 생성된 양식 미리보기 / 출력 ── */}
        <div className={`${activeTab === "preview" ? "block animate-in fade-in duration-300" : "hidden print:block"} document-output w-full`}>
          {!form ? (
            <div className="h-[500px] flex flex-col items-center justify-center text-center border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 no-print">
              <span className="text-6xl mb-6 opacity-20">📄</span>
              <h3 className="text-xl font-bold text-gray-700 mb-2">아직 생성된 양식이 없습니다</h3>
              <p className="text-gray-500 mb-6">'양식 설정' 탭에서 원하는 양식을 만들어보세요.</p>
              <Button onClick={() => setActiveTab("input")} variant="outline" className="rounded-xl px-8 h-12">
                양식 만들러 가기
              </Button>
            </div>
          ) : (
            <div className="bg-transparent print:bg-white">
              
              <div className="flex items-center justify-between mb-6 no-print bg-white p-4 px-6 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className="text-[var(--accent-color)] mr-2">📄</span>
                  {formType || "[양식명]"} 미리보기
                </h2>
                <button 
                  onClick={() => window.print()} 
                  className="bg-[#1f2937] text-white px-5 py-2.5 rounded-xl hover:bg-black transition duration-300 flex items-center font-medium shadow-sm text-sm"
                >
                  <span className="mr-2">🖨️</span> PDF 저장 / 인쇄
                </button>
              </div>

              {/* 실제 인쇄 영역 */}
              <div className="bg-[#fcfcfc] print:bg-white pb-8 rounded-b-2xl">
                <div className="gradient-header-bg text-white p-10 sm:p-14 rounded-t-2xl print:rounded-none mb-8 shadow-sm print:shadow-none">
                  <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 relative z-10 break-keep leading-tight">
                    {form.title}
                  </h1>
                  <div className="flex gap-4 text-sm opacity-90 relative z-10 font-mono bg-black/20 w-fit px-3 py-1.5 rounded-lg">
                    <span>버전: {form.version}</span>
                    <span>|</span>
                    <span>작성일: {form.date}</span>
                  </div>
                </div>

                <div className="px-0 sm:px-4">
                  {form.sections.map((section, sIdx) => (
                    <div key={sIdx} className="material-section">
                      <h2 className="section-heading text-xl sm:text-2xl">
                        <span style={{ color: "var(--accent-color)" }}>❖</span> {section.title}
                      </h2>
                      
                      {section.description && (
                        <p className="text-sm text-gray-600 mb-6 accent-border leading-relaxed bg-gray-50 p-4 rounded-r-xl">
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
                                className="w-full border-b border-gray-300 py-2.5 bg-transparent focus:border-[var(--accent-color)] outline-none transition-colors text-gray-900 placeholder:text-gray-300 text-[15px]"
                                placeholder={`(Tab 입력) ${field.placeholder}`}
                                value={formData[field.id] || ""}
                                onChange={e => handleInputChange(field.id, e.target.value)}
                                onKeyDown={e => handleKeyDown(e, field)}
                              />
                            )}

                            {field.type === "textarea" && (
                              <textarea
                                className="w-full border rounded-xl p-4 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--accent-color-light)] focus:border-[var(--accent-color)] outline-none transition-all text-gray-900 placeholder:text-gray-300 min-h-[120px] text-[15px] leading-relaxed"
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
                              <div className="flex flex-wrap gap-6 pt-2">
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
                              <div className="flex flex-wrap gap-6 pt-2">
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
