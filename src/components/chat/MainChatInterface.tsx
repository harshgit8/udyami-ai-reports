import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, 
  Loader2, 
  FileText, 
  Receipt, 
  Factory, 
  ClipboardCheck, 
  FlaskConical,
  Upload,
  Sparkles,
  Bot,
  User,
  Download,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MainChatInterfaceProps {
  contextData?: {
    quotationsCount: number;
    invoicesCount: number;
    qualityCount: number;
    productionCount: number;
    rndCount: number;
  };
  onNavigate?: (tab: string) => void;
}

const quickActions = [
  { id: "quotation", label: "Generate Quotation", icon: FileText, color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { id: "invoice", label: "Create Invoice", icon: Receipt, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" },
  { id: "production", label: "Production Status", icon: Factory, color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  { id: "quality", label: "Quality Report", icon: ClipboardCheck, color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { id: "rnd", label: "R&D Insights", icon: FlaskConical, color: "bg-rose-500/10 text-rose-600 border-rose-200" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export function MainChatInterface({ contextData, onNavigate }: MainChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [downloadContent, setDownloadContent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMsg: Message = { 
      role: "user", 
      content: messageText.trim(),
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantContent = "";

    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: "assistant", content: assistantContent, timestamp: new Date() }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          contextData,
        }),
      });

      if (!resp.ok) {
        const error = await resp.json();
        throw new Error(error.error || "Failed to get response");
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) updateAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setMessages((prev) => prev.filter((m) => m !== userMsg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (actionId: string) => {
    const actionMessages: Record<string, string> = {
      quotation: "I need to generate a new quotation for a customer. Please help me create one.",
      invoice: "I need to create a new invoice. Please help me generate it.",
      production: "Show me the current production status and any delayed orders.",
      quality: "Generate a quality report summary with recent inspection results.",
      rnd: "Provide R&D insights and formulation recommendations.",
    };
    handleSend(actionMessages[actionId] || "");
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSend(`I'm uploading a file: ${file.name}. Please analyze it and help me process this document.`);
    }
  };

  const handleDownload = async (content: string) => {
    setDownloadContent(content);
    setIsLoading(true);

    setTimeout(async () => {
      if (!pdfRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        const canvas = await html2canvas(pdfRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const imgWidth = pdfWidth - (margin * 2);
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - margin * 2);

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= (pdfHeight - margin * 2);
        }

        pdf.save(`udyami-document-${new Date().toISOString().slice(0, 10)}.pdf`);

        toast({
          title: "Success",
          description: "PDF document generated successfully",
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        toast({
          title: "Error",
          description: "Failed to generate PDF document",
          variant: "destructive",
        });
      } finally {
        setDownloadContent(null);
        setIsLoading(false);
      }
    }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const isEmptyState = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hidden container for PDF generation */}
      <div
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '210mm',
          zIndex: -1
        }}
      >
        <div
          ref={pdfRef}
          className="p-12 bg-white text-black min-h-[297mm]"
        >
          {downloadContent && (
            <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:mb-4 prose-li:mb-2">
              <ReactMarkdown>{downloadContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.pdf,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Chat Area */}
      <div className="flex-1 overflow-hidden">
        {isEmptyState ? (
          /* Empty State - Welcome Screen */
          <div className="h-full flex flex-col items-center justify-center px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-2xl"
            >
              <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-foreground flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-background" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight mb-3">
                Welcome to Udyami AI
              </h1>
              <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                Your intelligent assistant for Polymer/PVC manufacturing operations.
                Ask anything or use quick actions below.
              </p>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
                {quickActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickAction(action.id)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${action.color} hover:shadow-md`}
                  >
                    <action.icon className="w-6 h-6" />
                    <span className="text-xs font-medium text-center">{action.label}</span>
                  </motion.button>
                ))}
              </div>

              {/* Dashboard Button */}
              {onNavigate && (
                <Button
                  variant="outline"
                  onClick={() => onNavigate("dashboard")}
                  className="mb-6"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Dashboard
                </Button>
              )}

              {/* Example Prompts */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-3">
                  Try saying
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "I need 2 tons of PVC material",
                    "Show production status",
                    "Generate quality report",
                    "R&D recommendations for fire-resistant compound"
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(prompt)}
                      className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-full transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Messages List */
          <ScrollArea className="h-full" ref={scrollRef}>
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    msg.role === "user" 
                      ? "bg-foreground text-background" 
                      : "bg-muted border border-border"
                  }`}>
                    {msg.role === "user" ? (
                      <User className="w-5 h-5" />
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block max-w-[85%] p-4 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-foreground text-background rounded-tr-sm" 
                        : "bg-muted rounded-tl-sm"
                    }`}>
                      {msg.role === "user" ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-p:text-current prose-li:text-current prose-strong:text-current">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {msg.role === "assistant" && msg.content.length > 100 && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(msg.content)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="p-4 rounded-2xl rounded-tl-sm bg-muted">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <Button
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
              className="h-12 w-12 rounded-xl flex-shrink-0"
              title="Upload file"
            >
              <Upload className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your business operations..."
                disabled={isLoading}
                className="min-h-[48px] max-h-[200px] resize-none pr-12 rounded-xl"
                rows={1}
              />
            </div>
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 rounded-xl flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          {!isEmptyState && (
            <div className="flex justify-center gap-2 mt-3 flex-wrap">
              {quickActions.slice(0, 3).map((action) => (
                <button
                  key={action.id}
                  onClick={() => handleQuickAction(action.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-full transition-colors"
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
