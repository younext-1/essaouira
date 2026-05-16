import { BotMessageSquare, User } from "lucide-react";

export default function AIGuide() {
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Header */}
      <div className="bg-[#EAF2FB] p-6 border-b border-[#EAF2FB]/80 flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md">
          <BotMessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1a1a2e]">Mogador AI Guide</h2>
          <p className="text-sm text-[#1a1a2e]/70">Your personal expert on Essaouira.</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
        {/* User Message */}
        <div className="flex gap-4 justify-end">
          <div className="bg-[#1a1a2e] text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm">
            <p>What are the top 3 things I must do in Essaouira today?</p>
          </div>
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shrink-0">
            <User className="w-5 h-5" />
          </div>
        </div>

        {/* AI Message */}
        <div className="flex gap-4">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm">
            <BotMessageSquare className="w-5 h-5" />
          </div>
          <div className="bg-[#F3F4F6] text-[#1a1a2e] p-4 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
            <p className="mb-2 font-medium">Here are my top recommendations for a perfect day in Mogador:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><strong>Walk the Skala de la Ville</strong>: Experience the historic ramparts with brass cannons and spectacular ocean views.</li>
              <li><strong>Explore the Medina</strong>: Get lost in the blue-and-white alleys, visit the souks, and discover local Thuya wood artisans.</li>
              <li><strong>Relax at the Port</strong>: Watch the blue fishing boats return with their daily catch and enjoy fresh grilled seafood right there.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Ask about places, food, history..."
            className="w-full bg-gray-50 border border-gray-200 text-[#1a1a2e] rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            disabled
          />
          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center disabled:opacity-50 transition-colors">
            <span className="sr-only">Send</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
