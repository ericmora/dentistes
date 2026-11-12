import type { Lang } from "../languages";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import type { Copy } from "./types";

export const COPY: Record<Lang, Copy> = { es, en, ca };

export type { Copy };
