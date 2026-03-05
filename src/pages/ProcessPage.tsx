import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Upload, ScanSearch, Brain, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "문서 업로드",
    desc: "HWP, DOCX, PPTX, PDF 등 다양한 포맷의 문서를 간편하게 업로드하세요. 드래그 앤 드롭으로 즉시 시작할 수 있습니다.",
    details: ["최대 50MB 파일 지원", "다중 파일 동시 업로드", "클라우드 연동 업로드"],
  },
  {
    icon: ScanSearch,
    step: "02",
    title: "AI 양식 분석 & 구조 흡수",
    desc: "독자적인 AI 엔진이 문서의 표 구조, 셀 병합, 글꼴, 테두리 등을 정밀하게 분석하여 양식을 완벽히 재현합니다.",
    details: ["표 구조 자동 인식", "셀 병합 및 테두리 분석", "글꼴 크기·스타일 매핑"],
  },
  {
    icon: Brain,
    step: "03",
    title: "AI 텍스트 생성",
    desc: "편집 영역을 지정하고 키워드를 입력하면, 고급 AI 엔진이 맥락에 맞는 전문적인 텍스트를 자동으로 생성합니다.",
    details: ["문맥 기반 텍스트 생성", "다양한 톤 & 스타일", "반복 학습으로 정확도 향상"],
  },
  {
    icon: Download,
    step: "04",
    title: "내보내기",
    desc: "원본 서식을 100% 유지한 채 완성된 문서를 원하는 포맷으로 내보냅니다. 별도 편집 없이 바로 사용 가능합니다.",
    details: ["원본 서식 100% 유지", "다양한 포맷 변환", "공유 링크 생성"],
  },
];

const ProcessPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <span className="text-sm font-semibold text-teal uppercase tracking-wider">How it Works</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              4단계로 완성되는 <span className="text-gradient">AI 문서 작성</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              복잡한 문서 작업을 간단한 4단계로 자동화합니다
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {steps.map((item, i) => (
              <div key={i} className="glass-card p-8 flex flex-col md:flex-row gap-6 items-start">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl gradient-navy flex items-center justify-center">
                  <item.icon size={28} className="text-navy-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-bold text-teal">STEP {item.step}</span>
                    <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{item.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.details.map((d, j) => (
                      <span key={j} className="px-3 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProcessPage;
