import { motion } from "framer-motion";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onDownload?: () => void;
}

export function ChatMessage({ role, content, onDownload }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${isUser ? "bg-foreground" : "bg-muted"}`}>
        {isUser ? (
          <span className="text-xs font-bold text-background">You</span>
        ) : (
          <img src="/logo.svg" alt="U" className={`w-5 h-5 ${isUser ? "" : ""}`} style={{ filter: "none" }} />
        )}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div className={`inline-block p-4 rounded-2xl ${isUser ? "bg-foreground text-background rounded-br-md" : "bg-muted/60 rounded-bl-md"}`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-li:leading-relaxed">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && content.length > 100 && onDownload && (
          <div className="mt-1.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg"
            >
              <Download className="w-3 h-3 mr-1" />
              Download as PDF
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
