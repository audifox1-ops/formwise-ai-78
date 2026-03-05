import featureScan from "@/assets/images/feature-scan.jpg";
import featureAiWrite from "@/assets/images/feature-ai-write.jpg";

const CoreFeatureSection = () => {
  return (
    <section className="py-24 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            핵심 기능을 <span className="text-gradient">경험하세요</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            한글, 워드, PPT, PDF 무엇이든 원본 그대로 흡수하고 AI가 작성합니다
          </p>
        </div>

        <div className="space-y-20 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-teal uppercase tracking-wider">STEP 01</span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">
                양식을 업로드하면<br />100% 흡수합니다
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                복잡한 표, 셀 병합, 테두리, 글꼴 크기까지 — 어떤 양식이든 원본과 동일하게 분석하고 구조를 완벽히 재현합니다. 더 이상 수작업으로 양식을 만들 필요가 없습니다.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> HWP, DOCX, PPTX, PDF 등 다양한 포맷 지원</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> 표 구조 및 셀 병합 자동 인식</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> 원본 서식 100% 유지 내보내기</li>
              </ul>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img src={featureScan} alt="문서 스캔 및 양식 분석" className="w-full h-auto" />
            </div>
          </div>

          {/* Feature 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img src={featureAiWrite} alt="AI 자동 내용 작성" className="w-full h-auto" />
            </div>
            <div className="order-1 md:order-2">
              <span className="text-sm font-semibold text-teal uppercase tracking-wider">STEP 02</span>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mt-2 mb-4">
                AI가 맥락에 맞는<br />내용을 자동 작성합니다
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                편집할 영역을 지정하고 키워드만 입력하면, 고급 AI 엔진이 문서의 맥락과 목적에 맞는 전문적인 텍스트를 자동으로 생성합니다.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> 편집 영역 자유 지정</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> 맥락 기반 고급 텍스트 생성</li>
                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-teal" /> 톤 및 스타일 커스터마이징</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoreFeatureSection;
