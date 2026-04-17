import type { RouteRecord } from "vite-react-ssg";
import NotFound from "./pages/NotFound";
import { AppProviders } from "./App";
import ChunkLoadErrorFallback from "./components/layout/ChunkLoadErrorFallback";

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
    errorElement: <ChunkLoadErrorFallback />,
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
        path: "forgot-password",
        lazy: () =>
          import("./pages/auth/ForgotPassword").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "reset-password",
        lazy: () =>
          import("./pages/auth/ResetPassword").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "app",
        lazy: () =>
          import("./components/layout/StudentLayout").then((m) => ({
            Component: m.default,
          })),
        children: [
          {
            index: true,
            lazy: () =>
              import("./pages/app/Home").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "curriculo",
            lazy: () =>
              import("./pages/app/Curriculo").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "instituicoes/:id",
            lazy: () =>
              import("./pages/app/InstitutionDetail").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "conta",
            lazy: () =>
              import("./pages/app/Conta").then((m) => ({
                Component: m.default,
              })),
          },
        ],
      },
      {
        path: "admin",
        lazy: () =>
          import("./components/layout/AdminLayout").then((m) => ({
            Component: m.default,
          })),
        children: [
          {
            index: true,
            lazy: () =>
              import("./pages/admin/Home").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "regras",
            lazy: () =>
              import("./pages/admin/Regras").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "leads",
            lazy: () =>
              import("./pages/admin/Leads").then((m) => ({
                Component: m.default,
              })),
          },
          {
            path: "historico",
            lazy: () =>
              import("./pages/admin/Historico").then((m) => ({
                Component: m.default,
              })),
          },
        ],
      },
      {
        path: "termos",
        lazy: () =>
          import("./pages/legal/TermosDeUso").then((m) => ({
            Component: m.default,
          })),
      },
      {
        path: "privacidade",
        lazy: () =>
          import("./pages/legal/PoliticaPrivacidade").then((m) => ({
            Component: m.default,
          })),
      },
      { path: "*", Component: NotFound },
    ],
  },
];
