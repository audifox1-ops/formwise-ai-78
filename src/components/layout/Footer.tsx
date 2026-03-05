import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="gradient-navy py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal flex items-center justify-center">
                <span className="text-sm font-bold text-teal-foreground">D</span>
              </div>
              <span className="text-lg font-bold text-navy-foreground">DocuMind AI</span>
            </div>
            <p className="text-sm text-navy-foreground/60">
              양식 복제와 AI 자동 작성으로<br />문서 업무를 혁신합니다.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-navy-foreground mb-4">서비스</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60">
              <li><Link to="/process" className="hover:text-navy-foreground transition-colors">작동 원리</Link></li>
              <li><Link to="/features" className="hover:text-navy-foreground transition-colors">기능 소개</Link></li>
              <li><Link to="/guide" className="hover:text-navy-foreground transition-colors">가이드</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-navy-foreground mb-4">지원</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60">
              <li><Link to="/contact" className="hover:text-navy-foreground transition-colors">문의하기</Link></li>
              <li><Link to="/contact" className="hover:text-navy-foreground transition-colors">FAQ</Link></li>
              <li><Link to="/guide" className="hover:text-navy-foreground transition-colors">도움말 센터</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-navy-foreground mb-4">법적 고지</h4>
            <ul className="space-y-2 text-sm text-navy-foreground/60">
              <li><span className="cursor-pointer hover:text-navy-foreground transition-colors">이용약관</span></li>
              <li><span className="cursor-pointer hover:text-navy-foreground transition-colors">개인정보처리방침</span></li>
              <li><span className="cursor-pointer hover:text-navy-foreground transition-colors">보안 정책</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-navy-foreground/10 text-center text-sm text-navy-foreground/40">
          © 2026 DocuMind AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
