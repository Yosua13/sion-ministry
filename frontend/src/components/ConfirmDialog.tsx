import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  subject?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  subject,
  confirmLabel = "Hapus Data",
  cancelLabel = "Batalkan",
  onCancel,
  onConfirm
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-white border border-slate-100 material-shadow-3 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4 p-5">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-base text-slate-950">{title}</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">{description}</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                aria-label="Tutup dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {subject && (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Data yang akan dihapus</span>
                <span className="mt-0.5 block text-xs font-bold text-slate-800 truncate">{subject}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-all shadow-md shadow-rose-600/10 flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
