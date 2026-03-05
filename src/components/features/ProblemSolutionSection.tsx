import { Clock, AlertTriangle, CheckCircle2, Zap } from "lucide-react";

const problems = [
  { icon: Clock, title: "반복되는 양식 작업", desc: "매번 같은 양식을 찾고 복사하는 데 소모되는 시간" },
  { icon: AlertTriangle, title: "서식 깨짐 문제", desc: "복사 후 서식이 틀어져 수정에 더 많은 시간 소요" },
];

const solutions = [
  { icon: CheckCircle2, title: "양식 100% 흡수", desc: "어떤 문서든 원본 양식을 완벽하게 분석하고 재현합니다" },
  { icon: Zap, title: "AI 자동 내용 작성", desc: "키워드만 입력하면 맥락에 맞는 전문적인 내용을 생성합니다" },
];

const ProblemSolutionSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            문서 작업, 이렇게 <span className="text-gradient">힘드셨죠?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            DocuMind AI가 문서 업무의 고충을 근본적으로 해결합니다
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Problems */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-accent uppercase tracking-wider mb-6">기존의 문제점</h3>
            {problems.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-accent/5 border border-accent/20">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-accent" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Solutions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-teal uppercase tracking-wider mb-6">DocuMind의 해결책</h3>
            {solutions.map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-teal/5 border border-teal/20">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <item.icon size={20} className="text-teal" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;
