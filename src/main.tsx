import { ViteReactSSG } from "vite-react-ssg";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "./index.css";
import { routes } from "./router";
import { initSentry } from "./lib/sentry";

export const createRoot = ViteReactSSG(
  { routes },
  () => {
    initSentry();
  },
  {
    rootContainer: "#root",
  },
);
