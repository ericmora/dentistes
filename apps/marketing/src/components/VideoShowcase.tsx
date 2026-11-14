import { useRef, useState } from "react";
import type { Lang } from "../content/languages";
import { Icon } from "./Icon";

interface VideoAct {
  id: string;
  start: number;
  end: number;
  timecode: string;
  stage: string;
  quote: string;
  detail: string;
}

const VIDEO_COPY: Record<
  Lang,
  {
    index: string;
    eyebrow: string;
    title: string;
    intro: string;
    listenCta: string;
    muteCta: string;
    playLabel: string;
    pauseLabel: string;
    durationBadge: string;
    acts: VideoAct[];
  }
> = {
  es: {
    index: "SPOT · 00:10",
    eyebrow: "Dentistes en 10 segundos",
    title: "Del caos de carpetas y pantallas antiguas al control clínico integral",
    intro:
      "Mira en 10 segundos cómo cambia el día a día cuando conectas recepción, historial y odontograma en una sola plataforma.",
    listenCta: "Escuchar con audio (0:10)",
    muteCta: "Silenciar audio",
    playLabel: "Reproducir vídeo",
    pauseLabel: "Pausar vídeo",
    durationBadge: "00:10 · HD",
    acts: [
      {
        id: "act-1",
        start: 0,
        end: 3.7,
        timecode: "00:00 — 00:03",
        stage: "01 · El problema",
        quote: "«Llegó el momento de simplificarlo todo.»",
        detail: "Deja atrás el papeleo, las fichas sueltas y los programas lentos a final de jornada.",
      },
      {
        id: "act-2",
        start: 3.7,
        end: 6.7,
        timecode: "00:04 — 00:06",
        stage: "02 · La solución integral",
        quote: "«Descubre Dentistes, la solución integral.»",
        detail: "Recepción y gabinetes sincronizados al instante desde cualquier ordenador o tableta.",
      },
      {
        id: "act-3",
        start: 6.7,
        end: 10.1,
        timecode: "00:07 — 00:10",
        stage: "03 · En el gabinete",
        quote: "«Optimiza tu agenda, historial y odontograma.»",
        detail: "Explica el diagnóstico al paciente en la silla con el odontograma y su evolución a la vista.",
      },
    ],
  },
  ca: {
    index: "SPOT · 00:10",
    eyebrow: "Dentistes en 10 segons",
    title: "Del caos de carpetes i pantalles antigues al control clínic integral",
    intro:
      "Mira en 10 segons com canvia el dia a dia quan connectes recepció, historial i odontograma en una sola plataforma.",
    listenCta: "Escoltar amb àudio (0:10)",
    muteCta: "Silenciar àudio",
    playLabel: "Reproduir vídeo",
    pauseLabel: "Pausar vídeo",
    durationBadge: "00:10 · HD",
    acts: [
      {
        id: "act-1",
        start: 0,
        end: 3.7,
        timecode: "00:00 — 00:03",
        stage: "01 · El problema",
        quote: "«Llegó el momento de simplificarlo todo.»",
        detail: "Deixa enrere la paperassa, les fitxes soltes i els programes lents a final de jornada.",
      },
      {
        id: "act-2",
        start: 3.7,
        end: 6.7,
        timecode: "00:04 — 00:06",
        stage: "02 · La solució integral",
        quote: "«Descubre Dentistes, la solución integral.»",
        detail: "Recepció i gabinets sincronitzats a l'instant des de qualsevol ordinador o tauleta.",
      },
      {
        id: "act-3",
        start: 6.7,
        end: 10.1,
        timecode: "00:07 — 00:10",
        stage: "03 · Al gabinet",
        quote: "«Optimiza tu agenda, historial y odontograma.»",
        detail: "Explica el diagnòstic al pacient a la cadira amb l'odontograma i l'evolució a la vista.",
      },
    ],
  },
  en: {
    index: "SPOT · 00:10",
    eyebrow: "Dentistes in 10 seconds",
    title: "From paper folders and legacy screens to all-in-one clinical control",
    intro:
      "See in 10 seconds how daily practice changes when reception, clinical records, and odontogram work in one place.",
    listenCta: "Play with sound (0:10)",
    muteCta: "Mute audio",
    playLabel: "Play video",
    pauseLabel: "Pause video",
    durationBadge: "00:10 · HD",
    acts: [
      {
        id: "act-1",
        start: 0,
        end: 3.7,
        timecode: "00:00 — 00:03",
        stage: "01 · The problem",
        quote: "“It's time to simplify everything.”",
        detail: "Leave behind paper folders, scattered charts, and sluggish legacy software.",
      },
      {
        id: "act-2",
        start: 3.7,
        end: 6.7,
        timecode: "00:04 — 00:06",
        stage: "02 · All-in-one solution",
        quote: "“Discover Dentistes, the all-in-one solution.”",
        detail: "Front desk and operatories synced in real time across desktops and tablets.",
      },
      {
        id: "act-3",
        start: 6.7,
        end: 10.1,
        timecode: "00:07 — 00:10",
        stage: "03 · Chairside clarity",
        quote: "“Optimize your schedule, records, and odontogram.”",
        detail: "Present treatment plans chairside with the interactive odontogram and patient history.",
      },
    ],
  },
};

export function VideoShowcase({
  lang,
  variant = "editorial",
}: {
  lang: Lang;
  variant?: "editorial" | "hero";
}) {
  const t = VIDEO_COPY[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [activeActIndex, setActiveActIndex] = useState(0);

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    const now = el.currentTime;
    const foundIndex = t.acts.findIndex((act) => now >= act.start && now < act.end);
    if (foundIndex !== -1 && foundIndex !== activeActIndex) {
      setActiveActIndex(foundIndex);
    }
  }

  function togglePlay() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  }

  function toggleSound() {
    const el = videoRef.current;
    if (!el) return;
    if (isMuted) {
      el.muted = false;
      el.currentTime = 0;
      void el.play();
      setIsMuted(false);
      setIsPlaying(true);
      setActiveActIndex(0);
    } else {
      el.muted = true;
      setIsMuted(true);
    }
  }

  function seekToAct(index: number) {
    const el = videoRef.current;
    const act = t.acts[index];
    if (!el || !act) return;
    el.currentTime = act.start;
    void el.play();
    setIsPlaying(true);
    setActiveActIndex(index);
  }

  const currentAct = t.acts[activeActIndex] ?? t.acts[0];

  const playerCard = (
    <div className="overflow-hidden rounded-panel border border-line-strong bg-pine-950 text-paper shadow-panel">
      {/* Top Clinical Frame Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-pine-900 px-3.5 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-mint-400 animate-pulse-dot" />
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-mint-100/90">
            {t.eyebrow}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-mint-200/60 sm:inline">
            {t.durationBadge}
          </span>
          <button
            type="button"
            onClick={toggleSound}
            className={[
              "inline-flex items-center gap-1.5 rounded-panel border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] transition",
              isMuted
                ? "border-signal bg-signal text-white hover:bg-[#1f43d6]"
                : "border-mint-400/50 bg-mint-500/20 text-mint-200 hover:bg-mint-500/30",
            ].join(" ")}
          >
            <Icon name={isMuted ? "volume" : "mute"} className="h-3.5 w-3.5" />
            {isMuted ? t.listenCta : t.muteCta}
          </button>
        </div>
      </div>

      {/* 16:9 Video Viewport */}
      <div className="group relative aspect-video w-full bg-pine-950">
        <video
          ref={videoRef}
          className="h-full w-full cursor-pointer object-cover"
          src="/videos/dentistes-spot.mp4"
          poster="/videos/dentistes-spot-poster.webp"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          aria-label={t.title}
        >
          <track kind="captions" src="/videos/dentistes-spot.es.vtt" srcLang="es" label="Español" default={lang === "es"} />
          <track kind="captions" src="/videos/dentistes-spot.ca.vtt" srcLang="ca" label="Català" default={lang === "ca"} />
          <track kind="captions" src="/videos/dentistes-spot.en.vtt" srcLang="en" label="English" default={lang === "en"} />
        </video>

        {/* Bottom Gradient & Live Synced Voiceover Caption */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-pine-950/90 via-pine-950/45 to-transparent p-3.5 sm:p-5">
          <div className="max-w-xl">
            <span className="inline-block font-mono text-[9px] uppercase tracking-[0.14em] text-mint-300">
              {currentAct.timecode} · {currentAct.stage}
            </span>
            <p className="mt-0.5 text-sm font-semibold leading-snug text-white sm:text-base">
              {currentAct.quote}
            </p>
          </div>

          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? t.pauseLabel : t.playLabel}
            className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-panel border border-white/25 bg-pine-950/80 text-white backdrop-blur-sm transition hover:border-mint-300 hover:bg-pine-900"
          >
            <Icon name={isPlaying ? "pause" : "play"} className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3-Act Interactive Storyboard Scrubber */}
      <div className="grid grid-cols-1 divide-y divide-white/10 border-t border-white/10 bg-pine-900/95 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {t.acts.map((act, index) => {
          const active = index === activeActIndex;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => seekToAct(index)}
              aria-pressed={active}
              className={[
                "relative flex flex-col justify-between p-3.5 text-left transition sm:p-4",
                active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
              ].join(" ")}
            >
              <span
                className={[
                  "absolute inset-x-0 top-0 h-0.5 transition-opacity",
                  active ? "bg-mint-400 opacity-100" : "opacity-0",
                ].join(" ")}
              />
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-mint-300/80">
                    {act.stage}
                  </span>
                  <span className="font-mono text-[9px] tabular text-mint-100/50">
                    {act.timecode}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-semibold text-white">{act.quote}</p>
                {variant === "editorial" ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-mint-100/70">{act.detail}</p>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  if (variant === "hero") {
    return playerCard;
  }

  return (
    <div id="spot" className="mt-14 border-t border-line pt-12 sm:mt-16 sm:pt-14">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mono-label">{t.index}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">
            {t.title}
          </h3>
        </div>
        <p className="max-w-md text-xs leading-relaxed text-pine-600 sm:text-sm">{t.intro}</p>
      </div>
      {playerCard}
    </div>
  );
}
