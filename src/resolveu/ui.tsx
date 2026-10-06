import { ChevronLeft, Search, Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import type { Status } from "./data";

export function AppHeader({ title, subtitle, onBack, right }: { title: string; subtitle?: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card px-4 pb-3 pt-12">
      {onBack ? (
        <button aria-label="Back" onClick={onBack} className="-ml-2 grid h-10 w-10 place-items-center rounded-xl text-foreground hover:bg-muted">
          <ChevronLeft className="h-5 w-5" />
        </button>
      ) : <span />}
      <div className="min-w-0">
        <h1 className="truncate text-[17px] font-semibold text-foreground">{title}</h1>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="shrink-0">{right}</div>
    </header>
  );
}

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className={cn("block w-full rounded-2xl border border-border bg-card p-4 text-left shadow-card", onClick && "transition active:scale-[0.99]", className)}>
      {children}
    </C>
  );
}

const statusStyle: Record<Status, string> = {
  Submitted: "bg-muted text-muted-foreground",
  "Under Review": "bg-accent text-primary",
  "In Progress": "bg-warning/15 text-warning",
  Escalated: "bg-escalation/15 text-escalation",
  Resolved: "bg-success/12 text-success",
  Rejected: "bg-destructive/10 text-destructive",
  Overdue: "bg-destructive/10 text-destructive",
};
export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium", statusStyle[status])}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function FilterChip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition", active ? "border-navy bg-navy text-navy-foreground" : "border-border bg-card text-muted-foreground")}>
      {children}
    </button>
  );
}

export function PrimaryButton({ className, variant = "primary", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "navy" | "danger" }) {
  const v = { primary: "bg-primary text-primary-foreground", navy: "bg-navy text-navy-foreground", danger: "bg-destructive text-destructive-foreground" }[variant];
  return <button {...p} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition active:opacity-90 disabled:opacity-40", v, className)} />;
}
export function SecondaryButton({ className, ...p }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn("flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-card text-[15px] font-semibold text-foreground transition active:bg-muted", className)} />;
}

export function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-foreground">{children}</span>;
}
export function TextInput({ label, error, className, ...p }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <input {...p} className={cn("h-12 w-full rounded-xl border bg-card px-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10", error ? "border-destructive" : "border-border", className)} />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
export function TextArea({ label, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <Label>{label}</Label>}
      <textarea {...p} className="min-h-28 w-full resize-none rounded-xl border border-border bg-card p-4 text-[15px] text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10" />
    </label>
  );
}

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-3">
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search by ID or title" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
    </div>
  );
}

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex rounded-xl bg-muted p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={cn("flex-1 rounded-lg py-2 text-sm font-medium", value === o ? "bg-card text-foreground shadow-card" : "text-muted-foreground")}>{o}</button>
      ))}
    </div>
  );
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.36 }} className="grid shrink-0 place-items-center rounded-full bg-navy font-semibold text-navy-foreground">{initials}</div>
  );
}

export function ListRow({ icon: Icon, label, onClick, danger, right }: { icon: LucideIcon; label: string; onClick: () => void; danger?: boolean; right?: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-muted">
      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", danger ? "bg-destructive/10 text-destructive" : "bg-muted text-foreground")}><Icon className="h-[18px] w-[18px]" strokeWidth={1.75} /></span>
      <span className={cn("min-w-0 flex-1 truncate text-[15px] font-medium", danger ? "text-destructive" : "text-foreground")}>{label}</span>
      {right}
    </button>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text }: { icon?: LucideIcon; title: string; text?: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent text-primary"><Icon className="h-7 w-7" strokeWidth={1.5} /></div>
      <p className="text-base font-semibold text-foreground">{title}</p>
      {text && <p className="mt-1 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}

export function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-4">
          <div className="h-3 w-24 rounded bg-muted" />
          <div className="mt-3 h-4 w-3/4 rounded bg-muted" />
          <div className="mt-4 flex justify-between"><div className="h-6 w-24 rounded-full bg-muted" /><div className="h-3 w-12 rounded bg-muted" /></div>
        </div>
      ))}
    </div>
  );
}

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="animate-fade absolute inset-0 bg-foreground/40" onClick={onClose} />
      <div className="animate-sheet relative max-h-[85%] overflow-y-auto rounded-t-3xl bg-card px-5 pb-8 pt-3">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function ConfirmationDialog({ open, title, text, confirmLabel, danger, onCancel, onConfirm }: { open: boolean; title: string; text: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 grid place-items-center px-6">
      <div className="animate-fade absolute inset-0 bg-foreground/40" onClick={onCancel} />
      <div className="animate-fade relative w-full rounded-2xl bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="animate-toast absolute left-1/2 top-24 z-[60] -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-4 py-2.5 text-sm font-medium text-navy-foreground shadow-card">
      {message}
    </div>
  );
}

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn("relative h-7 w-12 shrink-0 rounded-full transition", on ? "bg-primary" : "bg-border")}>
      <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-card shadow-card transition", on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}
