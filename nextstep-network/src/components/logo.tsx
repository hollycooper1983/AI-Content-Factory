import Link from "next/link";

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="10" fill="#11213B" />
      <path d="M9 29h7v-6h7v-6h8" stroke="#14B8A6" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M27 13l4 4-4 4" stroke="#60A5FA" strokeWidth="3.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2" aria-label="NextStep Network home">
      <LogoMark />
      {!compact && (
        <span className="text-lg font-extrabold tracking-tight text-navy dark:text-white">
          NextStep<span className="text-brand"> Network</span>
        </span>
      )}
    </Link>
  );
}
