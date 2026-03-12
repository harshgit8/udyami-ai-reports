import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Download, Loader2, Send, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const ONBOARDING_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-onboarding`;
const ONBOARDING_KEY = "udyami-onboarding";

function loadOnboardingMessages(): Message[] {
  try {
    const stored = sessionStorage.getItem(ONBOARDING_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

export default function Onboarding() {
  const [messages, setMessages] = useState<Message[]>(loadOnboardingMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [prdContent, setPrdContent] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-start onboarding
  useEffect(() => {
    if (messages.length === 0) {
      startOnboarding();
    } else {
      // Check if onboarding is already complete
      const lastAssistant = [...messages].reverse().find(m => m.role === "assistant");
      if (lastAssistant?.content.includes("FactoryMind Configuration Report") || lastAssistant?.content.includes("Module Activation Map")) {
        setOnboardingComplete(true);
        setPrdContent(lastAssistant.content);
      }
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(ONBOARDING_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const streamResponse = async (allMessages: Message[]): Promise<string> => {
    const resp = await fetch(ONBOARDING_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ error: "Failed" }));
      throw new Error(error.error || "Failed to get response");
    }
    if (!resp.body) throw new Error("No response body");

    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

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
            setMessages(prev => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = { ...last, content: assistantContent };
              }
              return next;
            });
          }
        } catch {
          buffer = line + "\n" + buffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const startOnboarding = async () => {
    setIsLoading(true);
    try {
      const startMsg: Message = { role: "user", content: "Start my factory onboarding." };
      setMessages([startMsg]);
      await streamResponse([startMsg]);
    } catch (e) {
      toast({ title: "Error", description: "Failed to start onboarding. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await streamResponse(allMessages);
      // Check if PRD was generated
      if (response.includes("FactoryMind Configuration Report") || response.includes("Module Activation Map")) {
        setOnboardingComplete(true);
        setPrdContent(response);
      }
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Failed to get response", variant: "destructive" });
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
        return prev;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPRD = async () => {
    if (!prdContent || !pdfRef.current) return;
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const imgWidth = pdfWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 0.85);

      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight - margin * 2;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft - margin);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight - margin * 2;
      }

      pdf.save(`udyami-prd-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: "Downloaded", description: "Your PRD has been saved as PDF." });
    } catch {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem(ONBOARDING_KEY);
    setMessages([]);
    setOnboardingComplete(false);
    setPrdContent(null);
    setTimeout(() => startOnboarding(), 100);
  };

  const questionCount = messages.filter(m => m.role === "user" && m.content !== "Start my factory onboarding.").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hidden PDF renderer */}
      {prdContent && (
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm", zIndex: -1 }}>
          <div ref={pdfRef} className="p-12 bg-white text-black min-h-[297mm]">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{prdContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-border/50"
      >
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="h-8 w-8 p-0 rounded-lg">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-8 h-8 rounded-xl bg-foreground flex items-center justify-center">
            <img src="/logo.svg" alt="Udyami" className="w-5 h-5 invert" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Factory Setup</h1>
            <p className="text-[10px] text-muted-foreground">
              {onboardingComplete ? "Configuration Complete ✓" : `Question ${Math.min(questionCount + 1, 7)} of 7`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Progress */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < questionCount ? "w-6 bg-foreground" : i === questionCount && !onboardingComplete ? "w-6 bg-foreground/30 animate-pulse" : "w-3 bg-border"
                }`}
              />
            ))}
          </div>
          {onboardingComplete && (
            <Button size="sm" onClick={() => navigate("/dashboard")} className="h-8 px-4 text-xs rounded-lg gap-1.5">
              Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </motion.header>

      {/* Chat Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.filter(m => m.content !== "Start my factory onboarding.").map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-foreground text-background rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-sm prose-headings:font-semibold prose-p:my-1.5 prose-li:my-0.5 prose-table:text-xs">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-muted-foreground py-2"
            >
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              Udyami is thinking…
            </motion.div>
          )}

          {/* Completion Actions */}
          {onboardingComplete && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 py-8"
            >
              <Button onClick={handleDownloadPRD} variant="outline" className="h-11 px-6 rounded-xl gap-2">
                <Download className="w-4 h-4" />
                Download PRD as PDF
              </Button>
              <Button onClick={() => navigate("/dashboard")} className="h-11 px-6 rounded-xl gap-2">
                Enter Dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleRestart} className="text-xs text-muted-foreground">
                Restart Onboarding
              </Button>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      {!onboardingComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-border bg-card/80 backdrop-blur-xl px-4 sm:px-6 py-4"
        >
          <div className="max-w-2xl mx-auto flex gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              placeholder="Type your answer…"
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              rows={1}
              onKeyDown={e => {
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
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
