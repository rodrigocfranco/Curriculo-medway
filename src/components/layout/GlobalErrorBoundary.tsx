import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";

import GlobalErrorFallback from "./GlobalErrorFallback";

export const GlobalErrorBoundary = ({ children }: { children: ReactNode }) => (
  <Sentry.ErrorBoundary
    fallback={({ resetError }) => (
      <GlobalErrorFallback resetError={resetError} />
    )}
  >
    {children}
  </Sentry.ErrorBoundary>
);

export default GlobalErrorBoundary;
