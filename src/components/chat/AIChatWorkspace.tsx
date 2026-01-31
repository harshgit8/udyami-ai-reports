import { useEffect, useMemo, useRef, useState } from "react";
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

export function AIChatWorkspace({ contextData }: AIChatWorkspaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi. Tell me what you need and I’ll run the workflow end-to-end (quote → invoice → production → quality → R&D).",
    },
  ]);
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

  const quickActions = useMemo(
    () => [
      { label: "Generate Quotation", prompt: "Generate a quotation for 2 tons of PVC compound." },
      { label: "Create Invoice", prompt: "Create an invoice for the last quotation." },
      { label: "Production Status", prompt: "Show production status summary and any delays." },
      { label: "Quality Report", prompt: "Generate a quality inspection report for the latest batch." },
      { label: "R&D Insights", prompt: "Suggest an R&D formulation improvement for flame retardancy." },
    ],
    [],
  );

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
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response",
        variant: "destructive",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
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
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const imgWidth = pdfWidth - margin * 2;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight - margin * 2;
        }

        pdf.save(`udyami-document-${new Date().toISOString().slice(0, 10)}.pdf`);
      } finally {
        setDownloadContent(null);
        setIsLoading(false);
      }
    }, 80);
  };

  const onPickFiles = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    toast({
      title: "Attached",
      description: file.name,
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: 0,
          width: "210mm",
          zIndex: -1,
        }}
      >
        <div ref={pdfRef} className="p-12 bg-white text-black min-h-[297mm]">
          {downloadContent && (
            <div className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:mb-4 prose-li:mb-2">
              <ReactMarkdown>{downloadContent}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">AI Chat</h1>
          <p className="text-muted-foreground text-sm mt-1">
            DB: {contextData?.quotationsCount ?? 0} quotes • {contextData?.invoicesCount ?? 0} invoices •{" "}
            {contextData?.qualityCount ?? 0} quality • {contextData?.productionCount ?? 0} production •{" "}
            {contextData?.rndCount ?? 0} R&D
          </p>
        </div>
        <div className="hidden lg:flex gap-2">
          {quickActions.map((a) => (
            <Button key={a.label} variant="outline" onClick={() => handleSend(a.prompt)} disabled={isLoading}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 border border-border bg-background" ref={scrollRef}>
        <div className="p-6 space-y-4">
          {messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role}
              content={msg.content}
              onDownload={msg.role === "assistant" && msg.content.length > 100 ? () => handleDownload(msg.content) : undefined}
            />
          ))}
          {isLoading && (
            <div className="text-xs text-muted-foreground">
              Generating…
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="mt-4 flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => onPickFiles(e.target.files)}
          accept=".pdf,.xlsx,.xls,.csv,.txt,.doc,.docx"
        />
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="h-12 w-12 p-0"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          placeholder="Message Udyami AI…"
          className="min-h-[48px] max-h-[140px] resize-none"
          rows={2}
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
          className="h-12 w-12 p-0"
          aria-label="Send"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
