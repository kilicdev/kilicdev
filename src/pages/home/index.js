import { useEffect, useState } from "react";
import {
  FiGitCommit,
  FiCode,
  FiUsers,
  FiTerminal,
  FiCopy,
  FiExternalLink,
  FiGithub,
  FiMaximize2,
  FiRadio,
  FiCommand,
  FiGlobe,
  FiAlertTriangle,
  FiRefreshCw,
  FiLayers,
} from "react-icons/fi";
import toast, { Toaster } from "react-hot-toast";

import BackgroundCanvas from "../../components/BackgroundCanvas";
import CommandPalette from "../../components/CommandPalette";
import TechStack from "../../components/TechStack";
import ImageLightbox from "../../components/ImageLightbox";

const sanitizeCommitMessage = (value = "", limit = 50) => {
  const text = String(value || "").split("\n")[0].trim();
  if (!text) return "Commit updates...";
  const truncated = text.length > limit ? text.slice(0, limit).trim() : text;
  return truncated + "...";
};

const formatRelativeTime = (value) => {
  if (!value) return "—";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "—";

  const elapsed = Math.max(0, Date.now() - timestamp);
  const minutes = Math.floor(elapsed / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return "just now";
  if (hours < 1) return `${minutes}m ago`;
  if (days < 1) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
};

const formatRefresh = (value) => {
  if (!value) return "pending sync";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const HomePage = () => {
  const [profile, setProfile] = useState(null);
  const [loadState, setLoadState] = useState("syncing");
  const [activeTab, setActiveTab] = useState("commits");
  const [terminalTab, setTerminalTab] = useState("whoami");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const fetchProfileData = () => {
    setLoadState("syncing");
    fetch("/libs/profile-data.json", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Profile data unavailable");
        return response.json();
      })
      .then((data) => {
        setProfile({
          ...data,
          repositories: Array.isArray(data.repositories) ? data.repositories : [],
          organizations: Array.isArray(data.organizations) ? data.organizations : [],
          commits: Array.isArray(data.commits)
            ? data.commits.slice(0, 5).map((c) => ({ ...c, message: sanitizeCommitMessage(c.message, 50) }))
            : [],
        });
        setLoadState("online");
      })
      .catch(() => {
        setProfile(null);
        setLoadState("offline");
      });
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`, {
      style: {
        background: "#0d0f1c",
        color: "#38bdf8",
        border: "1px solid rgba(56, 189, 248, 0.3)",
      },
    });
  };

  return (
    <div className="relative min-h-screen bg-[#080811] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden w-full max-w-full">
      <Toaster position="top-right" />
      <BackgroundCanvas />

      {/* Floating Glass Top Navbar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#080811]/80 border-b border-white/10 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <a
            href="#hero"
            className="flex items-center gap-2 sm:gap-3 group focus:outline-none min-w-0"
            aria-label="kilicdev home"
          >
            <div className="relative shrink-0">
              <img
                src="/libs/kilic.png"
                alt="Kılıç Sarsılmaz"
                className="w-8 sm:w-10 h-8 sm:h-10 rounded-full object-cover border-2 border-cyan-500/40 group-hover:border-cyan-400 transition-all duration-300 group-hover:scale-105"
              />
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#080811] ${loadState === "online" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-100 group-hover:text-cyan-400 transition-colors truncate">
                  kilicdev
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 shrink-0">
                  ARCHITECT
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 block -mt-0.5 truncate hidden sm:block">
                root@{profile?.username || "kilicdev"}:~/profile
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-6 font-mono text-xs text-slate-400 uppercase tracking-wider">
            <a href="#hero" className="hover:text-cyan-300 transition-colors">
              Overview
            </a>
            <a href="#commits" className="hover:text-cyan-300 transition-colors">
              Commits
            </a>
            <a href="#techstack" className="hover:text-cyan-300 transition-colors">
              Tech Matrix
            </a>
            <a href="#readme" className="hover:text-cyan-300 transition-colors">
              README Visual
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300 transition-all text-xs font-mono"
              aria-label="Open command palette"
            >
              <FiCommand className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs">⌘K</span>
            </button>

            <a
              href={`https://github.com/${profile?.username || "kilicdev"}`}
              target="_blank"
              rel="noreferrer"
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono uppercase tracking-wider transition-all ${
                loadState === "online"
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/40 border-rose-500/30 text-rose-300"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current animate-ping" />
              <span>{loadState === "online" ? "Live Sync" : "Unavailable"}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pt-5 sm:pt-8 pb-16 sm:pb-24 space-y-10 sm:space-y-16 max-w-full overflow-hidden">
        {/* HERO SECTION */}
        <section id="hero" className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch pt-2 sm:pt-4">
          {/* Left Column: Architect Spotlight & Terminal */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-5 sm:space-y-6 min-w-0 max-w-full">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-mono tracking-wide max-w-full">
                <FiRadio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                <span className="truncate">Software Architect & Senior Full Stack Engineer</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-100 break-words">
                Crafting High-Performance Systems &{" "}
                <span className="text-gradient-cyan">Scalable Telemetry</span>
              </h1>

              <p className="text-xs sm:text-base text-slate-300 max-w-2xl leading-relaxed font-sans font-normal">
                {profile?.bio || "Software Architect & Senior Full Stack Engineer"}. Designing robust backend architectures, distributed automation tools, and modern web platforms with pixel precision.
              </p>
            </div>

            {/* Terminal Emulator */}
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl min-w-0 max-w-full">
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#0d0e1b] border-b border-white/10 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="ml-1.5 font-mono text-[11px] sm:text-xs text-slate-400">
                    bash — 80x24
                  </span>
                </div>

                <div className="flex items-center gap-1 font-mono text-[10px] sm:text-[11px]">
                  {["whoami", "system", "stack"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setTerminalTab(tab)}
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md transition-colors ${
                        terminalTab === tab
                          ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      ${tab}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 sm:p-5 font-mono text-[11px] sm:text-sm space-y-1.5 sm:space-y-2 bg-[#090a14]/90 text-slate-300 overflow-x-auto max-w-full break-words whitespace-pre-wrap">
                {terminalTab === "whoami" && (
                  <>
                    <div className="text-cyan-400 font-semibold">$ github --inspect {profile?.username || "kilicdev"}</div>
                    <div className="text-slate-300">
                      Name: <span className="text-emerald-400 font-bold">{profile?.name || "Kılıç Sarsılmaz"}</span>
                    </div>
                    <div className="text-slate-300">
                      Role: <span className="text-purple-400">Software Architect & Full Stack Lead</span>
                    </div>
                    <div className="text-slate-400">
                      Location: Remote / Worldwide | Status: Active Engineering
                    </div>
                  </>
                )}

                {terminalTab === "system" && (
                  <>
                    <div className="text-cyan-400 font-semibold">$ systemctl status kilicdev-telemetry</div>
                    <div className={loadState === "online" ? "text-emerald-400" : "text-rose-400"}>
                      ● kilicdev-telemetry.service - {loadState === "online" ? "Active (running)" : "Offline (Data Unavailable)"}
                    </div>
                    <div className="text-slate-400">
                      Refreshed At: {formatRefresh(profile?.refreshedAt)}
                    </div>
                    <div className="text-slate-400">
                      Total Index Commits: {profile?.commitCount || 0} | Total Repositories: {profile?.totalRepos || profile?.repositories?.length || 0}
                    </div>
                  </>
                )}

                {terminalTab === "stack" && (
                  <>
                    <div className="text-cyan-400 font-semibold">$ cat stack.json</div>
                    <div className="text-slate-300 break-words">
                      {"{"} "core": ["React 18", "Node.js", "TypeScript", "Tailwind CSS"], "architecture": ["Microservices", "REST/GraphQL", "SQLite", "Docker", "CI/CD"] {"}"}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1 w-full sm:w-auto">
              <a
                href="#commits"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs sm:text-sm tracking-wide shadow-[0_0_25px_rgba(6,182,212,0.25)] transition-all flex items-center justify-center gap-2"
              >
                <FiGitCommit className="w-4 h-4" />
                Explore Telemetry
              </a>

              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl glass-card text-slate-200 hover:text-cyan-300 hover:border-cyan-500/40 text-xs sm:text-sm font-mono flex items-center justify-center gap-2 transition-all"
              >
                <FiCommand className="w-4 h-4 text-cyan-400" />
                Command Palette (⌘K)
              </button>

              <a
                href={`https://github.com/${profile?.username || "kilicdev"}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-3 rounded-xl glass-card text-slate-300 hover:text-white hover:border-slate-500 text-xs sm:text-sm font-mono flex items-center justify-center gap-2 transition-all"
              >
                <FiGithub className="w-4 h-4" />
                GitHub Profile
              </a>
            </div>
          </div>

          {/* Right Column: Holographic Profile Card */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-w-0 max-w-full">
            <div className="glass-card p-4 sm:p-6 rounded-3xl border border-white/10 flex flex-col items-center text-center relative overflow-hidden h-full justify-between space-y-4 sm:space-y-5 shadow-2xl min-w-0 max-w-full">
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-cyan-500/20 via-purple-500/10 to-transparent pointer-events-none" />

              <div className="relative mt-2">
                <div className="w-24 sm:w-32 h-24 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-cyan-500 via-purple-500 to-emerald-400 animate-pulse-halo shadow-lg">
                  <img
                    src="/libs/kilic.png"
                    alt="Kılıç Sarsılmaz Profile"
                    className="w-full h-full object-cover rounded-full border-4 border-[#080811]"
                  />
                </div>
                <span className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-full border text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 shadow-lg ${
                  loadState === "online" ? "bg-emerald-950 border-emerald-500/50 text-emerald-400" : "bg-rose-950 border-rose-500/50 text-rose-400"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${loadState === "online" ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
                  {loadState === "online" ? "ONLINE" : "OFFLINE"}
                </span>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <h3 className="text-lg sm:text-2xl font-extrabold text-slate-100">{profile?.name || "Kılıç Sarsılmaz"}</h3>
                <p className="text-xs font-mono text-cyan-400">@{profile?.username || "kilicdev"}</p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans px-1 sm:px-4">
                  Architecting resilient web infrastructure, open-source utilities, and developer telemetry.
                </p>
              </div>

              {/* Profile Card Micro-Stats Grid with Repos & Public Repos */}
              <div className="w-full grid grid-cols-4 gap-1.5 sm:gap-2 py-2.5 sm:py-3 border-y border-slate-800/80 font-mono text-center">
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase">Commits</span>
                  <strong className="text-xs sm:text-sm text-cyan-300 font-extrabold">{profile?.commitCount || 0}</strong>
                </div>
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase">Repos</span>
                  <strong className="text-xs sm:text-sm text-purple-300 font-extrabold">{profile?.totalRepos || profile?.repositories?.length || 0}</strong>
                </div>
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase">Public</span>
                  <strong className="text-xs sm:text-sm text-pink-300 font-extrabold">{profile?.publicRepos || 0}</strong>
                </div>
                <div className="p-1.5 sm:p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                  <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase">Orgs</span>
                  <strong className="text-xs sm:text-sm text-emerald-300 font-extrabold">{profile?.organizationCount || profile?.organizations?.length || 0}</strong>
                </div>
              </div>

              <div className="w-full flex items-center justify-between text-[11px] sm:text-xs font-mono px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <FiGlobe className="w-3.5 h-3.5 text-cyan-400" /> Domain
                </span>
                <span className="text-cyan-300 font-semibold">kilicdev.com</span>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => copyToClipboard("https://github.com/kilicdev", "GitHub Link")}
                  className="w-full py-2 sm:py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-cyan-300 transition-colors text-xs font-mono flex items-center justify-center gap-1.5"
                  title="Copy GitHub Link"
                >
                  <FiCopy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>

                <a
                  href={`https://github.com/${profile?.username || "kilicdev"}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2 sm:py-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 transition-colors text-xs font-mono flex items-center justify-center gap-1.5"
                >
                  <FiGithub className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* OFFLINE / UNAVAILABLE STATE IF PROFILE FAILS */}
        {loadState === "offline" || !profile ? (
          <section className="glass-card p-8 sm:p-12 rounded-3xl border border-rose-500/30 bg-rose-950/20 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-950 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
              <FiAlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100">Telemetry Data Unavailable</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Could not load profile telemetry data (`/libs/profile-data.json`). The telemetry pipeline may be syncing or unreachable.
            </p>
            <button
              onClick={fetchProfileData}
              className="px-6 py-2.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-500/40 text-rose-200 text-xs font-mono inline-flex items-center gap-2 transition-all shadow-lg"
            >
              <FiRefreshCw className="w-4 h-4 animate-spin" /> Retry Connection
            </button>
          </section>
        ) : (
          /* ACTIVITY STREAM PANEL */
          <section id="commits" className="space-y-6">
            <div className="glass-card p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4 sm:space-y-6 max-w-full overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase flex items-center gap-2">
                    <FiTerminal className="w-3.5 h-3.5" /> Real-time Activity Telemetry
                  </span>
                  <h2 className="text-lg sm:text-3xl font-extrabold text-slate-100 mt-1">
                    GitHub Activity Stream
                  </h2>
                </div>

                {/* Tab Switcher: Hidden on mobile (fixed commits view), Desktop shows full tabs */}
                <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs">
                  <button
                    onClick={() => setActiveTab("commits")}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "commits"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-lg"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FiGitCommit className="w-3.5 h-3.5" /> Commits ({profile.commits?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("repos")}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "repos"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-lg"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FiCode className="w-3.5 h-3.5" /> Repositories ({profile.repositories?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab("orgs")}
                    className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                      activeTab === "orgs"
                        ? "bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-lg"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <FiUsers className="w-3.5 h-3.5" /> Organizations ({profile.organizations?.length || 0})
                  </button>
                </div>
              </div>

              {/* LISTING CONTENT: Standardized Layout for Commits, Repositories, and Organizations */}

              {/* COMMITS (Default & Static Mobile View) */}
              {(activeTab === "commits" || window.innerWidth < 640) && (
                <div className="space-y-3 pt-2">
                  {profile.commits?.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 font-mono text-xs">
                      No commit telemetry items available.
                    </div>
                  ) : (
                    profile.commits?.slice(0, 5).map((commit) => {
                      const commitMsg = sanitizeCommitMessage(commit.message, 50);
                      return (
                        <div
                          key={commit.sha}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/80 transition-all duration-200 gap-2.5 sm:gap-3 min-w-0 max-w-full overflow-hidden"
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="p-1.5 sm:p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 mt-0.5 shrink-0">
                              <FiGitCommit className="w-4 h-4" />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                <span className="font-semibold text-slate-100 text-xs sm:text-sm group-hover:text-cyan-300 transition-colors break-words line-clamp-2 sm:line-clamp-1">
                                  {commitMsg}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-slate-400 flex-wrap">
                                <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-mono text-[10px] sm:text-xs truncate max-w-[140px] sm:max-w-[200px]">
                                  {commit.repository}
                                </span>
                                <span>{formatRelativeTime(commit.date)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto justify-end">
                            <button
                              onClick={() => copyToClipboard(commit.sha, "SHA")}
                              className="px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] sm:text-xs font-mono flex items-center gap-1.5 transition-colors"
                              title="Copy Full SHA"
                            >
                              <FiCopy className="w-3.5 h-3.5" />
                              <span>{commit.shortSha}</span>
                            </button>

                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 sm:p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/60 transition-colors"
                              title="View on GitHub"
                            >
                              <FiExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* REPOSITORIES (Desktop Tab View - Standardized to match Commits layout) */}
              {activeTab === "repos" && (
                <div className="hidden sm:block space-y-3 pt-2">
                  {profile.repositories?.map((repo) => (
                    <div
                      key={repo.fullName || repo.name}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-purple-500/40 hover:bg-slate-900/80 transition-all duration-200 gap-2.5 sm:gap-3 min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400 mt-0.5 shrink-0">
                          <FiCode className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-semibold text-slate-100 text-xs sm:text-sm group-hover:text-purple-300 transition-colors truncate">
                              {repo.fullName || repo.name}
                            </span>
                            {repo.private && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                                PRIVATE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-slate-400 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-purple-400 border border-slate-700 font-mono text-[10px] sm:text-xs">
                              {repo.language || "TypeScript"}
                            </span>
                            <span>Updated {formatRelativeTime(repo.updatedAt)}</span>
                          </div>
                          {repo.description && (
                            <p className="text-xs text-slate-400 font-sans line-clamp-1">
                              {repo.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto justify-end">
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:bg-purple-900/60 transition-colors text-xs font-mono flex items-center gap-1.5"
                        >
                          <span>View Code</span>
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ORGANIZATIONS (Desktop Tab View - Standardized to match Commits layout) */}
              {activeTab === "orgs" && (
                <div className="hidden sm:block space-y-3 pt-2">
                  {profile.organizations?.map((org) => (
                    <div
                      key={org.login}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/80 transition-all duration-200 gap-2.5 sm:gap-3 min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 mt-0.5 shrink-0">
                          <FiUsers className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-semibold text-slate-100 text-xs sm:text-sm group-hover:text-emerald-300 transition-colors">
                              @{org.login}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono text-slate-400 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700 font-mono text-[10px] sm:text-xs">
                              {org.latestRepository || "Organization Profile"}
                            </span>
                            <span>{formatRelativeTime(org.lastUpdatedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60 w-full sm:w-auto justify-end">
                        <a
                          href={org.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/60 transition-colors text-xs font-mono flex items-center gap-1.5"
                        >
                          <span>Visit</span>
                          <FiExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* TECH STACK MATRIX SECTION */}
        <TechStack />

        {/* README VISUAL TELEMETRY SECTION */}
        <section id="readme" className="glass-card p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 space-y-5 sm:space-y-6 max-w-full overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4 sm:pb-5">
            <div>
              <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase flex items-center gap-2">
                <FiLayers className="w-3.5 h-3.5" /> Live SVG Visual Telemetry
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100 mt-1">
                GitHub README Stats Generator
              </h2>
            </div>
            <p className="text-xs font-mono text-slate-400 max-w-md">
              Automated Node.js engine executed via GitHub Actions workflow to generate vector dashboard visuals.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">
                Dual Surface Data Architecture
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-snug">
                One workflow updates both the README SVG and website telemetry JSON synchronously.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                The generator parses active commit history, organization profiles, and repository telemetry into vector SVG graphics displayed directly inside the GitHub profile README.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                >
                  <FiMaximize2 className="w-3.5 h-3.5" /> Inspect Visual Lightbox
                </button>
                <a
                  href="/libs/readme-stats.svg"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center justify-center gap-2 transition-colors"
                >
                  <FiExternalLink className="w-3.5 h-3.5" /> Open Direct SVG
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 max-w-full overflow-hidden">
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-950 p-1.5 sm:p-2 shadow-2xl transition-all duration-300 hover:border-cyan-400 hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] max-w-full"
              >
                <img
                  src="/libs/readme-stats.svg"
                  alt="Live GitHub Activity Dashboard SVG"
                  className="w-full h-auto rounded-lg object-contain transition-transform duration-500 group-hover:scale-[1.01]"
                />
                <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 text-cyan-200 font-mono text-xs sm:text-sm">
                  <FiMaximize2 className="w-4 sm:w-5 h-4 sm:h-5" /> Click to Expand Lightbox
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER - Back-to-top button completely removed */}
      <footer className="relative z-10 border-t border-white/10 bg-[#080811]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <img src="/libs/kilic.png" alt="kilicdev avatar" className="w-6 h-6 rounded-full border border-cyan-500/40" />
            <span>2026 Kılıç Sarsılmaz. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Telemetry Engine Online
            </span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        username={profile?.username || "kilicdev"}
      />

      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        src="/libs/readme-stats.svg"
        alt="GitHub README Telemetry SVG"
      />
    </div>
  );
};

export default HomePage;
