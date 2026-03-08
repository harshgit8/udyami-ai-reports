import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveDocument, tryParseAiDocument } from "@/lib/documents";
import { motion } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatWorkspaceProps {
  contextData?: {
    quotationsCount: number;
    invoicesCount: number;
    qualityCount: number;
    productionCount: number;
    rndCount: number;
    documents?: Array<{
      id: string;
      type: string;
      external_id: string | null;
      customer: string | null;
      status: string | null;
      total: number | null;
      created_at: string;
    }>;
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

const quickPrompts = [
  { label: "Generate Quotation", prompt: "Generate a quotation for 500 units of widget_a for Techno Manufacturing with 50% advance payment terms", icon: "📄" },
  { label: "Create Invoice", prompt: "Create a GST-compliant invoice for the last quotation with CGST and SGST breakdown", icon: "🧾" },
  { label: "Quality Report", prompt: "Generate quality inspection report for BATCH-050 with defect analysis and recommendations", icon: "🔍" },
  { label: "Production Plan", prompt: "Optimize production schedule for this week across all 5 machines with priority allocation", icon: "🏭" },
  { label: "R&D Formulation", prompt: "Suggest R&D formulation for flame retardant ABS compound meeting UL94 V-0 rating", icon: "🧪" },
  { label: "Simulate Shortage", prompt: "Simulate raw material shortage of ABS resin for 2 weeks and show production impact", icon: "⚠️" },
  { label: "Analyze Defects", prompt: "Analyze defect trends across all batches this month and identify root causes", icon: "📊" },
  { label: "Recommend Product", prompt: "Recommend the next product to manufacture based on current demand and machine setup", icon: "💡" },
];

export function AIChatWorkspace({ contextData }: AIChatWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [downloadContent, setDownloadContent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const updateAssistant = (chunk: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant") {
        next[next.length - 1] = { ...last, content: last.content + chunk };
        return next;
      }
      next.push({ role: "assistant", content: chunk });
      return next;
    });
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

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

      if (resp.status === 429) throw new Error("Rate limit exceeded. Please try again in a moment.");
      if (resp.status === 402) throw new Error("Usage limit reached. Please add credits to continue.");
      if (!resp.ok) {
        const error = await resp.json().catch(() => ({ error: "Failed to get response" }));
        throw new Error(error.error || "Failed to get response");
      }
      if (!resp.body) throw new Error("No response body");

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

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
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              updateAssistant(content);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      const parsedDoc = tryParseAiDocument(assistantContent);
      if (parsedDoc) {
        await saveDocument(parsedDoc);
        await queryClient.invalidateQueries({ queryKey: ["documents"] });
        toast({ title: "Document Saved", description: `${parsedDoc.type} saved to database.` });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (content: string) => {
    setDownloadContent(content);
    setTimeout(async () => {
      if (!pdfRef.current) return;
      try {
        const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const margin = 15;
        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
        pdf.save(`udyami-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      } finally {
        setDownloadContent(null);
      }
    }, 80);
  };

  const showWelcome = messages.length === 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Hidden PDF renderer */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", zIndex: -1 }}>
        <div ref={pdfRef} className="p-12 bg-white text-black min-h-[297mm]">
          {downloadContent && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{downloadContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-foreground flex items-center justify-center overflow-hidden">
          <img src="/logo.svg" alt="Udyami" className="w-7 h-7 invert" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Udyami Copilot</h1>
          <p className="text-xs text-muted-foreground">
            {contextData?.quotationsCount ?? 0} quotes · {contextData?.invoicesCount ?? 0} invoices ·{" "}
            {contextData?.qualityCount ?? 0} quality · {contextData?.productionCount ?? 0} production ·{" "}
            {contextData?.rndCount ?? 0} R&D
          </p>
        </div>
      </div>

      {/* Chat area */}
      <ScrollArea className="flex-1 rounded-2xl border border-border bg-card/50" ref={scrollRef}>
        <div className="p-6 space-y-4">
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center mb-5 shadow-lg">
                <img src="/logo.svg" alt="Udyami" className="w-12 h-12 invert" />
              </div>
              <h2 className="text-xl font-semibold mb-1.5">How can I help you today?</h2>
              <p className="text-sm text-muted-foreground max-w-md mb-10">
                I can generate documents, analyze data, simulate scenarios, and help you manage your factory operations.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-2xl w-full">
                {quickPrompts.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => handleSend(qp.prompt)}
                    className="p-3.5 text-left rounded-xl border border-border bg-background hover:bg-muted/50 hover:border-foreground/20 transition-all duration-200 group"
                  >
                    <span className="text-base mb-1.5 block">{qp.icon}</span>
                    <span className="text-xs font-medium group-hover:text-foreground transition-colors">{qp.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              onDownload={msg.role === "assistant" && msg.content.length > 100 ? () => handleDownload(msg.content) : undefined}
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground py-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              Udyami is thinking…
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) toast({ title: "Attached", description: file.name });
          }}
          accept=".pdf,.xlsx,.xls,.csv,.txt,.doc,.docx"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="h-11 w-11 p-0 rounded-xl"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Ask anything about your factory…"
          className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(input);
            }
          }}
        />
        <Button
          onClick={() => handleSend(input)}
          disabled={!input.trim() || isLoading}
          className="h-11 w-11 p-0 rounded-xl"
          aria-label="Send"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
