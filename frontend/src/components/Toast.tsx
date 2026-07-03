import React, { useEffect } from "react";
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

interface ToastProps {
  open: boolean;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  duration?: number;
}

export default function Toast({ open, message, type, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, onClose, duration]);

  if (!open) return null;

  const bgColors = {
    success: "bg-emerald-50 border-emerald-100 text-emerald-800",
    error: "bg-rose-50 border-rose-100 text-rose-800",
    warning: "bg-amber-50 border-amber-100 text-amber-800",
    info: "bg-blue-50 border-blue-100 text-blue-800",
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-600" />,
    error: <AlertCircle className="h-5 w-5 text-rose-600" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600" />,
    info: <Info className="h-5 w-5 text-blue-600" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white rounded-2xl p-4 shadow-xl border material-shadow-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className={`flex items-start gap-3 rounded-xl border p-3 ${bgColors[type]}`}>
        <div className="shrink-0 mt-0.5">{icons[type]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-relaxed break-words">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
