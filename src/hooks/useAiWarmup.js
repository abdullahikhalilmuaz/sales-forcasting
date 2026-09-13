import { useEffect, useState, useCallback, useRef } from "react";

/**
 * Warms up the AI service by pinging its health endpoint.
 * Tracks state: idle → warming → ready | failed
 *
 * Because the AI is hosted on Render free tier, first request after
 * 15 min idle takes 30-60s. This hook fires on mount so the service
 * is warm before the user clicks "Generate Forecast".
 */
const AI_URL = "https://sales-forecasting-ai-79l1.onrender.com";
const TIMEOUT_MS = 60000;

const useAiWarmup = () => {
  const [status, setStatus] = useState("idle");
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(null);
  const timer = useRef(null);

  const ping = useCallback(async () => {
    setStatus("warming");
    setElapsed(0);
    startedAt.current = Date.now();

    timer.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);

    try {
      const controller = new AbortController();
      const killTimer = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const res = await fetch(`${AI_URL}/`, {
        signal: controller.signal,
      });
      clearTimeout(killTimer);
      clearInterval(timer.current);
      timer.current = null;

      if (res.ok) {
        setStatus("ready");
      } else {
        setStatus("failed");
      }
    } catch (err) {
      clearInterval(timer.current);
      timer.current = null;
      setStatus("failed");
    }
  }, []);

  useEffect(() => {
    ping();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [ping]);

  return { status, elapsed, retry: ping };
};

export default useAiWarmup;
