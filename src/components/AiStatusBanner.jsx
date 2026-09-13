import { Server, CheckCircle2, AlertTriangle, X } from "lucide-react";
import useAiWarmup from "../hooks/useAiWarmup";
import Spinner from "./Spinner";
import { useState } from "react";
import "../styles/aiStatus.css";

const AiStatusBanner = () => {
  const { status, elapsed, retry } = useAiWarmup();
  const [dismissed, setDismissed] = useState(false);

  // Ready and dismissed → don't render anything
  if (status === "ready" || status === "idle" || dismissed) return null;

  if (status === "warming") {
    return (
      <div className="ai-banner ai-banner-info">
        <div className="ai-banner-icon">
          <Server size={18} />
        </div>
        <div className="ai-banner-body">
          <strong>Waking up the AI engine…</strong>
          <span>
            First request after idle can take up to 60 seconds. Please wait
            {elapsed > 0 && ` (${elapsed}s)`}.
          </span>
        </div>
        <div className="ai-banner-spinner">
          <Spinner size={18} color="#3b82f6" />
        </div>
        <button
          className="ai-banner-close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="ai-banner ai-banner-error">
        <div className="ai-banner-icon">
          <AlertTriangle size={18} />
        </div>
        <div className="ai-banner-body">
          <strong>AI service unavailable</strong>
          <span>
            The forecasting engine did not respond. You can keep using the rest
            of the app — forecasts will fail until it&apos;s running.
          </span>
        </div>
        <button className="ai-banner-retry" onClick={retry}>
          Retry
        </button>
        <button
          className="ai-banner-close"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
};

export default AiStatusBanner;
