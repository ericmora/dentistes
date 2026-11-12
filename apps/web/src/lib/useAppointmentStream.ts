import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@dentistes/ui";
import { useSession } from "./session";

export function useAppointmentStream(enabled: boolean) {
  const { sdk } = useSession();
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const [connected, setConnected] = useState(false);
  const retryDelay = useRef(1000);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    function connect() {
      if (!active) return;
      const url = sdk.appointmentStreamUrl();
      if (!url) return;

      source = new EventSource(url, { withCredentials: true });
      source.addEventListener("ready", () => {
        retryDelay.current = 1000;
        if (active) setConnected(true);
      });
      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as { type?: string };
          if (parsed.type?.startsWith("appointment.")) {
            void queryClient.invalidateQueries({ queryKey: ["appointments"] });
          }
          if (parsed.type === "waiting_list.matches") {
            void queryClient.invalidateQueries({ queryKey: ["waiting-list"] });
            notify({
              tone: "info",
              title: "Forat alliberat a l'agenda",
              description: "Hi ha candidats compatibles a la llista d'espera.",
            });
          }
        } catch {
          void queryClient.invalidateQueries({ queryKey: ["appointments"] });
        }
      };
      source.onerror = () => {
        if (!active) return;
        setConnected(false);
        source?.close();
        const wait = retryDelay.current;
        retryDelay.current = Math.min(wait * 2, 30_000);
        timer = setTimeout(connect, wait);
      };
    }

    connect();
    return () => {
      active = false;
      setConnected(false);
      if (timer) clearTimeout(timer);
      source?.close();
    };
  }, [enabled, sdk, queryClient, notify]);

  return { connected };
}
