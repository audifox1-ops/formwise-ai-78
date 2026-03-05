import { Shield, Lock, Eye, Server } from "lucide-react";
import securityImg from "@/assets/images/security.jpg";

const trustItems = [
  { icon: Shield, title: "엔터프라이즈 보안", desc: "SOC 2 Type II 인증 수준의 보안 체계" },
  { icon: Lock, title: "데이터 암호화", desc: "전송 및 저장 시 AES-256 암호화 적용" },
  { icon: Eye, title: "개인정보 보호", desc: "문서 데이터는 작업 후 즉시 삭제" },
  { icon: Server, title: "국내 서버 운영", desc: "국내 클라우드 인프라에서 안전하게 운영" },
];

const TrustSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
            <img src={securityImg} alt="데이터 보안" className="w-full h-auto" />
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              당신의 문서는<br /><span className="text-gradient">철저히 보호</span>됩니다
            </h2>
            <p className="text-muted-foreground mb-8">
              기업의 중요한 문서를 다루기에, 최고 수준의 보안을 약속합니다.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trustItems.map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <item.icon size={24} className="text-primary mb-3" />
                  <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
