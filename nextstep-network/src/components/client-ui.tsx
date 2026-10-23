"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn, initials } from "@/lib/format";

export function SubmitButton({ children, className = "btn-primary", pendingText }: { children: ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending} aria-busy={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {pending ? pendingText ?? "Saving…" : children}
    </button>
  );
}

/** Runs a bound server action on click, with a pending state and an optional confirmation. */
export function ActionButton({
  action, children, className = "btn-secondary btn-sm", confirm: confirmText, title, onDone,
}: {
  action: () => Promise<unknown>;
  children: ReactNode;
  className?: string;
  confirm?: string;
  title?: string;
  onDone?: (result: unknown) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      className={className}
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(async () => {
          const r = await action();
          onDone?.(r);
        });
      }}
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

/** Action button that shows the {ok, message} result returned by the server. */
export function ResultActionButton({ action, children, className }: { action: () => Promise<{ ok: boolean; message: string }>; children: ReactNode; className?: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; message: string } | null>(null);
  return (
    <div className="flex flex-col items-start gap-1">
      <ActionButton action={action} className={className} onDone={(r) => setMsg(r as { ok: boolean; message: string })}>{children}</ActionButton>
      {msg && <p role="status" className={cn("text-xs", msg.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{msg.message}</p>}
    </div>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } }) {
  if (!state) return null;
  if (state.error) return <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm font-medium text-green-700 dark:text-green-400">{state.ok}</p>;
  return null;
}

/** Detects images that failed to load before React hydrated (onError would have been missed). */
function useImgFailed(src?: string | null) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);
  return { ref, failed, setFailed };
}

export function Avatar({ src, name, size = 40, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  const { ref, failed, setFailed } = useImgFailed(src);
  const style = { width: size, height: size, fontSize: Math.max(10, size * 0.38) };
  if (!src || failed) {
    return (
      <span style={style} className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-brand to-teal font-semibold text-white", className)} aria-hidden>
        {initials(name) || "?"}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt="" width={size} height={size} style={style} onError={() => setFailed(true)} className={cn("shrink-0 rounded-full object-cover", className)} />;
}

export function SafeImage({ src, alt, className, fallbackClass = "bg-gradient-to-br from-navy via-brand to-teal" }: { src: string; alt: string; className?: string; fallbackClass?: string }) {
  const { ref, failed, setFailed } = useImgFailed(src);
  if (failed || !src) return <div className={cn(className, fallbackClass)} role="img" aria-label={alt} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img ref={ref} src={src} alt={alt} className={className} onError={() => setFailed(true)} loading="lazy" />;
}
