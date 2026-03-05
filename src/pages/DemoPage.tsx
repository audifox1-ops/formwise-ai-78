import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X, Sparkles, Check, Loader2, FileSpreadsheet, Presentation, File } from "lucide-react";
import { toast } from "sonner";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status: "uploading" | "analyzing" | "ready" | "generating" | "done";
  progress: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "hwp" || ext === "hwpx") return <FileText size={20} className="text-primary" />;
  if (ext === "doc" || ext === "docx") return <FileText size={20} className="text-blue-500" />;
  if (ext === "ppt" || ext === "pptx") return <Presentation size={20} className="text-orange-500" />;
  if (ext === "xls" || ext === "xlsx") return <FileSpreadsheet size={20} className="text-green-500" />;
  if (ext === "pdf") return <File size={20} className="text-red-500" />;
  return <FileText size={20} className="text-muted-foreground" />;
};

const DemoPage = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);

  const simulateProcess = useCallback((file: UploadedFile, index: number) => {
    const steps: Array<{ status: UploadedFile["status"]; delay: number }> = [
      { status: "uploading", delay: 0 },
      { status: "analyzing", delay: 1200 },
      { status: "ready", delay: 2500 },
    ];

    steps.forEach(({ status, delay }) => {
      setTimeout(() => {
        setFiles((prev) =>
          prev.map((f, i) =>
            i === index
              ? { ...f, status, progress: status === "uploading" ? 50 : status === "analyzing" ? 80 : 100 }
              : f
          )
        );
        if (status === "ready") {
          toast.success(`"${file.name}" 양식 분석 완료!`);
        }
      }, delay);
    });
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = Array.from(fileList).map((f) => ({
        name: f.name,
        size: f.size,
        type: f.type,
        status: "uploading" as const,
        progress: 0,
      }));

      setFiles((prev) => {
        const updated = [...prev, ...newFiles];
        newFiles.forEach((file, i) => {
          simulateProcess(file, prev.length + i);
        });
        return updated;
      });
    },
    [simulateProcess]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) setAiOutput(null);
  };

  const handleGenerate = (index: number) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status: "generating" as const } : f))
    );

    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, status: "done" as const } : f))
      );
      setAiOutput(
        `[AI 자동 생성 결과 - ${files[index].name}]\n\n` +
          `1. 프로젝트 개요\n본 프로젝트는 2026년 1분기 사업 확장을 위한 전략적 ` +
          `계획을 수립하고, 핵심 성과 지표(KPI)를 기반으로 한 체계적인 목표 관리 시스템을 ` +
          `구축하는 것을 목적으로 합니다.\n\n` +
          `2. 주요 추진 내용\n- 시장 분석 및 경쟁사 벤치마킹\n- 신규 서비스 런칭 로드맵 수립\n` +
          `- 고객 만족도 향상 프로그램 운영\n- 내부 프로세스 최적화\n\n` +
          `3. 기대 효과\n업무 효율성 40% 향상, 고객 만족도 15% 개선, ` +
          `연간 비용 절감 약 2억원 예상.`
      );
      toast.success("AI 내용 생성 완료!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-teal uppercase tracking-wider">Demo</span>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mt-3 mb-4">
              직접 <span className="text-gradient">체험해보세요</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              문서를 업로드하면 AI가 양식을 분석하고 내용을 자동으로 작성합니다
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid gap-8">
            {/* Upload zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 cursor-pointer ${
                isDragging
                  ? "border-teal bg-teal/5 scale-[1.02]"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                multiple
                accept=".hwp,.hwpx,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.pdf,.txt"
                className="hidden"
                onChange={handleFileInput}
              />
              <Upload size={48} className={`mx-auto mb-4 ${isDragging ? "text-teal" : "text-muted-foreground"}`} />
              <p className="text-lg font-semibold text-foreground mb-2">
                파일을 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-sm text-muted-foreground">
                HWP, DOCX, PPTX, XLSX, PDF 등 지원 · 최대 50MB
              </p>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">업로드된 파일</h3>
                {files.map((file, i) => (
                  <div key={i} className="glass-card p-4 flex items-center gap-4">
                    {getFileIcon(file.name)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{formatFileSize(file.size)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        {file.status === "uploading" && (
                          <span className="text-xs text-teal flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> 업로드 중...
                          </span>
                        )}
                        {file.status === "analyzing" && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> 양식 분석 중...
                          </span>
                        )}
                        {file.status === "ready" && (
                          <span className="text-xs text-teal flex items-center gap-1">
                            <Check size={12} /> 분석 완료
                          </span>
                        )}
                        {file.status === "generating" && (
                          <span className="text-xs text-primary flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> AI 작성 중...
                          </span>
                        )}
                        {file.status === "done" && (
                          <span className="text-xs text-teal flex items-center gap-1">
                            <Sparkles size={12} /> 작성 완료
                          </span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {(file.status === "uploading" || file.status === "analyzing") && (
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal rounded-full transition-all duration-700"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.status === "ready" && (
                        <Button variant="teal" size="sm" onClick={() => handleGenerate(i)}>
                          <Sparkles size={14} />
                          AI 작성
                        </Button>
                      )}
                      <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-foreground">
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Output */}
            {aiOutput && (
              <div className="glass-card p-6 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={18} className="text-teal" />
                  <h3 className="text-sm font-semibold text-foreground">AI 생성 결과</h3>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed font-[inherit]">
                  {aiOutput}
                </pre>
                <div className="mt-6 flex gap-3">
                  <Button variant="teal" size="sm">
                    원본 서식으로 내보내기
                  </Button>
                  <Button variant="outline" size="sm">
                    다시 생성하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DemoPage;
