import type { Copy } from "../content/copy";
import { Icon } from "./Icon";

export function WhatsAppMockup({ copy }: { copy: Copy["whatsapp"]["phone"] }) {
  return (
    <div className="relative mx-auto w-full max-w-[21rem]">
      <div className="absolute -inset-6 -z-10 bg-[radial-gradient(circle_at_50%_40%,rgba(201,245,228,0.8),transparent_65%)]" />
      <div className="overflow-hidden rounded-[2rem] border border-ink/20 bg-ink p-2 shadow-float">
        <div className="overflow-hidden rounded-[1.55rem] bg-[#E9E4DA]">
          <div className="flex items-center gap-2.5 bg-pine-900 px-4 pb-3 pt-4 text-paper">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mint-200 text-pine-900">
              <Icon name="tooth" className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{copy.title}</p>
              <p className="flex items-center gap-1 text-[9px] text-mint-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
                {copy.status}
              </p>
            </div>
            <Icon name="whatsapp" className="h-4 w-4 text-mint-200/80" />
          </div>

          <div className="space-y-2.5 px-3 py-4">
            {copy.messages.map((message, index) => (
              <div
                key={`${message.time}-${index}`}
                className={message.from === "clinic" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={[
                    "max-w-[82%] rounded-lg px-2.5 py-2 text-[10px] leading-relaxed shadow-sm",
                    message.from === "clinic"
                      ? "rounded-tr-none bg-[#D9FDD3] text-ink"
                      : "rounded-tl-none bg-white text-ink",
                  ].join(" ")}
                >
                  <p>{message.text}</p>
                  <p className="mt-1 text-right font-mono text-[7px] text-pine-500">{message.time}</p>
                </div>
              </div>
            ))}
            <div className="flex justify-start">
              <div className="rounded-lg rounded-tl-none bg-white px-3 py-2">
                <span className="flex gap-1">
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-pine-500" />
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-pine-500 [animation-delay:160ms]" />
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-pine-500 [animation-delay:320ms]" />
                </span>
              </div>
            </div>
          </div>

          <p className="border-t border-ink/10 bg-[#E9E4DA] px-4 py-2.5 text-center text-[8px] leading-relaxed text-pine-600">
            {copy.note}
          </p>
        </div>
      </div>
    </div>
  );
}
