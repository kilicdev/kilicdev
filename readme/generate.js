const fs = require("node:fs");
const path = require("node:path");
const config = require("./config");

const GITHUB_API = "https://api.github.com";
const cliToken = process.argv.slice(2).find(arg => arg && !arg.endsWith(".js") && !arg.startsWith("-")) || "";
const PERSONAL_TOKEN = (cliToken || process.env.GITHUB_PROFILE_TOKEN || process.env.PROFILE_TOKEN || process.env.GITHUB_PAT || process.env.GH_PAT || process.env.PAT || "").trim();
const ACCESS_TOKEN = PERSONAL_TOKEN || process.env.GITHUB_TOKEN || "";
const PRIVATE_DATA_ENABLED = Boolean(PERSONAL_TOKEN);
const MAX_REQUEST_RETRIES = 2;

console.log("Generator initialized:");
console.log("- PRIVATE_DATA_ENABLED:", PRIVATE_DATA_ENABLED);
console.log("- Token Status:", PERSONAL_TOKEN ? "AUTHENTICATED (Private Access Enabled)" : "UNAUTHENTICATED (Public Only)");

const COLORS = { background: "#08060b", panel: "#110b14", panelAlt: "#160d1a", line: "#3a1d3f", text: "#fff4f6", muted: "#b58c9d", coral: "#ff687b", pink: "#ff9dad", purple: "#b57aff", green: "#8ce3b0" };

const escapeXml = (v = "") => String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const shorten = (v = "", limit = 36) => { const t = String(v).replace(/\s+/g, " ").trim().replace(/\.\.\.+$/g, "").trim(); return t.length > limit ? t.slice(0, limit - 3).trim() + "..." : t; };
const formatCount = (v) => { const c = Number(v) || 0; if (c >= 1e6) return (c / 1e6).toFixed(1) + "M"; if (c >= 1e3) return (c / 1e3).toFixed(1) + "K"; return String(c); };
const formatRelativeTime = (d, now = Date.now()) => { if (d == null || d === "") return "—"; const ts = new Date(d).getTime(); if (Number.isNaN(ts)) return "—"; const e = Math.max(0, now - ts); const m = Math.floor(e / 6e4); const h = Math.floor(m / 60); const dy = Math.floor(h / 24); if (m < 1) return "just now"; if (h < 1) return m + "m ago"; if (dy < 1) return h + "h ago"; if (dy < 30) return dy + "d ago"; return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(d)); };
const languageColor = (l) => ({ JavaScript: "#f7df1e", TypeScript: "#3178c6", Python: "#8bc34a", Java: "#f89820", PHP: "#777bb4", Swift: "#ff8a65", Kotlin: "#a97bff", HTML: "#e44d26", CSS: "#563d7c" }[l] || COLORS.pink);
const languageLabel = (l) => ({ JavaScript: "JS", TypeScript: "TS", Python: "PY", Java: "JAVA", PHP: "PHP", Swift: "SWIFT", Kotlin: "KT", HTML: "HTML", CSS: "CSS" }[l] || shorten(l, 5));
const cleanUrl = (v) => typeof v === "string" && /^https?:\/\//.test(v) ? v : null;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const sanitizeCommitMessage = (value = "", limit = 50) => {
    const text = String(value || "").split("\n")[0].trim().replace(/\.\.\.+$/g, "").trim();
    if (!text) return "Commit updates";
    if (text.length > limit) return text.slice(0, limit - 3).trim() + "...";
    return text;
};

const serializeRepository = (r = {}) => ({ name: r.name || "unknown", fullName: r.full_name || r.fullName || r.name || "unknown", description: r.description || "", language: r.language || r.primaryLanguage?.name || "", stars: r.stargazers_count || r.stargazerCount || 0, forks: r.forks_count || r.forkCount || 0, watchers: r.watchers_count || 0, openIssues: r.open_issues_count || 0, private: r.private === true || r.isPrivate === true, updatedAt: r.updated_at || r.updatedAt || r.pushed_at || r.pushedAt || null, pushedAt: r.pushed_at || r.pushedAt || null, url: cleanUrl(r.html_url || r.url) });
const serializeOrganization = (o = {}) => ({ login: o.login || o.name || "unknown", name: o.name || o.login || "unknown", avatarUrl: cleanUrl(o.avatar_url || o.avatarUrl) || ("https://github.com/" + (o.login || "github") + ".png"), url: cleanUrl(o.html_url || o.url) || ("https://github.com/" + (o.login || "")), lastUpdatedAt: o.lastUpdatedAt || null, latestRepository: o.latestRepository || null });
const serializeCommit = (c = {}) => ({ sha: c.sha || "", shortSha: c.sha ? c.sha.slice(0, 7) : "", message: sanitizeCommitMessage(c.message, 50), repository: c.repository || "unknown/repository", url: cleanUrl(c.url), date: c.date || null });

const buildProfileData = (profile) => ({
    username: profile.username, name: profile.name, bio: profile.bio,
    followers: profile.followers, following: profile.following,
    totalRepos: profile.totalRepos || profile.repositories.length,
    publicRepos: profile.publicRepos,
    organizationCount: profile.organizations.length || profile.organizationCount,
    commitCount: profile.commits.total || profile.commits.items.length,
    publicCommitCount: profile.commits.publicTotal || 0,
    privateCommitCount: profile.commits.privateTotal || 0,
    refreshedAt: profile.refreshedAt,
    repositories: profile.repositories.map(serializeRepository),
    organizations: profile.organizations.slice(0, config.organizationLimit).map(serializeOrganization),
    commits: profile.commits.items.slice(0, config.commitLimit).map(serializeCommit),
});

// ── HTTP helpers ────────────────────────────────────────────────────────────

class GitHubApiError extends Error {
    constructor(status, endpoint, message, headers) { super("GitHub API " + status + " for " + endpoint + ": " + message); this.name = "GitHubApiError"; this.status = status; this.endpoint = endpoint; this.apiMessage = message; this.headers = headers; }
}
const isRateLimitError = (s, m, h) => s === 429 || (s === 403 && (h.get("x-ratelimit-remaining") === "0" || /rate limit|secondary rate|abuse detection|too many requests/i.test(m)));
const isRateLimitedApiError = (e) => e && isRateLimitError(e.status, e.apiMessage || e.message || "", e.headers || new Headers());

const request = async (endpoint, options = {}) => {
    const { authenticated = true } = options;
    const headers = { Accept: "application/vnd.github+json", "User-Agent": "kilicdev-readme-generator", "X-GitHub-Api-Version": "2022-11-28" };
    if (ACCESS_TOKEN && authenticated) headers.Authorization = "Bearer " + ACCESS_TOKEN;
    for (let attempt = 0; attempt <= MAX_REQUEST_RETRIES; attempt++) {
        const res = await fetch(GITHUB_API + endpoint, { headers });
        const body = await res.text();
        let payload = {}; try { payload = body ? JSON.parse(body) : {}; } catch { payload = { message: body || res.statusText }; }
        if (res.ok) return payload;
        const msg = payload.message || res.statusText || "Unknown error";
        if (!isRateLimitError(res.status, msg, res.headers) || attempt === MAX_REQUEST_RETRIES) throw new GitHubApiError(res.status, endpoint, msg, res.headers);
        const ra = Number(res.headers.get("retry-after")); const delay = (Number.isFinite(ra) && ra > 0) ? ra * 1000 : Math.max(60000, 1000 * 2 ** attempt);
        if (delay > 60000) throw new GitHubApiError(res.status, endpoint, msg, res.headers);
        console.warn("Rate limit on " + endpoint + "; retry in " + Math.ceil(delay / 1000) + "s"); await sleep(delay);
    }
    throw new Error("Request failed for " + endpoint);
};

const publicRequest = async (endpoint) => {
    try { return await request(endpoint); } catch (error) {
        if (error.status === 401 || (error.status === 403 && !isRateLimitedApiError(error))) return request(endpoint, { authenticated: false });
        throw error;
    }
};

// ── GraphQL viewer query ────────────────────────────────────────────────────

const fetchGraphQLViewer = async () => {
    if (!ACCESS_TOKEN) return null;
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const query = `query($from: DateTime!) {
        viewer {
            login name bio
            followers { totalCount }
            following { totalCount }
            contributionsCollection(from: $from) { totalCommitContributions restrictedContributionsCount }
            repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], orderBy: {field: UPDATED_AT, direction: DESC}) {
                nodes {
                    name nameWithOwner isPrivate isFork description url updatedAt pushedAt
                    primaryLanguage { name } stargazerCount forkCount
                    owner { __typename login avatarUrl }
                }
            }
            organizations(first: 50) {
                nodes { login name avatarUrl }
            }
        }
        privateSearch: search(query: "is:private", type: REPOSITORY, first: 100) {
            nodes {
                ... on Repository {
                    name nameWithOwner isPrivate isFork description url updatedAt pushedAt
                    primaryLanguage { name } stargazerCount forkCount
                    owner { __typename login avatarUrl }
                }
            }
        }
    }`;
    try {
        const res = await fetch("https://api.github.com/graphql", { method: "POST", headers: { Authorization: "Bearer " + ACCESS_TOKEN, "Content-Type": "application/json", "User-Agent": "kilicdev-readme-generator" }, body: JSON.stringify({ query, variables: { from: oneYearAgo } }) });
        const json = await res.json();
        if (json.data?.viewer) {
            const v = json.data.viewer;
            const repoNodes = v.repositories?.nodes || [];
            const privNodes = (json.data?.privateSearch?.nodes || []).filter(Boolean);
            const nodeMap = new Map();
            for (const n of [...repoNodes, ...privNodes]) {
                if (n?.nameWithOwner) nodeMap.set(n.nameWithOwner.toLowerCase(), n);
            }
            v._allNodes = [...nodeMap.values()];
            console.log(`[GraphQL] Repos found: ${v._allNodes.length} (${v._allNodes.filter(r => r.isPrivate).length} private)`);
            return v;
        }
        if (json.errors) console.warn("[GraphQL] Errors:", JSON.stringify(json.errors));
    } catch (err) { console.warn("[GraphQL] " + err.message); }
    return null;
};

// ── Data fetchers ───────────────────────────────────────────────────────────

const fetchCommitsFromRepos = async (username, repos = []) => {
    if (!PRIVATE_DATA_ENABLED) return []; // Skip per-repo REST calls when unauthenticated to prevent hitting 60 req/h rate limits
    const map = new Map();
    const sorted = [...repos].sort((a, b) => {
        const ta = new Date(a.updated_at || a.pushedAt || 0).getTime();
        const tb = new Date(b.updated_at || b.pushedAt || 0).getTime();
        return tb - ta;
    }).slice(0, 20);

    await Promise.all(sorted.map(async (repo) => {
        const fn = repo.full_name || repo.nameWithOwner || "";
        if (!fn || !fn.includes("/")) return;
        try {
            let commits = await request("/repos/" + fn + "/commits?author=" + encodeURIComponent(username) + "&per_page=10").catch(() => []);
            if (!Array.isArray(commits) || commits.length === 0) {
                commits = await request("/repos/" + fn + "/commits?per_page=10").catch(() => []);
            }
            if (Array.isArray(commits)) {
                for (const c of commits) {
                    if (c?.sha && !map.has(c.sha)) map.set(c.sha, { sha: c.sha, message: sanitizeCommitMessage(c.commit?.message, 50), repository: fn, url: c.html_url || ("https://github.com/" + fn + "/commit/" + c.sha), date: c.commit?.author?.date || c.commit?.committer?.date });
                }
            }
        } catch {}
    }));
    return [...map.values()];
};

const getRecentCommits = async (username, repos = [], viewer = null) => {
    const unique = new Map();
    let pubCount = 0, privCount = 0;
    if (viewer?.contributionsCollection) { pubCount = Number(viewer.contributionsCollection.totalCommitContributions) || 0; privCount = Number(viewer.contributionsCollection.restrictedContributionsCount) || 0; }

    try { const rc = await fetchCommitsFromRepos(username, repos); for (const c of rc) if (c.sha) unique.set(c.sha, c); } catch {}
    try { const q = new URLSearchParams({ q: "author:" + username, sort: "author-date", order: "desc", per_page: "50" }); const sr = await request("/search/commits?" + q).catch(() => null); if (sr?.items) for (const i of sr.items) { const c = { sha: i.sha, message: sanitizeCommitMessage(i.commit?.message, 50), repository: i.repository?.full_name || "unknown/repository", url: i.html_url, date: i.commit?.author?.date || i.commit?.committer?.date }; if (c.sha && !unique.has(c.sha)) unique.set(c.sha, c); } } catch {}

    const items = [...unique.values()].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()).slice(0, config.commitLimit);
    const total = Math.max(pubCount + privCount, unique.size);
    return { total, publicTotal: pubCount, privateTotal: privCount, items };
};

const getRepositories = async (username, viewer = null) => {
    const map = new Map();
    const addNode = (n) => {
        if (!n?.nameWithOwner) return;
        const k = n.nameWithOwner.toLowerCase();
        const isOrg = n.owner?.__typename === "Organization";
        map.set(k, {
            name: n.name,
            full_name: n.nameWithOwner,
            nameWithOwner: n.nameWithOwner,
            description: n.description || "",
            language: n.primaryLanguage?.name || "",
            stargazers_count: n.stargazerCount || 0,
            forks_count: n.forkCount || 0,
            private: n.isPrivate === true,
            fork: n.isFork === true,
            updated_at: n.updatedAt || n.pushedAt || null,
            pushed_at: n.pushedAt || null,
            html_url: n.url,
            owner: n.owner ? { login: n.owner.login, avatar_url: n.owner.avatarUrl, type: isOrg ? "Organization" : "User" } : null
        });
    };

    if (viewer?._allNodes) for (const n of viewer._allNodes) addNode(n);

    if (PRIVATE_DATA_ENABLED) {
        try {
            const rs = await request("/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&direction=desc&per_page=100");
            if (Array.isArray(rs)) for (const r of rs) { const k = (r.full_name || "").toLowerCase(); if (r && k && !map.has(k)) map.set(k, r); }
        } catch {}
        const orgLogins = new Set();
        for (const r of map.values()) if (r.owner?.type === "Organization" && r.owner?.login) orgLogins.add(r.owner.login);
        try { const os = await request("/user/orgs?per_page=100"); if (Array.isArray(os)) for (const o of os) if (o?.login) orgLogins.add(o.login); } catch {}
        for (const orgLogin of orgLogins) {
            try {
                const orgRepos = await request("/orgs/" + encodeURIComponent(orgLogin) + "/repos?type=all&sort=updated&direction=desc&per_page=100");
                if (Array.isArray(orgRepos)) for (const r of orgRepos) { const k = (r.full_name || "").toLowerCase(); if (r && k && !map.has(k)) map.set(k, r); }
            } catch {}
        }
    } else {
        try { const pr = await publicRequest("/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated&direction=desc&per_page=100"); if (Array.isArray(pr)) for (const r of pr) { const k = (r.full_name || "").toLowerCase(); if (r && k && !map.has(k)) map.set(k, r); } } catch {}
    }

    const all = [...map.values()];
    const privates = all.filter(r => r.private).map(r => r.full_name || r.nameWithOwner);
    console.log(`[Repos] Total Repos: ${all.length} (${all.filter(r => !r.private).length} public, ${privates.length} private)`);
    return all;
};

const getOrganizations = async (username, repos = []) => {
    const map = new Map();
    if (PRIVATE_DATA_ENABLED) { try { const os = await request("/user/orgs?per_page=100"); if (Array.isArray(os)) for (const o of os) if (o?.login) map.set(o.login.toLowerCase(), o); } catch {} }
    try { const os = await publicRequest("/users/" + encodeURIComponent(username) + "/orgs?per_page=100"); if (Array.isArray(os)) for (const o of os) if (o?.login && !map.has(o.login.toLowerCase())) map.set(o.login.toLowerCase(), o); } catch {}
    for (const r of repos) { const ol = r?.owner?.login; if (ol && r?.owner?.type === "Organization" && !map.has(ol.toLowerCase())) map.set(ol.toLowerCase(), { login: ol, avatar_url: r.owner.avatar_url || ("https://github.com/" + ol + ".png"), html_url: "https://github.com/" + ol }); }
    const enriched = await Promise.all([...map.values()].map(async (org) => { const l = org.login || ""; try { const rs = await request("/orgs/" + encodeURIComponent(l) + "/repos?type=all&sort=updated&direction=desc&per_page=1").catch(() => publicRequest("/orgs/" + encodeURIComponent(l) + "/repos?type=public&sort=updated&direction=desc&per_page=1").catch(() => [])); const lt = Array.isArray(rs) ? rs[0] : null; return { ...org, lastUpdatedAt: lt?.updated_at || lt?.pushed_at || null, latestRepository: lt?.name || null }; } catch { return { ...org, lastUpdatedAt: null, latestRepository: null }; } }));
    return enriched.sort((a, b) => (b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0) - (a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0));
};

const collectProfile = async (username) => {
    const viewer = await fetchGraphQLViewer().catch(() => null);
    const userProfile = await publicRequest("/users/" + encodeURIComponent(username)).catch(() => ({}));
    const repos = await getRepositories(username, viewer).catch(() => []);
    const orgs = await getOrganizations(username, repos).catch(() => []);
    const commits = await getRecentCommits(username, repos, viewer).catch(() => ({ total: 0, publicTotal: 0, privateTotal: 0, items: [] }));

    // Sort repositories for UI display: Include personal repos & org repos sorted strictly by latest activity date
    const displayRepos = repos.filter(r => r && !r.fork).sort((a, b) => {
        const ta = new Date(a.updated_at || a.pushed_at || 0).getTime();
        const tb = new Date(b.updated_at || b.pushed_at || 0).getTime();
        return tb - ta;
    }).slice(0, config.repositoryLimit);

    console.log(`\n=== SUMMARY === Repos:${repos.length} Orgs:${orgs.length} Commits:${commits.total} (pub=${commits.publicTotal}, priv=${commits.privateTotal})`);
    return {
        username, name: viewer?.name || userProfile.name || username,
        bio: viewer?.bio || userProfile.bio || "Software Architect & Senior Full Stack Engineer",
        followers: viewer?.followers?.totalCount || userProfile.followers || 0,
        following: viewer?.following?.totalCount || userProfile.following || 0,
        totalRepos: repos.length,
        publicRepos: userProfile.public_repos ?? repos.filter(r => !r.private).length,
        repositories: displayRepos,
        organizations: orgs, organizationCount: orgs.length, commits, refreshedAt: new Date().toISOString(),
    };
};

// ── SVG rendering ───────────────────────────────────────────────────────────

const text = (x, y, value, options = {}) => {
    const { fill = COLORS.text, size = 14, weight = 400, anchor = "start", letterSpacing = 0, family = "JetBrains Mono, SFMono-Regular, Menlo, monospace", clipPath = null } = options;
    return "<text x=\"" + x + "\" y=\"" + y + "\" fill=\"" + fill + "\" font-family=\"" + family + "\" font-size=\"" + size + "px\" font-weight=\"" + weight + "\" text-anchor=\"" + anchor + "\" letter-spacing=\"" + letterSpacing + "em\"" + (clipPath ? " clip-path=\"url(#" + clipPath + ")\"" : "") + ">" + escapeXml(value) + "</text>";
};
const panel = (x, y, w, h, title) => "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + w + "\" height=\"" + h + "\" rx=\"20\" fill=\"" + COLORS.panel + "\" stroke=\"" + COLORS.line + "\"/>" + text(x + 24, y + 34, title, { fill: COLORS.pink, size: 12, weight: 700, letterSpacing: 0.12 });
const renderMetric = (x, label, value, accent) => ["<rect x=\"" + x + "\" y=\"216\" width=\"272\" height=\"84\" rx=\"16\" fill=\"" + COLORS.panelAlt + "\" stroke=\"" + COLORS.line + "\"/>", "<rect x=\"" + x + "\" y=\"216\" width=\"4\" height=\"84\" rx=\"2\" fill=\"" + accent + "\"/>", text(x + 22, 243, label, { fill: COLORS.muted, size: 11, weight: 700, letterSpacing: 0.1 }), text(x + 22, 282, value, { fill: COLORS.text, size: 29, weight: 700 })].join("");
const numberBadge = (cx, bl, i, accent) => "<circle cx=\"" + cx + "\" cy=\"" + (bl - 4) + "\" r=\"10\" fill=\"#28152d\" stroke=\"" + accent + "\" stroke-opacity=\"0.7\"/>" + text(cx, bl, String(i + 1).padStart(2, "0"), { fill: accent, size: 9, weight: 700, anchor: "middle" });

const renderRepositories = (repositories, now) => Array.from({ length: config.repositoryLimit }, (_, i) => repositories[i] || null).map((r, i) => { const y = 620 + i * 24; const nm = r?.full_name || r?.nameWithOwner || r?.name || "—"; const lg = r?.language || ""; const up = r?.updated_at ? formatRelativeTime(r.updated_at, now) : "—"; const rf = i % 2 ? "#130b17" : "#100a13"; return ["<rect x=\"850\" y=\"" + (y - 16) + "\" width=\"334\" height=\"20\" rx=\"7\" fill=\"" + rf + "\"/>", numberBadge(854, y, i, COLORS.purple), text(878, y, shorten(nm, 26), { fill: r ? COLORS.text : COLORS.muted, size: 10, weight: 700, clipPath: "repoNameClip" }), lg ? "<circle cx=\"1084\" cy=\"" + (y - 1) + "\" r=\"3\" fill=\"" + languageColor(lg) + "\"/>" : "", text(1094, y, lg ? languageLabel(lg) : "—", { fill: COLORS.muted, size: 9, clipPath: "repoLanguageClip" }), text(1182, y, up, { fill: r ? COLORS.pink : COLORS.muted, size: 9, anchor: "end", clipPath: "repoDateClip" })].join(""); }).join("");

const renderOrganizations = (organizations, now) => Array.from({ length: config.organizationLimit }, (_, i) => organizations[i] || null).map((o, i) => { const y = 405 + i * 24; const nm = o?.login || o?.name || "—"; const up = o?.lastUpdatedAt ? formatRelativeTime(o.lastUpdatedAt, now) : "—"; return [numberBadge(854, y, i, COLORS.purple), text(878, y, shorten(nm, 20), { fill: o ? COLORS.text : COLORS.muted, size: 12, weight: 700, clipPath: "organizationNameClip" }), text(1182, y, up, { fill: COLORS.muted, size: 9, weight: 700, anchor: "end", clipPath: "organizationDateClip" })].join(""); }).join("");

const renderCommits = (commits, now) => Array.from({ length: config.commitLimit }, (_, i) => commits[i] || null).map((c, i) => { const y = 420 + i * 60; const repo = c?.repository || "—"; const msg = c?.message ? sanitizeCommitMessage(c.message, 50) : "NO COMMIT DATA"; const up = c?.date ? formatRelativeTime(c.date, now) : "—"; const rf = i % 2 ? "#130b17" : "#100a13"; return ["<rect x=\"96\" y=\"" + (y - 25) + "\" width=\"680\" height=\"46\" rx=\"11\" fill=\"" + rf + "\"/>", text(114, y + 2, "↳", { fill: COLORS.green, size: 15, weight: 700 }), text(138, y + 2, msg, { fill: c ? COLORS.text : COLORS.muted, size: 11, weight: 700, clipPath: "commitMessageClip" }), text(560, y + 2, shorten(repo, 22), { fill: COLORS.muted, size: 10, clipPath: "commitRepoClip" }), text(776, y + 2, up, { fill: c ? COLORS.pink : COLORS.muted, size: 10, anchor: "end" })].join(""); }).join("");

const buildSvg = (profile) => {
    const now = Date.now();
    const refreshed = new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(profile.refreshedAt));
    const totalCommits = profile.commits.total || profile.commits.items.length;
    return [
        "<svg width=\"1280\" height=\"860\" viewBox=\"0 0 1280 860\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-labelledby=\"title desc\">",
        "  <title id=\"title\">" + escapeXml(profile.name) + " GitHub activity dashboard</title>",
        "  <desc id=\"desc\">A live dashboard showing repositories, organizations, followers and recent commits for " + escapeXml(profile.username) + ".</desc>",
        "  <defs>",
        "    <linearGradient id=\"background\" x1=\"50\" y1=\"20\" x2=\"1230\" y2=\"800\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#190910\"/><stop offset=\"0.5\" stop-color=\"#09060d\"/><stop offset=\"1\" stop-color=\"#10091b\"/></linearGradient>",
        "    <linearGradient id=\"border\" x1=\"60\" y1=\"40\" x2=\"1220\" y2=\"780\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#ff7182\" stop-opacity=\"0.6\"/><stop offset=\"0.55\" stop-color=\"#8d4cff\" stop-opacity=\"0.22\"/><stop offset=\"1\" stop-color=\"#ff7182\" stop-opacity=\"0.15\"/></linearGradient>",
        "    <radialGradient id=\"glow\" cx=\"0\" cy=\"0\" r=\"1\" gradientUnits=\"userSpaceOnUse\" gradientTransform=\"translate(220 120) rotate(30) scale(530 360)\"><stop stop-color=\"#ff4d67\" stop-opacity=\"0.22\"/><stop offset=\"1\" stop-color=\"#ff4d67\" stop-opacity=\"0\"/></radialGradient>",
        "    <radialGradient id=\"glowPurple\" cx=\"0\" cy=\"0\" r=\"1\" gradientUnits=\"userSpaceOnUse\" gradientTransform=\"translate(1120 700) rotate(180) scale(430 320)\"><stop stop-color=\"#843cff\" stop-opacity=\"0.23\"/><stop offset=\"1\" stop-color=\"#843cff\" stop-opacity=\"0\"/></radialGradient>",
        "    <pattern id=\"grid\" width=\"32\" height=\"32\" patternUnits=\"userSpaceOnUse\"><path d=\"M32 0H0V32\" stroke=\"#ff687b\" stroke-opacity=\"0.07\"/></pattern>",
        "    <clipPath id=\"commitMessageClip\"><rect x=\"138\" y=\"390\" width=\"400\" height=\"300\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"commitRepoClip\"><rect x=\"560\" y=\"390\" width=\"156\" height=\"300\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"organizationNameClip\"><rect x=\"878\" y=\"390\" width=\"214\" height=\"125\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"organizationDateClip\"><rect x=\"1110\" y=\"390\" width=\"76\" height=\"125\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"repoNameClip\"><rect x=\"878\" y=\"602\" width=\"198\" height=\"125\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"repoLanguageClip\"><rect x=\"1094\" y=\"602\" width=\"48\" height=\"125\" rx=\"4\"/></clipPath>",
        "    <clipPath id=\"repoDateClip\"><rect x=\"1146\" y=\"602\" width=\"40\" height=\"125\" rx=\"4\"/></clipPath>",
        "    <filter id=\"softGlow\" x=\"-30%\" y=\"-30%\" width=\"160%\" height=\"160%\"><feGaussianBlur stdDeviation=\"9\" result=\"blur\"/><feMerge><feMergeNode in=\"blur\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>",
        "  </defs>",
        "  <rect width=\"1280\" height=\"860\" rx=\"32\" fill=\"" + COLORS.background + "\"/>",
        "  <rect width=\"1280\" height=\"860\" rx=\"32\" fill=\"url(#background)\"/>",
        "  <rect width=\"1280\" height=\"860\" rx=\"32\" fill=\"url(#glow)\"/>",
        "  <rect width=\"1280\" height=\"860\" rx=\"32\" fill=\"url(#glowPurple)\"/>",
        "  <rect width=\"1280\" height=\"860\" rx=\"32\" fill=\"url(#grid)\"/>",
        "  <rect x=\"28\" y=\"28\" width=\"1224\" height=\"804\" rx=\"26\" fill=\"#0e0912\" stroke=\"url(#border)\"/>",
        "  <rect x=\"28\" y=\"28\" width=\"1224\" height=\"62\" rx=\"26\" fill=\"#1a0b13\"/>",
        "  <path d=\"M28 64C28 44.1177 44.1177 28 64 28H1216C1235.88 28 1252 44.1177 1252 64V90H28V64Z\" fill=\"url(#background)\" fill-opacity=\"0.35\"/>",
        "  <circle cx=\"69\" cy=\"59\" r=\"7\" fill=\"#ff7b8b\"/><circle cx=\"94\" cy=\"59\" r=\"7\" fill=\"#ff586e\"/><circle cx=\"119\" cy=\"59\" r=\"7\" fill=\"#ff304a\"/>",
        text(160, 64, "root@" + profile.username + ":~/readme", { fill: "#ffc2cb", size: 14, letterSpacing: 0.14 }),
        text(1208, 64, " · LIVE PROFILE", { fill: COLORS.pink, size: 11, weight: 700, anchor: "end", letterSpacing: 0.08 }),
        text(72, 137, "$ github --inspect " + profile.username, { fill: COLORS.pink, size: 14, weight: 700, letterSpacing: 0.06 }),
        text(72, 177, "KILIÇ SARSILMAZ", { fill: COLORS.text, size: 38, weight: 700, letterSpacing: 0.02 }),
        text(72, 202, shorten(profile.bio, 96), { fill: COLORS.muted, size: 13 }),
        text(1208, 177, "STATUS: ONLINE", { fill: COLORS.green, size: 11, weight: 700, anchor: "end", letterSpacing: 0.09 }),
        "<circle cx=\"1070\" cy=\"173\" r=\"5\" fill=\"" + COLORS.green + "\" filter=\"url(#softGlow)\"/>",
        renderMetric(72, "FOLLOWERS", formatCount(profile.followers), COLORS.coral),
        renderMetric(360, "PUBLIC REPOSITORIES", formatCount(profile.publicRepos), COLORS.pink),
        renderMetric(648, "ORGANIZATIONS", formatCount(profile.organizationCount), COLORS.purple),
        renderMetric(936, "COMMITS", formatCount(totalCommits), COLORS.green),
        panel(72, 324, 730, 404, "RECENT COMMITS"),
        text(138, 377, "MESSAGE", { fill: COLORS.muted, size: 10, weight: 700, letterSpacing: 0.08 }),
        text(560, 377, "REPOSITORY", { fill: COLORS.muted, size: 10, weight: 700, letterSpacing: 0.08 }),
        text(776, 377, "UPDATED", { fill: COLORS.muted, size: 10, weight: 700, anchor: "end", letterSpacing: 0.08 }),
        renderCommits(profile.commits.items, now),
        panel(826, 324, 382, 190, "ORGANIZATIONS"),
        text(1182, 382, "UPDATED", { fill: COLORS.muted, size: 9, weight: 700, anchor: "end", letterSpacing: 0.04 }),
        renderOrganizations(profile.organizations.slice(0, config.organizationLimit), now),
        panel(826, 538, 382, 190, "REPOSITORIES"),
        text(878, 596, "REPO", { fill: COLORS.muted, size: 9, weight: 700, letterSpacing: 0.08 }),
        text(1094, 596, "LANG", { fill: COLORS.muted, size: 9, weight: 700, letterSpacing: 0.08 }),
        text(1182, 596, "UPDATED", { fill: COLORS.muted, size: 9, weight: 700, anchor: "end", letterSpacing: 0.04 }),
        renderRepositories(profile.repositories, now),
        "  <path d=\"M72 770H1208\" stroke=\"" + COLORS.line + "\"/>",
        text(72, 807, "Powered By kilicdev.com", { fill: COLORS.pink, size: 11, weight: 700, letterSpacing: 0.05 }),
        text(1208, 807, "REFRESHED " + refreshed.toUpperCase(), { fill: COLORS.muted, size: 10, weight: 700, anchor: "end", letterSpacing: 0.06 }),
        "</svg>",
    ].join("\n");
};

const main = async () => {
    const profile = await collectProfile(config.username);
    const svg = buildSvg(profile);
    const data = buildProfileData(profile);
    fs.mkdirSync(path.dirname(config.outputFile), { recursive: true });
    fs.writeFileSync(config.outputFile, svg, "utf8");
    fs.writeFileSync(config.dataFile, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log("Generated " + config.outputFile + " for @" + profile.username);
    console.log("Generated " + config.dataFile + " for @" + profile.username);
};

if (require.main === module) { main().catch((e) => { console.error(e); process.exitCode = 1; }); }
module.exports = { buildProfileData, buildSvg, collectProfile, formatRelativeTime };
