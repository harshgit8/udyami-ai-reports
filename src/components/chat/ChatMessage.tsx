import { motion } from "framer-motion";
import { Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { useState } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onDownload?: () => void;
}

export function ChatMessage({ role, content, onDownload }: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden ${
          isUser ? "bg-foreground" : "bg-foreground"
        }`}
      >
        {isUser ? (
          <span className="text-xs font-bold text-background">You</span>
        ) : (
          <img src="/logo.svg" alt="Udyami" className="w-5 h-5 invert" />
        )}
      </div>
      <div className={`flex-1 max-w-[85%] ${isUser ? "flex flex-col items-end" : ""}`}>
        <div
          className={`inline-block p-4 rounded-2xl ${
            isUser
              ? "bg-foreground text-background rounded-br-md"
              : "bg-muted/60 rounded-bl-md"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
          ) : (
            <div className="chat-markdown text-sm">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-lg font-bold tracking-tight mt-4 mb-2 first:mt-0 text-foreground">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold tracking-tight mt-3.5 mb-1.5 first:mt-0 text-foreground">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mt-3 mb-1 first:mt-0 text-foreground">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-2 last:mb-0">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5 last:mb-0">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5 last:mb-0">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed pl-0.5">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-muted-foreground">{children}</em>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return (
                        <div className="my-2 rounded-lg overflow-hidden border border-border">
                          <div className="bg-muted/80 px-3 py-1 text-[10px] font-mono text-muted-foreground uppercase tracking-wider border-b border-border">
                            {className?.replace("language-", "") || "code"}
                          </div>
                          <pre className="p-3 overflow-x-auto bg-muted/40">
                            <code className="text-xs font-mono leading-relaxed" {...props}>{children}</code>
                          </pre>
                        </div>
                      );
                    }
                    return (
                      <code className="px-1.5 py-0.5 rounded-md bg-muted text-xs font-mono text-foreground" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => <>{children}</>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/40 pl-3 my-2 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  table: ({ children }) => (
                    <div className="my-2 overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-muted/60">{children}</thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 border-b border-border/50">{children}</td>
                  ),
                  hr: () => <hr className="my-3 border-border" />,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
                      {children}
                    </a>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && content.length > 50 && (
          <div className="mt-1.5 flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg"
            >
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            {onDownload && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDownload}
                className="text-xs text-muted-foreground hover:text-foreground h-7 px-2 rounded-lg"
              >
                <Download className="w-3 h-3 mr-1" />
                PDF
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
