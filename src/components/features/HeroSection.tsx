import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/images/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <div className="absolute inset-0">
        <img src={heroBg} alt="스마트 오피스 환경" className="w-full h-full object-cover" />
        <div className="absolute inset-0 gradient-navy opacity-85" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-6 animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal/20 text-teal text-sm font-medium border border-teal/30">
              <Sparkles size={14} />
              AI 기반 문서 자동화
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-navy-foreground animate-fade-in-up">
            당신의 문서를<br />
            <span className="text-teal">완벽하게 복제</span>하고,<br />
            AI가 내용을 채웁니다.
          </h1>

          <p className="text-lg md:text-xl text-navy-foreground/70 mb-8 max-w-xl animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            양식 고민은 끝. 이제 핵심 내용에만 집중하세요.
            나만의 전담 AI 비서가 완벽한 보고서를 만들어드립니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Button variant="teal" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/demo")}>
              무료로 시작하기
              <ArrowRight size={18} />
            </Button>
            <Button variant="hero-outline" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/demo")}>
              <FileText size={18} />
              데모 체험하기
            </Button>
          </div>

          <div className="mt-12 flex items-center gap-8 text-navy-foreground/50 text-sm animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal" />
              한글, 워드, PPT, PDF 지원
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-teal" />
              원본 서식 100% 유지
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
