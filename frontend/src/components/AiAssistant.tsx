import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  BookOpen, 
  Compass, 
  MessageSquare, 
  Lightbulb, 
  Bot, 
  User, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "sion-ai";
  text: string;
  timestamp: string;
}

export default function AiAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "sion-ai",
      text: "Shalom! Saya Asisten Pemuridan Digital Sion Academy. Saya siap membantu Anda mempersiapkan bahan pembelajaran pendalaman Alkitab, merangkum laporan berita acara, memberikan tips pelayanan kontekstual, atau menjawab pertanyaan teologi praktis untuk mendukung pelayanan Anda dalam membagikan Amanat Agung Matius 28:19-20.\n\nApa yang bisa saya bantu hari ini?",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const suggestions = [
    { label: "Outline PA Matius 28", prompt: "Buatkan outline bahan pemuridan kreatif tentang Amanat Agung Matius 28:19-20 untuk kelompok pemuda." },
    { label: "Tips Pemuridan Anak Muda", prompt: "Bagaimana strategi membimbing anak muda/generasi Z agar mereka rindu memuridkan orang lain?" },
    { label: "Menjelaskan Keselamatan Rohani", prompt: "Tulis panduan singkat menjelaskan kepastian keselamatan rohani Kristen kepada orang awam secara santun." },
    { label: "Outline Bahan PA Keluarga", prompt: "Buat outline diskusi pemuridan berdurasi 30 menit untuk keluarga di daerah pedesaan tentang kerendahan hati." }
  ];

  // Auto-scroll to the bottom of the chat list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: "msg-" + Date.now(),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textToSend
        })
      });

      if (!response.ok) {
        throw new Error("Gagal terhubung dengan Sion AI Server");
      }

      const data = await response.json();
      
      const aiMsg: Message = {
        id: "ai-" + Date.now(),
        sender: "sion-ai",
        text: data.text || "Mohon maaf, saya mengalami kendala teknis saat merumuskan respon.",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      
      // Fallback simulated helpful message
      const fallbackMsg: Message = {
        id: "ai-fallback-" + Date.now(),
        sender: "sion-ai",
        text: `Koneksi ke server Sion AI Assistant terputus. Silakan periksa kunci GEMINI_API_KEY Anda di Settings > Secrets untuk mengaktifkan kecerdasan buatan sepenuhnya!\n\nBerikut adalah rangkuman praktis tentang pemuridan:\n- Fokus pada relasi keteladanan karakter (Yohanes 13:15).\n- Jadwalkan evaluasi rohani harian yang terarah.\n- Dukung kemandirian belajar lewat modul dasar.`,
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  // Helper to format text with asterisks (bold) and lists nicely
  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, idx) => {
      // Bold handling
      let formattedLine = line;
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-900">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : formattedLine;

      // Unordered lists handling
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="list-disc pl-2 ml-4 text-xs sm:text-sm text-slate-700 leading-relaxed my-1">
            {line.trim().substring(2)}
          </li>
        );
      }

      // Ordered list numbered handling
      const numMatch = line.trim().match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={idx} className="list-decimal pl-2 ml-4 text-xs sm:text-sm text-slate-700 leading-relaxed my-1">
            {numMatch[2]}
          </li>
        );
      }

      // Headings
      if (line.trim().startsWith("### ")) {
        return (
          <h4 key={idx} className="font-display font-bold text-sm sm:text-base text-indigo-700 mt-4 mb-2">
            {line.trim().substring(4)}
          </h4>
        );
      }

      return (
        <p key={idx} className="text-xs sm:text-sm text-slate-700 leading-relaxed my-1.5 min-h-[1px]">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 material-shadow-2 overflow-hidden h-[calc(100vh-140px)] flex flex-col">
      {/* Bot Chat Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm sm:text-base">Asisten Pemuridan Sion AI</h3>
            <span className="text-[10px] text-indigo-300 font-medium flex items-center">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full mr-1.5 animate-ping"></span>
              Sion Gemini 3.5 Active
            </span>
          </div>
        </div>

        <div className="text-[10px] bg-slate-800 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full font-mono font-medium hidden sm:block">
          Alkitabiah & Kontekstual
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 space-y-4">
        {messages.map((msg) => {
          const isAi = msg.sender === "sion-ai";
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3 max-w-[85%] ${isAi ? "" : "ml-auto flex-row-reverse"}`}
            >
              {/* Sender Avatar Icon */}
              <div className={`p-2 rounded-xl shrink-0 material-shadow-1 ${isAi ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}>
                {isAi ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              {/* Speech bubble */}
              <div className={`space-y-1 ${isAi ? "" : "text-right"}`}>
                <div 
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isAi 
                      ? "bg-white text-slate-800 rounded-tl-none border border-slate-100 material-shadow-1" 
                      : "bg-indigo-600 text-white rounded-tr-none text-left"
                  }`}
                >
                  <div className="space-y-0.5">
                    {formatMessageText(msg.text)}
                  </div>
                </div>
                
                {/* Time log */}
                <span className="text-[9px] text-slate-400 font-mono block px-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* AI Thinking / Loader indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%]">
            <div className="p-2 rounded-xl shrink-0 bg-indigo-600 text-white material-shadow-1">
              <Bot className="h-4 w-4 animate-bounce" />
            </div>
            <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none material-shadow-1 space-y-2 w-48">
              <div className="flex items-center space-x-1.5">
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce duration-300"></span>
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="h-1.5 w-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono tracking-tight animate-pulse">Sion AI sedang berpikir...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion prompt chips area */}
      <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center space-x-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider shrink-0 mr-1">Rekomendasi:</span>
        {suggestions.map((sug, idx) => (
          <button
            key={idx}
            disabled={isLoading}
            onClick={() => handleSendMessage(sug.prompt)}
            className="px-3 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-200 border border-slate-200 text-slate-700 hover:text-indigo-600 rounded-full text-xs font-semibold whitespace-nowrap transition-all select-none material-shadow-1"
          >
            {sug.label}
          </button>
        ))}
      </div>

      {/* Bottom message input field */}
      <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2 shrink-0">
        <input
          type="text"
          value={inputValue}
          disabled={isLoading}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Tanyakan teologi, outline PA, strategi pelayanan..."
          className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400 text-slate-800"
        />
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className={`p-3 rounded-2xl transition-all shadow-md ${
            isLoading || !inputValue.trim()
              ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20"
          }`}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
