import { Component } from "react";
import { Link } from "react-router-dom";
import { WellnessButton } from "./WellnessButton";
import { Heart, Home, RefreshCw } from "lucide-react";
import { dictLookup } from "../i18n/dictLookup";

/**
 * Catches render errors so elders never see a blank white screen.
 * Does not catch async/API errors — those should use try/catch + inline messages.
 */
export class GraceErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[GraceErrorBoundary${this.props.section ? `:${this.props.section}` : ""}]`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const home = this.props.homeTo || "/";
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6 py-16 bg-[#FAFAFA]">
          <div className="max-w-md w-full rounded-[24px] bg-white border border-slate-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <Heart className="text-rose-400" size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">{dictLookup("errBoundary.title")}</h1>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6">{dictLookup("errBoundary.sub")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <WellnessButton variant="primary" size="large" className="flex items-center justify-center gap-2" onClick={this.handleRetry}>
                <RefreshCw size={18} />
                {dictLookup("errBoundary.retry")}
              </WellnessButton>
              <Link to={home} className="inline-flex">
                <WellnessButton variant="secondary" size="large" className="w-full flex items-center justify-center gap-2">
                  <Home size={18} />
                  {dictLookup("errBoundary.home")}
                </WellnessButton>
              </Link>
            </div>
            {import.meta.env.DEV && this.state.error?.message ? (
              <p className="mt-6 text-left text-xs text-red-700/80 font-mono break-all bg-red-50 p-3 rounded-lg">
                {this.state.error.message}
              </p>
            ) : null}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
