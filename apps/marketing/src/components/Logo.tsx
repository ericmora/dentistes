export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="2" fill="#123B32" />
        <path
          d="M10 9.5c1.4-.7 3-.4 4 .7 1-1.1 2.6-1.4 4-.7 1.9 1 2.5 3.3 1.9 5.7-.4 1.8-1.1 3.6-1.6 5.1-.4 1.3-1.2 2.4-2.1 2.4-1.2 0-1.5-1.4-2.1-3-.3-.8-.8-.8-1.1 0-.5 1.6-.9 3-2.1 3-1 0-1.7-1.1-2.1-2.4-.5-1.5-1.2-3.3-1.6-5.1-.6-2.4 0-4.7 1.8-5.7Z"
          fill="#C9F5E4"
        />
        <path d="M13 9.8v8.7M18.6 9.8v8.7" stroke="#123B32" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
      <span className="text-[17px] font-semibold tracking-[-0.03em] text-ink">Dentistes</span>
    </span>
  );
}
