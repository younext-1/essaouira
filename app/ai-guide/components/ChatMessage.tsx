"use client";

import { motion } from "framer-motion";
import { SparkleIcon } from "./TypingIndicator";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  role: "user" | "ai";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`w-full flex mb-8 ${isUser ? "justify-end" : "justify-start"}`}
      dir="auto"
    >
      {isUser ? (
        <div 
          className="bg-warm-sand text-text-primary px-[18px] py-[12px] max-w-[60%] border border-warm-border/50 shadow-sm"
          style={{ borderRadius: "20px 20px 4px 20px" }}
        >
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      ) : (
        <div className="w-full max-w-[800px] flex items-start gap-4">
          <div className="shrink-0 mt-0.5">
            <SparkleIcon />
          </div>
          <div className="flex-1 text-text-primary text-[15px] leading-[1.7] max-w-full overflow-hidden prose prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-a:text-ocean prose-a:no-underline hover:prose-a:underline prose-strong:font-semibold">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
      )}
    </motion.div>
  );
}
