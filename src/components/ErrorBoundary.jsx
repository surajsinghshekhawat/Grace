import { Component } from "react";
import { dictLookup } from "../i18n/dictLookup";

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback ?? (
        <div className="grace-card grace-card-pad">
          <p className="text-red-600 font-semibold">{dictLookup("app.unexpectedErrorTitle")}</p>
          <p className="text-gray-700 text-sm mt-1">{this.state.error?.message}</p>
          {this.props.onRetry && (
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onRetry?.();
              }}
              className="grace-pill-primary mt-3"
            >
              {dictLookup("app.tryAgain")}
            </button>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
