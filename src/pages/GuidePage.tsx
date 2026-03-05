import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { FolderOpen, Shield, BookOpen, HelpCircle, Clock, FileCheck } from "lucide-react";

const guideItems = [
  {
    icon: FolderOpen,
    title: "프로젝트 관리",
    desc: "문서를 프로젝트 단위로 관리하세요. 카테고리별 분류, 검색, 필터링으로 수백 개의 문서도 쉽게 찾을 수 있습니다.",
  },
  {
    icon: Clock,
    title: "히스토리 시스템",
    desc: "모든 작업 이력이 자동으로 저장됩니다. 언제든 이전 버전을 열람하고 복원할 수 있어 실수 걱정이 없습니다.",
  },
  {
    icon: Shield,
    title: "데이터 보안 정책",
    desc: "업로드된 문서는 AES-256 암호화로 보호되며, 작업 완료 후 서버에서 자동 삭제됩니다. 국내 클라우드 인프라를 사용합니다.",
  },
  {
    icon: FileCheck,
    title: "개인정보처리방침",
    desc: "사용자의 개인정보는 최소한으로 수집하며, 문서 내용은 AI 학습에 사용되지 않습니다.",
  },
  {
    icon: BookOpen,
    title: "신규 사용자 튜토리얼",
    desc: "처음 사용하시는 분도 3분이면 시작할 수 있습니다. 단계별 가이드와 동영상 튜토리얼을 제공합니다.",
  },
  {
    icon: HelpCircle,
    title: "도움말 센터",
    desc: "자주 묻는 질문, 기능별 매뉴얼, 트러블슈팅 가이드를 제공하는 종합 도움말 센터를 운영합니다.",
  },
];

const GuidePage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-teal uppercase tracking-wider">Guide</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              운영 안내 & <span className="text-gradient">사용 가이드</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              DocuMind AI를 최대한 활용하기 위한 안내입니다
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {guideItems.map((item, i) => (
              <div key={i} className="glass-card p-6 hover:shadow-xl transition-all duration-300">
                <item.icon size={28} className="text-primary mb-4" />
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

export default GuidePage;
