"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./components/ChatMessage";
import { ChatInput } from "./components/ChatInput";
import { TypingIndicator, SparkleIcon } from "./components/TypingIndicator";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { useProfile } from "@/lib/auth/profile-provider";

export default function AIGuidePage() {
  const [messages, setMessages] = useState<{role: "user" | "ai", content: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();
  const { profile } = useProfile();
  const user = isSignedIn ? profile : null;

  // Load chat history from Supabase if logged in
  useEffect(() => {
    if (historyLoaded) return;
    
    async function loadHistory() {
      if (!user) {
        // Default welcome messages for non-logged-in users
        setMessages([
          { role: "ai", content: "أهلاً وسهلاً! أنا مرشدك الذكي في الصويرة. كيف أقدر أساعدك اليوم؟" },
        ]);
        setHistoryLoaded(true);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from("ai_conversations")
        .select("messages")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages as {role: "user" | "ai", content: string}[]);
      } else {
        setMessages([
          { role: "ai", content: "أهلاً وسهلاً! أنا مرشدك الذكي في الصويرة. كيف أقدر أساعدك اليوم؟" },
        ]);
      }
      setHistoryLoaded(true);
    }

    loadHistory();
  }, [user, historyLoaded]);

  // Save conversation to Supabase after each exchange
  async function saveConversation(msgs: {role: "user" | "ai", content: string}[]) {
    if (!user) return;
    const supabase = createClient();

    const { data: existing } = await supabase
      .from("ai_conversations")
      .select("id")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("ai_conversations")
        .update({ messages: msgs, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("ai_conversations")
        .insert({ user_id: user.id, messages: msgs });
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      const data = await response.json();
      
      if (data.content) {
        const updatedMessages = [...newMessages, { role: "ai" as const, content: data.content }];
        setMessages(updatedMessages);
        // Save to Supabase in the background
        saveConversation(updatedMessages);
      }
    } catch (error) {
      console.error(error);
      const errorMessages = [...newMessages, { role: "ai" as const, content: "عذراً، حدث خطأ. الرجاء المحاولة لاحقاً." }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto w-full flex justify-center pb-32 pt-8 selection:bg-blue-500/30">
      <div className="w-full max-w-[800px] px-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-20">
            <SparkleIcon className="w-12 h-12" />
            <h2 className="text-text-primary text-[22px] font-arabic">أهلاً وسهلاً! كيف أقدر أساعدك اليوم؟</h2>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
