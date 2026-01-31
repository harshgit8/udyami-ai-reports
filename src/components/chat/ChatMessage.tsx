import { motion } from "framer-motion";
import { User, Bot, Download } from "lucide-react";
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center border ${isUser ? "bg-foreground text-background" : "bg-background"}`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
        <div className={`inline-block max-w-[85%] p-4 border ${isUser ? "bg-foreground text-background" : "bg-background"}`}>
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && content.length > 100 && onDownload && (
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="text-xs"
            >
              <Download className="w-3 h-3 mr-1" />
              Download Response
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
