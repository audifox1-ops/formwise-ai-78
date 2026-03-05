import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, ChevronDown, ChevronUp, Mail, Phone, MessageSquare } from "lucide-react";
import { toast } from "sonner";

const faqs = [
  { q: "무료 체험은 어떻게 시작하나요?", a: "회원가입 후 바로 무료 크레딧이 제공됩니다. 별도 결제 정보 없이 모든 핵심 기능을 체험하실 수 있습니다." },
  { q: "어떤 문서 형식을 지원하나요?", a: "한글(HWP), MS Word(DOCX), PowerPoint(PPTX), PDF 등 국내외 주요 문서 형식을 모두 지원합니다." },
  { q: "문서 데이터는 안전한가요?", a: "AES-256 암호화를 적용하며, 작업 완료 후 서버에서 자동 삭제됩니다. 문서 내용은 AI 학습에 사용되지 않습니다." },
  { q: "팀 요금제가 있나요?", a: "네, 팀 및 엔터프라이즈 요금제를 제공합니다. 팀원 수에 따른 유연한 가격 정책을 적용합니다." },
  { q: "기술 지원은 어떻게 받나요?", a: "이메일, 채팅, 전화를 통해 평일 09:00-18:00 기술 지원을 제공합니다. 엔터프라이즈 고객에게는 전담 매니저가 배정됩니다." },
];

const ContactPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("문의가 접수되었습니다. 빠른 시일 내에 답변 드리겠습니다.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-teal uppercase tracking-wider">Support</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              무엇이든 <span className="text-gradient">물어보세요</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              궁금한 점이 있으시면 언제든 문의해주세요
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 max-w-6xl mx-auto">
            {/* Contact form */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">문의하기</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="이름" className="bg-card" required />
                  <Input placeholder="회사명" className="bg-card" />
                </div>
                <Input type="email" placeholder="이메일" className="bg-card" required />
                <Input placeholder="제목" className="bg-card" required />
                <Textarea placeholder="문의 내용을 입력해주세요" className="bg-card min-h-[150px]" required />
                <Button variant="teal" size="lg" type="submit" className="w-full">
                  <Send size={18} />
                  문의 보내기
                </Button>
              </form>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail size={18} className="text-primary" />
                  <span className="text-sm text-muted-foreground">support@documind.ai</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone size={18} className="text-primary" />
                  <span className="text-sm text-muted-foreground">02-1234-5678</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageSquare size={18} className="text-primary" />
                  <span className="text-sm text-muted-foreground">실시간 채팅</span>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">자주 묻는 질문</h2>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div key={i} className="glass-card overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-foreground text-sm">{faq.q}</span>
                      {openFaq === i ? (
                        <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-muted-foreground animate-fade-in">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
