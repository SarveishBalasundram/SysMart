import { ReactNode, useEffect, useState } from "react";

export function TopBar({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[var(--sm-border)] bg-[var(--sm-surface)] px-3">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Back"
          className="flex h-12 w-12 items-center justify-center rounded-full text-[var(--sm-text)] active:scale-95"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      <h1 className="flex-1 truncate text-center text-[17px] font-semibold text-[var(--sm-text)]">{title}</h1>
      <div className="flex h-12 min-w-12 items-center justify-end">{right}</div>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, type = "button" }: { children: ReactNode; onClick?: () => void; disabled?: boolean; type?: "button" | "submit" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="flex h-[52px] w-full items-center justify-center rounded-lg bg-[var(--sm-primary)] px-4 text-[16px] font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-[52px] w-full items-center justify-center rounded-lg border-2 border-[var(--sm-primary)] bg-transparent px-4 text-[16px] font-semibold text-[var(--sm-primary)] transition active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "", onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[var(--sm-border)] bg-[var(--sm-surface)] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.05)] ${onClick ? "cursor-pointer active:scale-[0.99]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatusBadge({ status, label }: { status: "green" | "yellow" | "red" | "blue"; label: string }) {
  const colors = {
    green: "bg-[var(--sm-success)]/15 text-[var(--sm-success)]",
    yellow: "bg-[var(--sm-warning)]/15 text-[var(--sm-warning)]",
    red: "bg-[var(--sm-error)]/15 text-[var(--sm-error)]",
    blue: "bg-[var(--sm-secondary)]/15 text-[var(--sm-secondary)]",
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[13px] font-semibold ${colors[status]}`}>
    <span className={`h-2 w-2 rounded-full ${status === "green" ? "bg-[var(--sm-success)]" : status === "yellow" ? "bg-[var(--sm-warning)]" : status === "red" ? "bg-[var(--sm-error)]" : "bg-[var(--sm-secondary)]"}`} />
    {label}
  </span>;
}

export function Input({ label, value, onChange, placeholder, type = "text", error }: { label?: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-[14px] font-medium text-[var(--sm-text)]">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`h-[52px] w-full rounded-lg border-2 bg-[var(--sm-surface)] px-4 text-[16px] text-[var(--sm-text)] outline-none transition ${error ? "border-[var(--sm-error)]" : "border-[var(--sm-border)] focus:border-[var(--sm-primary)]"}`}
      />
      {error && <p className="mt-1 text-[13px] text-[var(--sm-error)]">{error}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, options }: { label?: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-[14px] font-medium text-[var(--sm-text)]">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[52px] w-full rounded-lg border-2 border-[var(--sm-border)] bg-[var(--sm-surface)] px-4 text-[16px] text-[var(--sm-text)] outline-none focus:border-[var(--sm-primary)]"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 shrink-0 rounded-full border px-4 text-[14px] font-medium transition active:scale-95 ${
        active
          ? "border-[var(--sm-primary)] bg-[var(--sm-primary)] text-white"
          : "border-[var(--sm-border)] bg-[var(--sm-surface)] text-[var(--sm-text-2)]"
      }`}
    >
      {label}
    </button>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-[var(--sm-primary)]" : "bg-[var(--sm-border)]"}`}
    >
      <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function ProgressSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div className="flex w-full items-center">
            <div className={`h-1 flex-1 rounded ${i <= current ? "bg-[var(--sm-primary)]" : "bg-[var(--sm-border)]"}`} />
          </div>
          <span className={`text-[11px] font-medium ${i <= current ? "text-[var(--sm-primary)]" : "text-[var(--sm-text-2)]"}`}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export function Toast({ message, type = "info", onDone }: { message: string; type?: "success" | "error" | "info"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  const colors = { success: "bg-[var(--sm-success)]", error: "bg-[var(--sm-error)]", info: "bg-[var(--sm-text)]" };
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 animate-[slideUp_0.3s_ease-out]">
      <div className={`pointer-events-auto rounded-xl px-4 py-3 text-[14px] font-medium text-white shadow-lg ${colors[type]}`}>
        {message}
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--sm-border)] ${className}`} />;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm", danger }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string; danger?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[358px] rounded-t-2xl bg-[var(--sm-surface)] p-5 sm:rounded-2xl">
        <h3 className="text-[18px] font-semibold text-[var(--sm-text)]">{title}</h3>
        <p className="mt-2 text-[14px] text-[var(--sm-text-2)]">{message}</p>
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="h-12 flex-1 rounded-lg border-2 border-[var(--sm-border)] text-[15px] font-semibold text-[var(--sm-text)]">Return</button>
          <button onClick={onConfirm} className={`h-12 flex-1 rounded-lg text-[15px] font-semibold text-white ${danger ? "bg-[var(--sm-error)]" : "bg-[var(--sm-primary)]"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

export function useToasts() {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  return {
    toast,
    show: (msg: string, type: "success" | "error" | "info" = "info") => setToast({ msg, type }),
    clear: () => setToast(null),
  };
}
