import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  FileText, ScanSearch, PenTool, Download, Layers, Languages,
  History, Users, BarChart3, Palette
} from "lucide-react";

const features = [
  { icon: FileText, title: "다양한 파일 포맷 지원", desc: "한글(HWP), 워드(DOCX), 파워포인트(PPTX), PDF 등 국내외 주요 문서 형식을 모두 지원합니다." },
  { icon: ScanSearch, title: "AI 양식 완벽 분석", desc: "표 구조, 셀 병합, 테두리, 글꼴까지 원본 양식의 모든 요소를 정밀하게 분석합니다." },
  { icon: PenTool, title: "편집 영역 지정", desc: "문서 내 AI가 내용을 채울 영역을 자유롭게 지정하여 정확한 위치에 텍스트를 생성합니다." },
  { icon: Layers, title: "고급 AI 텍스트 생성", desc: "최신 대규모 언어 모델을 기반으로 문서의 맥락과 목적에 맞는 전문적인 텍스트를 생성합니다." },
  { icon: Download, title: "원본 서식 유지 내보내기", desc: "완성된 문서를 원본 서식 그대로 다양한 포맷으로 내보냅니다." },
  { icon: Languages, title: "다국어 지원", desc: "한국어, 영어, 일본어, 중국어 등 주요 언어로 문서 작성이 가능합니다." },
  { icon: History, title: "버전 히스토리", desc: "모든 편집 이력을 자동 저장하여 언제든 이전 버전으로 되돌릴 수 있습니다." },
  { icon: Users, title: "팀 협업", desc: "팀원을 초대하여 실시간으로 문서를 공동 작업하고 검토할 수 있습니다." },
  { icon: BarChart3, title: "사용 분석 대시보드", desc: "문서 작업 현황, 시간 절약 효과 등을 한눈에 확인할 수 있는 대시보드를 제공합니다." },
  { icon: Palette, title: "톤 & 스타일 커스터마이징", desc: "격식체, 비즈니스, 캐주얼 등 원하는 문서 톤과 스타일을 자유롭게 설정합니다." },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-teal uppercase tracking-wider">Features</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              강력한 <span className="text-gradient">10가지 기능</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              DocuMind AI가 제공하는 모든 기능을 소개합니다
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((item, i) => (
              <div key={i} className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FeaturesPage;
