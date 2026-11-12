import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { parsePath } from "./lib/seo";

const page = parsePath(window.location.pathname);
const root = document.getElementById("root");

if (root) {
  hydrateRoot(
    root,
    <StrictMode>
      <App page={page} />
    </StrictMode>,
  );
}
