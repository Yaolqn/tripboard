import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn("size-6", className)}
    >
      <rect width="64" height="64" rx="14" fill="currentColor" />
      <path
        d="M32 12c-7.5 0-13.5 6.2-13.5 13.8C18.5 37.5 32 52 32 52s13.5-14.5 13.5-26.2C45.5 18.2 39.5 12 32 12z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="26" r="5.5" fill="#ffffff" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex select-none items-center gap-2", className)}>
      <LogoMark className="size-[22px] text-foreground" />
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        TripBoard
      </span>
    </span>
  );
}
