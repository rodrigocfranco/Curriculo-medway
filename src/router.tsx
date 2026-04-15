import type { RouteRecord } from "vite-react-ssg";
import NotFound from "./pages/NotFound";
import { AppProviders } from "./App";

const devDesignSystemRoute: RouteRecord[] = import.meta.env.DEV
  ? [
      {
        path: "design-system",
        lazy: () =>
          import("./pages/DesignSystem").then((m) => ({ Component: m.default })),
      },
    ]
  : [];

export const routes: RouteRecord[] = [
  {
    path: "/",
    Component: AppProviders,
    children: [
      {
        index: true,
        lazy: () =>
          import("./pages/Landing").then((m) => ({ Component: m.default })),
      },
      ...devDesignSystemRoute,
      {
        path: "signup",
        lazy: () =>
          import("./pages/auth/Signup").then((m) => ({ Component: m.default })),
      },
      {
        path: "login",
        lazy: () =>
          import("./pages/auth/Login").then((m) => ({ Component: m.default })),
      },
      {
        path: "app",
        lazy: () =>
          import("./pages/app/Home").then((m) => ({ Component: m.default })),
      },
      {
        path: "admin",
        lazy: () =>
          import("./pages/admin/Home").then((m) => ({ Component: m.default })),
      },
      { path: "*", Component: NotFound },
    ],
  },
];
