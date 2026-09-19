import { Component, type ErrorInfo, type ReactNode } from "react";

import { AppError } from "@/components/app-error";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = { children: ReactNode };
type State = { error: unknown; hasError: boolean };

/**
 * Yttersta skyddsnätet. Routerns defaultErrorComponent fångar bara fel inne i
 * en route — fel som kastas i rotkomponenten, i commit-fasen eller under
 * hydrering gav tidigare en helt vit skärm. Den här gränsen fångar allt,
 * även värden som inte är Error (t.ex. `undefined`), och visar AppError.
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: undefined, hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { error, hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    reportLovableError(error ?? new Error("Okänt renderingsfel (inget felobjekt)"), {
      source: "root_error_boundary",
      componentStack: info?.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) return <AppError error={this.state.error} />;
    return this.props.children;
  }
}

export default RootErrorBoundary;
