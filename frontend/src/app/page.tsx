"use client";

import { useEffect, useState, useCallback } from "react";

interface ApiResponse {
  message?: string;
  [key: string]: unknown;
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);

  const endpointUrl =
    "https://fyzscinsea.execute-api.ap-southeast-2.amazonaws.com/hello";

  const fetchMessage = useCallback(async () => {
    setLoading(true);
    setError(null);
    const startTime = performance.now();
    try {
      const res = await fetch(endpointUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const json = (await res.json()) as ApiResponse;
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setData(json);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch response";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [endpointUrl]);

  useEffect(() => {
    fetchMessage();
  }, [fetchMessage]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ☁
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">
                Cloud Computing Lab 2
              </h1>
              <p className="text-xs text-slate-400">AWS Lambda & Amplify Integration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              API Gateway Live
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full">
        {/* Main Card */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-black/40">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">
                <span>Lambda Response</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-50 tracking-tight">
                Backend API Message
              </h2>
            </div>

            <button
              id="refetch-button"
              onClick={fetchMessage}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{loading ? "Fetching..." : "Refetch"}</span>
            </button>
          </div>

          {/* Response Container */}
          <div className="my-8">
            {loading ? (
              <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400">
                  Calling API Gateway endpoint...
                </span>
              </div>
            ) : error ? (
              <div className="p-6 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-200">
                <div className="flex items-center gap-2 font-semibold text-rose-400 mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Failed to load message</span>
                </div>
                <p className="text-sm text-rose-300/90 mb-4">{error}</p>
                <button
                  onClick={fetchMessage}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                  Returned Message
                </div>
                <div
                  id="message-display"
                  className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300 font-mono tracking-tight"
                >
                  &ldquo;{data?.message ?? JSON.stringify(data)}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* Metadata & Endpoint Details */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
              <span className="text-slate-400">Endpoint:</span>
              <a
                href={endpointUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-indigo-400 hover:text-indigo-300 truncate max-w-md underline underline-offset-2"
              >
                {endpointUrl}
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="block text-slate-500">HTTP Status</span>
                <span className="font-semibold text-emerald-400">
                  {error ? "Error" : "200 OK"}
                </span>
              </div>
              <div>
                <span className="block text-slate-500">Latency</span>
                <span className="font-mono text-slate-300">
                  {latency !== null ? `${latency} ms` : "—"}
                </span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="block text-slate-500">Last Synced</span>
                <span className="font-mono text-slate-300">
                  {lastFetched ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        CS5224 Cloud Computing — Lab 2
      </footer>
    </div>
  );
}
