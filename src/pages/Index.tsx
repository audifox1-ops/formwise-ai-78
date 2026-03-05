import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AiFormBuilder from "@/components/features/AiFormBuilder";
import DocumentWriter from "@/components/features/DocumentWriter";
// 복잡한 랜딩페이지용 컴포넌트들(HeroSection, CoreFeatureSection 등)은 호출하지 않습니다.

const Index = () => {
  // 앱 전체의 최상위 탭 상태 ("formBuilder" | "docWriter")
  const [activeAppTab, setActiveAppTab] = useState<"formBuilder" | "docWriter">("formBuilder");

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] font-sans">
      <Header />
      
      {/* 메인 작업 영역 */}
      <main className="flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* 앱 전체 타이틀 (초간소화) */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            AI 업무 도우미
          </h1>
          <p className="text-gray-500 mt-3 text-sm sm:text-base">
            원하는 작업 도구를 선택하여 바로 업무를 시작하세요.
          </p>
        </div>

        {/* ── 앱 최상위 탭 네비게이션 ── */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex bg-gray-200/60 p-1.5 rounded-2xl shadow-inner">
            <button
              onClick={() => setActiveAppTab("formBuilder")}
              className={`flex items-center px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 ${
                activeAppTab === "formBuilder"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2 text-lg">📝</span> AI 양식 생성기
            </button>
            <button
              onClick={() => setActiveAppTab("docWriter")}
              className={`flex items-center px-6 sm:px-8 py-3 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 ${
                activeAppTab === "docWriter"
                  ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2 text-lg">📄</span> AI 문서 작성/분석
            </button>
          </div>
        </div>

        {/* ── 선택된 기능 화면 렌더링 ── */}
        {/* 테두리와 둥근 모서리를 주어 독립된 앱(Workspace)처럼 보이게 합니다 */}
        <div className="flex-1 w-full bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden relative min-h-[70vh]">
          {activeAppTab === "formBuilder" ? (
            <AiFormBuilder />
          ) : (
            <DocumentWriter />
          )}
        </div>
        
      </main>

      <Footer />
    </div>
  );
};

export default Index;
