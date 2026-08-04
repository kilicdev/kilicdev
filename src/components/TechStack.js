import { FiServer, FiCpu, FiLayers, FiGlobe, FiShield } from "react-icons/fi";

const techCategories = [
  {
    title: "Full Stack & Microservices",
    icon: FiServer,
    tone: "cyan",
    description: "Distributed architectures, API design, high-concurrency event loops and microservice orchestration.",
    tags: ["React 18", "Node.js", "TypeScript", "Express", "RESTful APIs", "GraphQL", "WebSockets"],
  },
  {
    title: "Systems & SEO Engineering",
    icon: FiCpu,
    tone: "purple",
    description: "High-performance automated indexing CLI engines, SQLite history trackers, and concurency crawlers.",
    tags: ["SEO Indexer Engine", "IndexNow Protocol", "Google Indexing API v3", "SQLite", "CLI Tools", "Async Workers"],
  },
  {
    title: "Cloud & DevOps Operations",
    icon: FiGlobe,
    tone: "emerald",
    description: "Automated CI/CD pipelines, GitHub Actions workflows, containerized builds, and zero-downtime deploys.",
    tags: ["GitHub Actions", "Docker", "Nginx", "Linux Automation", "Vercel / Cloudflare", "pnpm / NPM"],
  },
  {
    title: "Architecture & Code Quality",
    icon: FiShield,
    tone: "rose",
    description: "Clean code design patterns, modular maintainability, accessibility standards, and SEO optimization.",
    tags: ["System Architecture", "Design Systems", "Web Performance (CWV)", "Tailwind CSS", "Semantic HTML5"],
  },
];

const toneStyles = {
  cyan: {
    border: "group-hover:border-cyan-500/40",
    badgeBg: "bg-cyan-500/10 text-cyan-300 border-cyan-500/30",
    iconBg: "bg-cyan-500/20 text-cyan-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]",
  },
  purple: {
    border: "group-hover:border-purple-500/40",
    badgeBg: "bg-purple-500/10 text-purple-300 border-purple-500/30",
    iconBg: "bg-purple-500/20 text-purple-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(139,92,246,0.15)]",
  },
  emerald: {
    border: "group-hover:border-emerald-500/40",
    badgeBg: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]",
  },
  rose: {
    border: "group-hover:border-rose-500/40",
    badgeBg: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    iconBg: "bg-rose-500/20 text-rose-400",
    glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.15)]",
  },
};

const TechStack = () => {
  return (
    <section id="techstack" className="space-y-4 sm:space-y-6 pt-4 sm:pt-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-2">
        <div>
          <span className="text-xs font-mono text-cyan-400 tracking-wider uppercase flex items-center gap-2">
            <FiLayers className="w-3.5 h-3.5" /> Core Competencies
          </span>
          <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100 mt-1">
            Engineering & Architecture Matrix
          </h2>
        </div>
        <p className="text-xs font-mono text-slate-400 max-w-md">
          Specializing in scalable full-stack web platforms, high-performance CLI utilities, and robust CI/CD telemetry.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {techCategories.map((category) => {
          const Icon = category.icon;
          const style = toneStyles[category.tone];
          return (
            <article
              key={category.title}
              className={`group glass-card p-4 sm:p-6 rounded-2xl border transition-all duration-300 ${style.border} ${style.glow} min-w-0 max-w-full overflow-hidden`}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-xl ${style.iconBg} transition-transform duration-300 group-hover:scale-110 shrink-0`}>
                  <Icon className="w-5 sm:w-6 h-5 sm:h-6" />
                </div>
                <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
                    {category.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-5 flex flex-wrap gap-1.5">
                {category.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-mono rounded-lg border transition-colors ${style.badgeBg}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default TechStack;
