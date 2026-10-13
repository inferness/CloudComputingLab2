"use client";

import { useEffect, useState, useCallback } from "react";

interface UserStat {
  userId: string;
  followers: number;
  followees: number;
  notFound?: boolean;
}

interface ApiResponse {
  message?: string;
  users?: UserStat[];
  formatted?: string[];
  totalUsers?: number;
  error?: string;
  [key: string]: unknown;
}

const DEFAULT_USERS_QUERY = "214328887, 107830991";
const BASE_ENDPOINT_URL =
  "https://ncqld0c2j5.execute-api.ap-southeast-1.amazonaws.com/users";

export default function Home() {
  const [userIdInput, setUserIdInput] = useState<string>(DEFAULT_USERS_QUERY);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastFetched, setLastFetched] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>(BASE_ENDPOINT_URL);
  const [copiedFormat, setCopiedFormat] = useState<boolean>(false);
  const [showDocHelp, setShowDocHelp] = useState<boolean>(false);

  const executeQuery = useCallback(async (queryStr: string) => {
    setLoading(true);
    setError(null);
    const cleanIds = queryStr
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join(",");

    const targetUrl = cleanIds
      ? `${BASE_ENDPOINT_URL}?userIds=${encodeURIComponent(cleanIds)}`
      : BASE_ENDPOINT_URL;

    setCurrentUrl(targetUrl);
    const startTime = performance.now();

    try {
      const res = await fetch(targetUrl, {
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

      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);
      setLastFetched(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch response";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Run only once on mount to populate initial lab results
  useEffect(() => {
    executeQuery(DEFAULT_USERS_QUERY);
  }, [executeQuery]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeQuery(userIdInput);
  };

  const handlePresetClick = (presetIds: string) => {
    setUserIdInput(presetIds);
    executeQuery(presetIds);
  };

  // Compile formatted lines according to the exact project specification
  const formattedLines =
    data?.formatted && data.formatted.length > 0
      ? data.formatted
      : data?.users && data.users.length > 0
      ? data.users.flatMap((u) => [
          `${u.userId} has ${u.followers} followers`,
          `${u.userId} has ${u.followees} followees`,
        ])
      : [];

  const copyToClipboard = () => {
    if (formattedLines.length === 0) return;
    navigator.clipboard.writeText(formattedLines.join("\n"));
    setCopiedFormat(true);
    setTimeout(() => setCopiedFormat(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-sky-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ☁
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-100">
                Cloud Computing Lab 2: Twitter Analytics
              </h1>
              <p className="text-xs text-slate-400">
                Spark on EMR &bull; AWS Lambda &bull; Next.js Amplify
              </p>
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
      <main className="relative z-10 flex-1 flex flex-col items-center px-4 sm:px-6 py-8 sm:py-12 max-w-4xl mx-auto w-full">
        {/* Main Card */}
        <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-black/40 space-y-6">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800/80">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-400 uppercase tracking-wider mb-1">
                <span>Data Analysis Pipeline</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-50 tracking-tight">
                User Follower &amp; Followee Statistics
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Query processed graph analytics retrieved by Lambda from S3
                results generated via Spark on EMR.
              </p>
            </div>
            <button
              onClick={() => setShowDocHelp(!showDocHelp)}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-4 self-start sm:self-center cursor-pointer"
            >
              {showDocHelp ? "Hide Report Notes" : "View Report Descriptions"}
            </button>
          </div>

          {/* Submission Descriptions Helper (Collapsible) */}
          {showDocHelp && (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-xs text-slate-300 space-y-3">
              <div>
                <span className="font-semibold text-indigo-300 block mb-1">
                  Front-End Set-up Description (Max 50 words):
                </span>
                <p className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
                  Built using Next.js, React, and TailwindCSS deployed on AWS
                  Amplify. The front-end queries an Amazon API Gateway REST
                  endpoint via asynchronous HTTP GET requests, parses the JSON
                  response containing follower and followee counts for requested
                  user IDs, and displays statistics in the required format.
                </p>
              </div>
              <div>
                <span className="font-semibold text-indigo-300 block mb-1">
                  Back-End Set-up Description (Max 100 words):
                </span>
                <p className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 font-mono text-slate-300">
                  The back-end utilizes Amazon API Gateway connected to an AWS
                  Lambda Python function. The data analysis component runs
                  Apache Spark on AWS EMR to clean, deduplicate, and calculate
                  follower and followee metrics from the raw Twitter dataset in
                  Amazon S3, outputting results back to S3. When invoked, Lambda
                  extracts the requested user IDs, scans the S3 partitioned
                  result files, extracts matching user statistics, and returns
                  formatted responses with CORS headers to the front-end.
                </p>
              </div>
            </div>
          )}

          {/* Search Controls */}
          <div className="space-y-3">
            <label
              htmlFor="user-id-input"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
            >
              Target User IDs (comma-separated):
            </label>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                id="user-id-input"
                type="text"
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="e.g. 214328887, 107830991"
                className="flex-1 bg-slate-950/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
              />
              <button
                id="query-button"
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 cursor-pointer"
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
                <span>{loading ? "Fetching..." : "Query Backend"}</span>
              </button>
            </form>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="text-slate-500">Quick Presets:</span>
              <button
                onClick={() => handlePresetClick("214328887, 107830991")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                Lab Submission Users (214328887 &amp; 107830991)
              </button>
              <button
                onClick={() => handlePresetClick("214328887")}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                User 214328887
              </button>
              <button
                onClick={() => handlePresetClick("107830991")}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                User 107830991
              </button>
            </div>
          </div>

          {/* Results Area */}
          <div className="my-6">
            {loading ? (
              <div className="p-10 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col items-center justify-center gap-3 animate-pulse">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-slate-400">
                  Retrieving data from S3 via API Gateway &amp; Lambda...
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
                  <span>Failed to load statistics</span>
                </div>
                <p className="text-sm text-rose-300/90 mb-4">{error}</p>
                <button
                  onClick={() => executeQuery(userIdInput)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : data?.users && data.users.length > 0 ? (
              <div className="space-y-6">
                {/* 1. Exact Lab Specification Output Block */}
                <div className="rounded-xl bg-slate-950/90 border border-indigo-900/40 p-5 relative overflow-hidden group">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Specification Format Output
                      </span>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedFormat ? (
                        <>
                          <span className="text-emerald-400">&#10003;</span>{" "}
                          Copied!
                        </>
                      ) : (
                        "Copy Format"
                      )}
                    </button>
                  </div>
                  <div
                    id="spec-formatted-display"
                    className="font-mono text-sm sm:text-base text-emerald-300 leading-relaxed bg-black/40 p-4 rounded-lg border border-slate-800/80 select-all"
                  >
                    {formattedLines.map((line, idx) => (
                      <div key={idx} className="py-0.5">
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Structured Visual Cards */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                    Detailed Metrics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.users.map((user) => (
                      <div
                        key={user.userId}
                        className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-5 hover:border-slate-700 transition-all shadow-md"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono text-slate-500 uppercase">
                            User ID
                          </span>
                          <span className="font-mono text-sm font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                            {user.userId}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/60">
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                            <span className="text-xs text-slate-400 block mb-1">
                              Followers
                            </span>
                            <span className="text-2xl font-bold font-mono text-slate-100">
                              {user.followers.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Users following them
                            </span>
                          </div>
                          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                            <span className="text-xs text-slate-400 block mb-1">
                              Followees
                            </span>
                            <span className="text-2xl font-bold font-mono text-slate-100">
                              {user.followees.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              Users they follow
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : data?.message ? (
              <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800/90 text-center">
                <div className="text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                  Lambda Initial Status
                </div>
                <div className="text-2xl font-bold text-indigo-300 font-mono mb-2">
                  &ldquo;{data.message}&rdquo;
                </div>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  The Lambda function is still returning the initial message.
                  Deploy the updated <code className="text-indigo-400">lambda_function.py</code> in AWS Lambda to connect it to S3 analytics.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-slate-400 text-sm">
                No user statistics returned.
              </div>
            )}
          </div>

          {/* Endpoint Details & Metadata */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800/60 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
              <span className="text-slate-400">Current Endpoint:</span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-indigo-400 hover:text-indigo-300 truncate max-w-md underline underline-offset-2"
              >
                {currentUrl}
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
        CS5224 Cloud Computing &mdash; Lab 2
      </footer>
    </div>
  );
}

