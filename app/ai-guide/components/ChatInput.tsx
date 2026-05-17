"use client";

import { useState } from "react";
import { Plus, Grid, Mic, Send } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="fixed bottom-0 left-[60px] right-0 bg-gradient-to-t from-warm-white via-warm-white/90 to-transparent pt-8 pb-4 flex flex-col items-center px-10">
      <div className="w-full max-w-[720px] bg-white border border-warm-border rounded-[24px] flex items-center px-5 py-3.5 shadow-lg">
        <div className="flex items-center gap-4 shrink-0 text-text-muted">
          <button className="hover:text-ocean transition-colors">
            <Plus className="w-5 h-5" />
          </button>
          <button className="hover:text-ocean transition-colors">
            <Grid className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          dir="auto"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          placeholder="اسأل عن موكادور..."
          className="flex-1 bg-transparent text-text-primary px-4 focus:outline-none placeholder:text-text-muted placeholder:text-right"
        />

        <div className="flex items-center shrink-0 text-text-muted">
          {input.trim() ? (
            <button 
              onClick={handleSend}
              disabled={disabled}
              className="hover:text-ocean transition-colors p-2 bg-ocean/10 rounded-full text-ocean"
            >
              <Send className="w-5 h-5" />
            </button>
          ) : (
            <button className="hover:text-ocean transition-colors p-2">
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <p className="text-text-muted text-xs mt-3">
        Mogador AI قد يرتكب أخطاء
      </p>
    </div>
  );
}
