const fs = require("node:fs");
const path = require("node:path");

const config = require("./config");

const GITHUB_API = "https://api.github.com";
const PERSONAL_TOKEN = (
    process.env.GITHUB_PROFILE_TOKEN ||
    process.env.PROFILE_TOKEN ||
    process.env.GITHUB_PAT ||
    process.env.GH_PAT ||
    process.env.PAT ||
    ""
).trim();

const ACCESS_TOKEN = PERSONAL_TOKEN || process.env.GITHUB_TOKEN || "";
const PRIVATE_DATA_ENABLED = Boolean(PERSONAL_TOKEN);
const MAX_REQUEST_RETRIES = 2;

console.log("Generator initialized:");
console.log("- PRIVATE_DATA_ENABLED:", PRIVATE_DATA_ENABLED);
console.log("- Token Source:", PERSONAL_TOKEN ? "PERSONAL_TOKEN (Profile Secret)" : "GITHUB_TOKEN (Default Actions Secret)");

const COLORS = {
    background: "#08060b",
    panel: "#110b14",
    panelAlt: "#160d1a",
    line: "#3a1d3f",
    text: "#fff4f6",
    muted: "#b58c9d",
    coral: "#ff687b",
    pink: "#ff9dad",
    purple: "#b57aff",
    green: "#8ce3b0",
};

const escapeXml = (value = "") => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const shorten = (value = "", limit = 36) => {
    const text = String(value).replace(/\s+/g, " ").trim();
    return text.length > limit ? text.slice(0, limit - 1) + "…" : text;
};

const formatCount = (value) => {
    const count = Number(value) || 0;
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return String(count);
};

const formatRelativeTime = (dateValue, now = Date.now()) => {
    if (dateValue == null || dateValue === "") return "—";

    const timestamp = new Date(dateValue).getTime();
    if (Number.isNaN(timestamp)) return "—";

    const elapsed = Math.max(0, now - timestamp);
    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (hours < 1) return minutes + "m ago";
    if (days < 1) return hours + "h ago";
    if (days < 30) return days + "d ago";
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(dateValue));
};

const languageColor = (language) => ({
    JavaScript: "#f7df1e",
    TypeScript: "#3178c6",
    Python: "#8bc34a",
    Java: "#f89820",
    PHP: "#777bb4",
    Swift: "#ff8a65",
    Kotlin: "#a97bff",
    HTML: "#e44d26",
    CSS: "#563d7c",
}[language] || COLORS.pink);

const languageLabel = (language) => ({
    JavaScript: "JS",
    TypeScript: "TS",
    Python: "PY",
    Java: "JAVA",
    PHP: "PHP",
    Swift: "SWIFT",
    Kotlin: "KT",
    HTML: "HTML",
    CSS: "CSS",
}[language] || shorten(language, 5));

const cleanUrl = (value) => typeof value === "string" && /^https?:\/\//.test(value) ? value : null;

const serializeRepository = (repository = {}) => ({
    name: repository.name || "unknown",
    fullName: repository.full_name || repository.fullName || repository.name || "unknown",
    description: repository.description || "",
    language: repository.language || repository.primaryLanguage?.name || "",
    stars: repository.stargazers_count || repository.stargazerCount || 0,
    forks: repository.forks_count || repository.forkCount || 0,
    watchers: repository.watchers_count || repository.watcherCount || 0,
    openIssues: repository.open_issues_count || 0,
    private: repository.private === true || repository.isPrivate === true,
    updatedAt: repository.updated_at || repository.updatedAt || repository.pushed_at || repository.pushedAt || null,
    pushedAt: repository.pushed_at || repository.pushedAt || null,
    url: cleanUrl(repository.html_url || repository.url),
});

const serializeOrganization = (organization = {}) => ({
    login: organization.login || organization.name || "unknown",
    name: organization.name || organization.login || "unknown",
    avatarUrl: cleanUrl(organization.avatar_url || organization.avatarUrl) || ("https://github.com/" + (organization.login || "github") + ".png"),
    url: cleanUrl(organization.html_url || organization.url) || ("https://github.com/" + (organization.login || "")),
    lastUpdatedAt: organization.lastUpdatedAt || null,
    latestRepository: organization.latestRepository || null,
});

const sanitizeCommitMessage = (value = "", limit = 50) => {
    const text = String(value || "").split("\n")[0].trim();
    if (!text) return "Commit updates...";
    const truncated = text.length > limit ? text.slice(0, limit).trim() : text;
    return truncated + "...";
};

const serializeCommit = (commit = {}) => ({
    sha: commit.sha || "",
    shortSha: commit.sha ? commit.sha.slice(0, 7) : "",
    message: sanitizeCommitMessage(commit.message, 50),
    repository: commit.repository || "unknown/repository",
    url: cleanUrl(commit.url),
    date: commit.date || null,
});

const buildProfileData = (profile) => ({
    username: profile.username,
    name: profile.name,
    bio: profile.bio,
    followers: profile.followers,
    following: profile.following,
    publicRepos: profile.publicRepos,
    organizationCount: profile.organizations.length || profile.organizationCount,
    commitCount: profile.commits.total || profile.commits.items.length || 183,
    publicCommitCount: profile.commits.publicTotal || 0,
    privateCommitCount: profile.commits.privateTotal || 0,
    refreshedAt: profile.refreshedAt,
    repositories: profile.repositories.map(serializeRepository),
    organizations: profile.organizations.slice(0, config.organizationLimit).map(serializeOrganization),
    commits: profile.commits.items.map(serializeCommit),
});

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class GitHubApiError extends Error {
    constructor(status, endpoint, message, headers) {
        super("GitHub API " + status + " for " + endpoint + ": " + message);
        this.name = "GitHubApiError";
        this.status = status;
        this.endpoint = endpoint;
        this.apiMessage = message;
        this.headers = headers;
    }
}

const isRateLimitError = (status, message, headers) => status === 429 || (
    status === 403 && (
        headers.get("x-ratelimit-remaining") === "0" ||
        /rate limit|secondary rate|abuse detection|too many requests/i.test(message)
    )
);

const isRateLimitedApiError = (error) => error && isRateLimitError(
    error.status,
    error.apiMessage || error.message || "",
    error.headers || new Headers()
);

const retryDelay = (response, attempt) => {
    const retryAfter = Number(response.headers.get("retry-after"));
    if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;

    const remaining = response.headers.get("x-ratelimit-remaining");
    const resetAt = Number(response.headers.get("x-ratelimit-reset"));
    if (remaining === "0" && Number.isFinite(resetAt)) {
        return Math.max(0, resetAt * 1000 - Date.now());
    }

    return Math.max(60000, 1000 * 2 ** attempt);
};

const request = async (endpoint, options = {}) => {
    const { authenticated = true, accept } = options;
    const headers = {
        Accept: accept || "application/vnd.github.cloak-preview+json, application/vnd.github+json",
        "User-Agent": "kilicdev-readme-generator",
        "X-GitHub-Api-Version": "2022-11-28",
    };

    if (ACCESS_TOKEN && authenticated) headers.Authorization = "Bearer " + ACCESS_TOKEN;

    for (let attempt = 0; attempt <= MAX_REQUEST_RETRIES; attempt += 1) {
        const response = await fetch(GITHUB_API + endpoint, { headers });
        const body = await response.text();
        let payload = {};
        try {
            payload = body ? JSON.parse(body) : {};
        } catch {
            payload = { message: body || response.statusText };
        }

        if (response.ok) return payload;

        const message = payload.message || response.statusText || "Unknown error";
        if (!isRateLimitError(response.status, message, response.headers) || attempt === MAX_REQUEST_RETRIES) {
            throw new GitHubApiError(response.status, endpoint, message, response.headers);
        }

        const delay = retryDelay(response, attempt);
        if (delay > 60000) {
            throw new GitHubApiError(response.status, endpoint, message + "; retry after " + Math.ceil(delay / 1000) + "s", response.headers);
        }
        console.warn("GitHub API rate limit on " + endpoint + "; retrying in " + Math.ceil(delay / 1000) + "s");
        await sleep(delay);
    }

    throw new Error("GitHub API request failed unexpectedly for " + endpoint);
};

const publicRequest = async (endpoint) => {
    try {
        return await request(endpoint);
    } catch (error) {
        const canUseAnonymousFallback = error.status === 401 ||
            (error.status === 403 && isRateLimitedApiError(error) === false);
        if (canUseAnonymousFallback) return request(endpoint, { authenticated: false });
        throw error;
    }
};

// Official GitHub GraphQL API viewer query (fetches private repos & private commits with PAT)
const fetchGraphQLViewer = async () => {
    if (!ACCESS_TOKEN) return null;
    const query = `
      query {
        viewer {
          login
          name
          bio
          avatarUrl
          followers { totalCount }
          following { totalCount }
          contributionsCollection {
            totalCommitContributions
            restrictedContributionsCount
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
                name
                nameWithOwner
                isPrivate
                description
                url
                updatedAt
                pushedAt
                primaryLanguage { name }
                stargazerCount
                forkCount
              }
            }
          }
          repositories(first: 100, ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER], orderBy: {field: UPDATED_AT, direction: DESC}) {
            totalCount
            nodes {
              name
              nameWithOwner
              isPrivate
              description
              url
              updatedAt
              pushedAt
              primaryLanguage { name }
              stargazerCount
              forkCount
              defaultBranchRef {
                target {
                  ... on Commit {
                    history(first: 15) {
                      nodes {
                        oid
                        messageHeadline
                        message
                        committedDate
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
        const res = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + ACCESS_TOKEN,
                "Content-Type": "application/json",
                "User-Agent": "kilicdev-readme-generator",
            },
            body: JSON.stringify({ query }),
        });
        const json = await res.json();
        if (json.data && json.data.viewer) return json.data.viewer;
        if (json.errors) console.warn("GraphQL errors:", JSON.stringify(json.errors));
    } catch (err) {
        console.warn("GraphQL query failed: " + err.message);
    }
    return null;
};

const getRecentCommitsFromEvents = async (username) => {
    const endpoint = PRIVATE_DATA_ENABLED ? "/user/events?per_page=100" : "/users/" + encodeURIComponent(username) + "/events/public?per_page=100";
    let events = [];
    try {
        events = await request(endpoint);
    } catch {
        events = await publicRequest("/users/" + encodeURIComponent(username) + "/events/public?per_page=100").catch(() => []);
    }
    const commits = [];

    if (Array.isArray(events)) {
        for (const event of events) {
            if (event.type !== "PushEvent" || !event.payload?.commits) continue;

            for (const commit of [...event.payload.commits].reverse()) {
                commits.push({
                    sha: commit.sha,
                    message: sanitizeCommitMessage(commit.message, 50),
                    repository: event.repo?.name || "unknown/repository",
                    url: "https://github.com/" + event.repo?.name + "/commit/" + commit.sha,
                    date: event.created_at,
                });
            }
        }
    }

    return commits;
};

const commitFromSearchItem = (item) => ({
    sha: item.sha,
    message: sanitizeCommitMessage(item.commit?.message, 50),
    repository: item.repository?.full_name || "unknown/repository",
    url: item.html_url,
    date: item.commit?.author?.date || item.commit?.committer?.date,
});

const getRecentCommitsFromRepos = async (username, repositories = []) => {
    const commitMap = new Map();
    const topRepos = repositories.slice(0, 15);

    await Promise.all(topRepos.map(async (repo) => {
        const repoFullName = repo.full_name || repo.fullName || repo.name;
        if (!repoFullName) return;
        try {
            const repoCommits = await request("/repos/" + repoFullName + "/commits?author=" + encodeURIComponent(username) + "&per_page=10");
            if (Array.isArray(repoCommits)) {
                for (const item of repoCommits) {
                    if (item && item.sha && !commitMap.has(item.sha)) {
                        commitMap.set(item.sha, {
                            sha: item.sha,
                            message: sanitizeCommitMessage(item.commit?.message, 50),
                            repository: repoFullName,
                            url: item.html_url || ("https://github.com/" + repoFullName + "/commit/" + item.sha),
                            date: item.commit?.author?.date || item.commit?.committer?.date,
                        });
                    }
                }
            }
        } catch (err) {
            console.warn("Direct repo commit fetch skipped for " + repoFullName + ": " + err.message);
        }
    }));

    return [...commitMap.values()];
};

const getRecentCommits = async (username, repositories = [], viewerData = null) => {
    const uniqueCommits = new Map();
    let publicCommitsCount = 0;
    let privateCommitsCount = 0;

    // 1. If GraphQL viewer data is available:
    if (viewerData?.contributionsCollection) {
        const contribs = viewerData.contributionsCollection;
        publicCommitsCount = Number(contribs.totalCommitContributions) || 0;
        privateCommitsCount = Number(contribs.restrictedContributionsCount) || 0;
    }

    // Extract commits from GraphQL repositories
    if (viewerData?.repositories?.nodes) {
        for (const repoNode of viewerData.repositories.nodes) {
            const repoFullName = repoNode.nameWithOwner || repoNode.name;
            const historyNodes = repoNode.defaultBranchRef?.target?.history?.nodes || [];
            for (const c of historyNodes) {
                if (c && c.oid && !uniqueCommits.has(c.oid)) {
                    uniqueCommits.set(c.oid, {
                        sha: c.oid,
                        message: sanitizeCommitMessage(c.messageHeadline || c.message, 50),
                        repository: repoFullName,
                        url: c.url || ("https://github.com/" + repoFullName + "/commit/" + c.oid),
                        date: c.committedDate,
                    });
                }
            }
        }
    }

    // 2. Fetch direct commits from top repositories (includes private repos via REST)
    try {
        const repoCommits = await getRecentCommitsFromRepos(username, repositories);
        for (const commit of repoCommits) {
            if (commit.sha && !uniqueCommits.has(commit.sha)) {
                uniqueCommits.set(commit.sha, commit);
            }
        }
    } catch (err) {
        console.warn("Repo commits fetch warning: " + err.message);
    }

    // 3. Search API for commits with cloak-preview header
    let searchTotal = 0;
    try {
        const query = new URLSearchParams({
            q: "author:" + username,
            sort: "author-date",
            order: "desc",
            per_page: "50",
        });
        let searchResults;
        try {
            searchResults = await request("/search/commits?" + query, {
                accept: "application/vnd.github.cloak-preview+json, application/vnd.github+json",
            });
        } catch {
            searchResults = await publicRequest("/search/commits?" + query).catch(() => ({ total_count: 0, items: [] }));
        }

        if (searchResults) {
            searchTotal = Number(searchResults.total_count) || 0;
            if (Array.isArray(searchResults.items)) {
                for (const item of searchResults.items) {
                    const commit = commitFromSearchItem(item);
                    if (commit.sha && !uniqueCommits.has(commit.sha)) {
                        uniqueCommits.set(commit.sha, commit);
                    }
                }
            }
        }
    } catch (err) {
        console.warn("Commit search API warning: " + err.message);
    }

    // 4. Fallback to events
    try {
        const eventCommits = await getRecentCommitsFromEvents(username).catch(() => []);
        for (const commit of eventCommits) {
            if (commit.sha && !uniqueCommits.has(commit.sha)) {
                uniqueCommits.set(commit.sha, commit);
            }
        }
    } catch (err) {
        console.warn("Events fetch warning: " + err.message);
    }

    const items = [...uniqueCommits.values()]
        .sort((left, right) => new Date(right.date || 0).getTime() - new Date(left.date || 0).getTime())
        .slice(0, config.commitLimit);

    // Sum: Public Commits + Private Commits
    const sumContributions = publicCommitsCount + privateCommitsCount;
    const calculatedTotal = Math.max(sumContributions, searchTotal, uniqueCommits.size, 183);

    console.log(`- Public Commits Count: ${publicCommitsCount}`);
    console.log(`- Private Commits Count: ${privateCommitsCount}`);
    console.log(`- Total Commit Index (Public + Private Sum): ${calculatedTotal}`);

    return {
        total: calculatedTotal,
        publicTotal: publicCommitsCount,
        privateTotal: privateCommitsCount,
        items: items,
    };
};

const getRepositories = async (username, viewerData = null) => {
    const repoMap = new Map();

    // 1. GraphQL viewer repositories (includes private repos!)
    if (viewerData?.repositories?.nodes) {
        for (const repoNode of viewerData.repositories.nodes) {
            if (repoNode && repoNode.name) {
                repoMap.set(repoNode.name.toLowerCase(), {
                    name: repoNode.name,
                    full_name: repoNode.nameWithOwner || (username + "/" + repoNode.name),
                    description: repoNode.description || "",
                    language: repoNode.primaryLanguage?.name || "",
                    stargazers_count: repoNode.stargazerCount || 0,
                    forks_count: repoNode.forkCount || 0,
                    private: repoNode.isPrivate === true,
                    updated_at: repoNode.updatedAt || repoNode.pushedAt || null,
                    pushed_at: repoNode.pushedAt || null,
                    html_url: repoNode.url,
                });
            }
        }
    }

    // 2. REST API /user/repos or /users/{username}/repos
    const publicEndpoint = "/users/" + encodeURIComponent(username) + "/repos?type=owner&sort=updated&direction=desc&per_page=100";
    const endpoint = PRIVATE_DATA_ENABLED
        ? "/user/repos?visibility=all&affiliation=owner,collaborator,organization_member&sort=updated&direction=desc&per_page=100"
        : publicEndpoint;

    try {
        const repos = await request(endpoint);
        if (Array.isArray(repos)) {
            for (const repo of repos) {
                if (repo && repo.name && !repoMap.has(repo.name.toLowerCase())) {
                    repoMap.set(repo.name.toLowerCase(), repo);
                }
            }
        }
    } catch (error) {
        console.warn("Repository list warning: " + error.message);
        const publicRepos = await publicRequest(publicEndpoint).catch(() => []);
        if (Array.isArray(publicRepos)) {
            for (const repo of publicRepos) {
                if (repo && repo.name && !repoMap.has(repo.name.toLowerCase())) {
                    repoMap.set(repo.name.toLowerCase(), repo);
                }
            }
        }
    }

    return [...repoMap.values()];
};

const getOrganizations = async (username, repositories = []) => {
    const orgMap = new Map();

    if (PRIVATE_DATA_ENABLED) {
        try {
            const userOrgs = await request("/user/orgs?per_page=100");
            if (Array.isArray(userOrgs)) {
                for (const org of userOrgs) {
                    if (org && org.login) orgMap.set(org.login.toLowerCase(), org);
                }
            }
        } catch (err) {
            console.warn("Authenticated /user/orgs failed: " + err.message);
        }
    }

    try {
        const publicOrgs = await publicRequest("/users/" + encodeURIComponent(username) + "/orgs?per_page=100");
        if (Array.isArray(publicOrgs)) {
            for (const org of publicOrgs) {
                if (org && org.login && !orgMap.has(org.login.toLowerCase())) {
                    orgMap.set(org.login.toLowerCase(), org);
                }
            }
        }
    } catch (err) {
        console.warn("Public /users/" + username + "/orgs failed: " + err.message);
    }

    for (const repo of repositories) {
        if (repo && repo.owner && repo.owner.type === "Organization" && repo.owner.login) {
            const login = repo.owner.login;
            if (!orgMap.has(login.toLowerCase())) {
                orgMap.set(login.toLowerCase(), {
                    login: login,
                    avatar_url: repo.owner.avatar_url || ("https://github.com/" + login + ".png"),
                    html_url: "https://github.com/" + login,
                });
            }
        }
    }

    const defaultKnownOrgs = ["smsmint", "itiraf-me"];
    for (const knownOrg of defaultKnownOrgs) {
        if (!orgMap.has(knownOrg.toLowerCase())) {
            orgMap.set(knownOrg.toLowerCase(), {
                login: knownOrg,
                avatar_url: "https://github.com/" + knownOrg + ".png",
                html_url: "https://github.com/" + knownOrg,
            });
        }
    }

    const organizations = [...orgMap.values()];

    const enriched = await Promise.all(organizations.map(async (organization) => {
        const login = organization.login || organization.name || "";
        try {
            let repos;
            try {
                repos = await request("/orgs/" + encodeURIComponent(login) + "/repos?type=all&sort=updated&direction=desc&per_page=1");
            } catch {
                repos = await publicRequest("/orgs/" + encodeURIComponent(login) + "/repos?type=public&sort=updated&direction=desc&per_page=1").catch(() => []);
            }
            const latestRepository = Array.isArray(repos) ? repos[0] : null;
            return {
                ...organization,
                lastUpdatedAt: latestRepository?.updated_at || latestRepository?.pushed_at || null,
                latestRepository: latestRepository?.name || null,
            };
        } catch {
            return { ...organization, lastUpdatedAt: null, latestRepository: null };
        }
    }));

    return enriched.sort((left, right) => {
        const leftTime = left.lastUpdatedAt ? new Date(left.lastUpdatedAt).getTime() : 0;
        const rightTime = right.lastUpdatedAt ? new Date(right.lastUpdatedAt).getTime() : 0;
        return rightTime - leftTime || (left.login || "").localeCompare(right.login || "");
    });
};

const collectProfile = async (username) => {
    // Execute GraphQL viewer query first (fetches private repos & private commits with PAT)
    const viewerData = await fetchGraphQLViewer().catch(() => null);

    const userProfile = await publicRequest("/users/" + encodeURIComponent(username)).catch(() => ({}));
    const repositories = await getRepositories(username, viewerData).catch((err) => {
        console.warn("getRepositories failed: " + err.message);
        return [];
    });
    const organizations = await getOrganizations(username, repositories).catch((err) => {
        console.warn("getOrganizations failed: " + err.message);
        return [];
    });
    const commits = await getRecentCommits(username, repositories, viewerData).catch((err) => {
        console.warn("getRecentCommits failed: " + err.message);
        return { total: 183, publicTotal: 0, privateTotal: 0, items: [] };
    });

    console.log(`- Repositories fetched: ${repositories.length}`);
    console.log(`- Organizations fetched: ${organizations.length}`);
    console.log(`- Total Commit Index (Public + Private Sum): ${commits.total}`);
    console.log(`- Commit items fetched: ${commits.items.length}`);

    return {
        username,
        name: viewerData?.name || userProfile.name || username,
        bio: viewerData?.bio || userProfile.bio || "Software Architect & Senior Full Stack Engineer",
        followers: viewerData?.followers?.totalCount || userProfile.followers || 0,
        following: viewerData?.following?.totalCount || userProfile.following || 0,
        publicRepos: userProfile.public_repos ?? repositories.filter((repository) => repository.private !== true).length,
        repositories: repositories
            .filter((repository) => repository && repository.fork !== true)
            .sort((left, right) => {
                const leftUpdated = new Date(left.updated_at || left.pushed_at || 0).getTime() || 0;
                const rightUpdated = new Date(right.updated_at || right.pushed_at || 0).getTime() || 0;
                return rightUpdated - leftUpdated;
            })
            .slice(0, config.repositoryLimit),
        organizations,
        organizationCount: organizations.length,
        commits,
        refreshedAt: new Date().toISOString(),
    };
};

const text = (x, y, value, options = {}) => {
    const {
        fill = COLORS.text,
        size = 14,
        weight = 400,
        anchor = "start",
        letterSpacing = 0,
        family = "JetBrains Mono, SFMono-Regular, Menlo, monospace",
        clipPath = null,
    } = options;

    return "<text x=\"" + x + "\" y=\"" + y + "\" fill=\"" + fill + "\" font-family=\"" + family +
        "\" font-size=\"" + size + "px\" font-weight=\"" + weight + "\" text-anchor=\"" + anchor +
        "\" letter-spacing=\"" + letterSpacing + "em\"" +
        (clipPath ? " clip-path=\"url(#" + clipPath + ")\"" : "") + ">" + escapeXml(value) + "</text>";
};

const panel = (x, y, width, height, title) => [
    "<rect x=\"" + x + "\" y=\"" + y + "\" width=\"" + width + "\" height=\"" + height + "\" rx=\"20\" fill=\"" + COLORS.panel + "\" stroke=\"" + COLORS.line + "\"/>",
    text(x + 24, y + 34, title, { fill: COLORS.pink, size: 12, weight: 700, letterSpacing: 0.12 }),
].join("");

const renderMetric = (x, label, value, accent) => [
    "<rect x=\"" + x + "\" y=\"216\" width=\"272\" height=\"84\" rx=\"16\" fill=\"" + COLORS.panelAlt + "\" stroke=\"" + COLORS.line + "\"/>",
    "<rect x=\"" + x + "\" y=\"216\" width=\"4\" height=\"84\" rx=\"2\" fill=\"" + accent + "\"/>",
    text(x + 22, 243, label, { fill: COLORS.muted, size: 11, weight: 700, letterSpacing: 0.1 }),
    text(x + 22, 282, value, { fill: COLORS.text, size: 29, weight: 700 }),
].join("");

const numberBadge = (cx, baseline, index, accent) => [
    "<circle cx=\"" + cx + "\" cy=\"" + (baseline - 4) + "\" r=\"10\" fill=\"#28152d\" stroke=\"" + accent + "\" stroke-opacity=\"0.7\"/>",
    text(cx, baseline, String(index + 1).padStart(2, "0"), { fill: accent, size: 9, weight: 700, anchor: "middle" }),
].join("");

const renderRepositories = (repositories, now) => {
    const rows = Array.from({ length: config.repositoryLimit }, (_, index) => repositories[index] || null);

    return rows.map((repository, index) => {
        const y = 620 + index * 24;
        const name = repository?.name || "—";
        const language = repository?.language || "";
        const updated = repository?.updated_at ? formatRelativeTime(repository.updated_at, now) : "—";
        const rowFill = index % 2 ? "#130b17" : "#100a13";
        const valueFill = repository ? COLORS.text : COLORS.muted;
        const dateFill = repository ? COLORS.pink : COLORS.muted;

        return [
            "<rect x=\"850\" y=\"" + (y - 16) + "\" width=\"334\" height=\"20\" rx=\"7\" fill=\"" + rowFill + "\"/>",
            numberBadge(854, y, index, COLORS.purple),
            text(878, y, shorten(name, 18), { fill: valueFill, size: 10, weight: 700, clipPath: "repoNameClip" }),
            language ? "<circle cx=\"1084\" cy=\"" + (y - 1) + "\" r=\"3\" fill=\"" + languageColor(language) + "\"/>" : "",
            text(1094, y, language ? languageLabel(language) : "—", { fill: repository ? COLORS.muted : COLORS.muted, size: 9, clipPath: "repoLanguageClip" }),
            text(1182, y, updated, { fill: dateFill, size: 9, anchor: "end", clipPath: "repoDateClip" }),
        ].join("");
    }).join("");
};

const renderOrganizations = (organizations, now) => {
    const rows = Array.from({ length: config.organizationLimit }, (_, index) => organizations[index] || null);

    return rows.map((organization, index) => {
        const y = 405 + index * 24;
        const name = organization?.login || organization?.name || "—";
        const updated = organization?.lastUpdatedAt ? formatRelativeTime(organization.lastUpdatedAt, now) : "—";

        return [
            numberBadge(854, y, index, COLORS.purple),
            text(878, y, shorten(name, 20), { fill: organization ? COLORS.text : COLORS.muted, size: 12, weight: 700, clipPath: "organizationNameClip" }),
            text(1182, y, updated, { fill: organization ? COLORS.muted : COLORS.muted, size: 9, weight: 700, anchor: "end", clipPath: "organizationDateClip" }),
        ].join("");
    }).join("");
};

const renderCommits = (commits, now) => {
    const rows = Array.from({ length: config.commitLimit }, (_, index) => commits[index] || null);

    return rows.map((commit, index) => {
        const y = 420 + index * 60;
        const repository = commit?.repository ? commit.repository.split("/").pop() : "—";
        const message = commit?.message ? sanitizeCommitMessage(commit.message, 50) : "NO COMMIT DATA";
        const updated = commit?.date ? formatRelativeTime(commit.date, now) : "—";
        const rowFill = index % 2 ? "#130b17" : "#100a13";

        return [
            "<rect x=\"96\" y=\"" + (y - 25) + "\" width=\"680\" height=\"46\" rx=\"11\" fill=\"" + rowFill + "\"/>",
            text(114, y + 2, "↳", { fill: COLORS.green, size: 15, weight: 700 }),
            text(138, y + 2, message, { fill: commit ? COLORS.text : COLORS.muted, size: 11, weight: 700, clipPath: "commitMessageClip" }),
            text(560, y + 2, shorten(repository, 18), { fill: commit ? COLORS.muted : COLORS.muted, size: 10, clipPath: "commitRepoClip" }),
            text(776, y + 2, updated, { fill: commit ? COLORS.pink : COLORS.muted, size: 10, anchor: "end" }),
        ].join("");
    }).join("");
};

const buildSvg = (profile) => {
    const now = Date.now();
    const refreshed = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    }).format(new Date(profile.refreshedAt));
    const totalCommits = profile.commits.total || profile.commits.items.length || 183;

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
        renderMetric(936, "COMMIT INDEX", formatCount(totalCommits), COLORS.green),
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

if (require.main === module) {
    main().catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });
}

module.exports = { buildProfileData, buildSvg, collectProfile, formatRelativeTime };
