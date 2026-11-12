import type { ReactNode } from "react";

export type IconName =
  | "arrow"
  | "check"
  | "chevron"
  | "menu"
  | "close"
  | "tooth"
  | "calendar"
  | "shield"
  | "whatsapp"
  | "spark"
  | "lock"
  | "database"
  | "users"
  | "clock"
  | "alert"
  | "globe"
  | "quote"
  | "plus";

const paths: Record<IconName, ReactNode> = {
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  check: <path d="m5 12.5 4.2 4.2L19 7" />,
  chevron: <path d="m7 10 5 5 5-5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  tooth: (
    <path d="M7.6 4.2c1.5-.8 3.2-.4 4.4.7 1.2-1.1 2.9-1.5 4.4-.7 2.1 1.1 2.8 3.7 2.1 6.4-.5 2-1.2 4-1.8 5.7-.5 1.5-1.3 2.7-2.4 2.7-1.3 0-1.7-1.5-2.3-3.3-.3-.9-.9-.9-1.2 0-.6 1.8-1 3.3-2.3 3.3-1.1 0-1.9-1.2-2.4-2.7-.6-1.7-1.3-3.7-1.8-5.7-.7-2.7 0-5.3 2.1-6.4Z" />
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </>
  ),
  shield: <path d="M12 3 5 6v5c0 4.4 2.9 8.1 7 9.5 4.1-1.4 7-5.1 7-9.5V6l-7-3Z" />,
  whatsapp: (
    <>
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4.2A8 8 0 1 1 20 11.5Z" />
      <path d="M8.8 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c-.1.2-.2.3 0 .6.5.9 1.3 1.6 2.2 2.1.3.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.3.1.4.3.4.5 0 .4-.2 1.2-.6 1.5-.5.4-1.2.6-1.9.5-1.1-.2-2.7-1-4-2.3-1.3-1.3-2.1-2.8-2.3-3.9-.1-.7.1-1.4.5-1.8Z" />
    </>
  ),
  spark: <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1" />,
  lock: (
    <>
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 5.5a3 3 0 0 1 0 5.8M17 14a5 5 0 0 1 3.5 4.8" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: <path d="M12 4 3.5 19h17L12 4Zm0 5v5m0 3v.1" />,
  globe: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16M12 4c2.2 2.2 3.3 5 3.3 8s-1.1 5.8-3.3 8c-2.2-2.2-3.3-5-3.3-8S9.8 6.2 12 4Z" />
    </>
  ),
  quote: <path d="M9 7H5v5h4v5H5m14-10h-4v5h4v5h-4" />,
  plus: <path d="M12 5v14M5 12h14" />,
};

export function Icon({
  name,
  className = "h-5 w-5",
  strokeWidth = 1.7,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
