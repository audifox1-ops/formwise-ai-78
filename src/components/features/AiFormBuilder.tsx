import { useState } from "react";
import { generateFormWithAI, GeneratedForm, FormField } from "@/lib/ai";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const EXAMPLES = ["고객 만족도 설문", "채용 지원서", "행사 참가 신청서", "제품 피드백 폼"];

export default function AiFormBuilder() {
  const [prompt, setPrompt] = useState("");
  const [form, setForm] = useState<GeneratedForm | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("프롬프트를 입력해주세요."); return; }
    setLoading(true);
    try {
      const result = await generateFormWithAI(prompt);
      setForm(result);
      toast.success("폼 생성 완료!");
    } catch {
      toast.error("생성 실패. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <p className="text-sm font-semibold tracking-widest text-primary uppercase mb-3">라이브 데모</p>
        <h2 className="text-4xl font-bold mb-3">지금 바로 써보세요</h2>
        <p className="text-muted-foreground mb-10">원하는 폼을 한 줄로 입력하면 AI가 즉시 만들어드립니다.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-background border rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-lg">💬 어떤 폼이 필요하신가요?</h3>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예) 행사 참가 신청서를 만들어줘."
              className="min-h-[110px] resize-none"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((p) => (
                <button key={p} onClick={() => setPrompt(p + " 만들어줘. 필요한 항목 모두 포함.")}
                  className="text-xs px-3 py-1.5 rounded-full border bg-muted hover:bg-primary/10 transition-colors">
                  {p}
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={handleGenerate} disabled={loading}>
              {loading ? "생성 중..." : "✦ AI로 폼 생성하기"}
            </Button>
          </div>
          <div className="bg-background border rounded-2xl p-6 min-h-[400px]">
            <h3 className="font-semibold text-lg mb-4">📋 생성된 폼</h3>
            {loading && (
              <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">AI가 폼을 만들고 있어요...</p>
              </div>
            )}
            {!loading && !form && (
              <div className="flex items-center justify-center h-60 text-muted-foreground text-sm">
                프롬프트를 입력하고 생성해보세요
              </div>
            )}
            {!loading && form && <FormPreview form={form} />}
          </div>
        </div>
      </div>
    </section>
  );
}

function FormPreview({ form }: { form: GeneratedForm }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-xl">{form.title}</h4>
        <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
      </div>
      {form.fields.map((field, i) => <FieldItem key={i} field={field} />)}
      <Button onClick={() => toast.success("제출 완료! (데모)")}>제출하기</Button>
    </div>
  );
}

function FieldItem({ field }: { field: FormField }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {field.label}{field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {field.type === "textarea" && <textarea className="w-full border rounded-lg px-3 py-2 text-sm bg-muted/50 min-h-[80px] resize-none" placeholder={field.placeholder} />}
      {field.type === "select" && (
        <select className="w-full border rounded-lg px-3 py-2 text-sm bg-muted/50">
          <option value="">선택해주세요</option>
          {field.options?.map(o => <option key={o}>{o}</option>)}
        </select>
      )}
      {field.type === "radio" && (
        <div className="space-y-1">{field.options?.map(o => <label key={o} className="flex items-center gap-2 text-sm"><input type="radio" name={field.label} /> {o}</label>)}</div>
      )}
      {field.type === "checkbox" && (
        <div className="space-y-1">{field.options?.map(o => <label key={o} className="flex items-center gap-2 text-sm"><input type="checkbox" /> {o}</label>)}</div>
      )}
      {["text","email"].includes(field.type) && <input type={field.type} className="w-full border rounded-lg px-3 py-2 text-sm bg-muted/50" placeholder={field.placeholder} />}
    </div>
  );
}