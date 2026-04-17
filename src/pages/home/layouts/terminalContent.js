const buildTerminalEntries = ({ yearsInIndustry }) => ([
    {
        command: "cat profile.sys",
        aliases: ["profile", "id"],
        type: "profile",
        avatar: "/libs/kilic.png",
        avatarAlt: "kilic profile image",
        previewPath: "/dev/identity/kilic.png",
        name: "kilicdev",
        role: "software architect",
        shell: "zsh",
        availability: "freelance / part-time",
        uptime: "100%",
        tags: ["Online"],
    },
    {
        command: "whoami",
        type: "text",
        output: `KILIC SARSILMAZ — Software Architect, Senior Full Stack Engineer. I've been in the industry for ${yearsInIndustry} years. I've been freelancing for ${yearsInIndustry - 5} years.`,
    },
    {
        command: "cat signal.txt",
        aliases: ["signal"],
        type: "text",
        output:
            "I build calm, premium, fast products. Focus: Node.js/Express, React/Next.js, microservice architectures, API design, and mobile apps.",
    },
    {
        command: "ls focus",
        aliases: ["focus"],
        type: "list",
        items: ["next.js/", "react native/", "express/", "java/"],
    },
    {
        command: "ls my-projects",
        aliases: ["projects"],
        type: "list",
        items: ["inelity.com/", "waveme.app/", "cashra/", "hackmety/"],
    },
    {
        command: "cat services.txt",
        aliases: ["services"],
        type: "text",
        output:
            "Open to freelance, part-time, and partnership offers. I move fast on revenue-focused projects with a clear scope.",
    },
    {
        command: "open stack",
        aliases: ["stack"],
        type: "text",
        output: "Node.js, PHP, MySQL, MongoDB, C#, C++, Python, Java, Tailwind, SQL",
    },
    {
        command: "cat manifesto.txt",
        aliases: ["manifesto"],
        type: "text",
        output: "The look stays calm; the systems stay solid. High detail, fast execution. Premium feel comes from speed and robustness. Always solution-first.",
    },
    {
        command: "links",
        type: "links",
        links: [
            { label: "whatsapp", href: "https://wa.me/+905340694057" },
            { label: "github", href: "https://github.com/kilicdev" },
            { label: "youtube", href: "https://youtube.com/kilicdev" },
            { label: "telegram", href: "https://t.me/kilicdev" },
            { label: "instagram", href: "https://instagram.com/kilic.dev" },
        ],
    },
]);

const extraCommandEntries = [
    {
        command: "help",
        aliases: ["?"],
        type: "list",
        items: [
            "profile",
            "whoami",
            "signal",
            "focus",
            "projects",
            "services",
            "stack",
            "manifesto",
            "links",
            "music",
            "clear",
        ],
    },
    {
        command: "music",
        type: "text",
        effect: "music",
        output: "This devil plays to win ~ and he never loses.",
    },
];

const normalizeCommand = (command) => command.trim().toLowerCase();

const buildCommandMap = (entries) => {
    const map = {};

    entries.forEach((entry) => {
        const keys = [entry.command, ...(entry.aliases || [])];
        keys.forEach((key) => {
            map[normalizeCommand(key)] = entry;
        });
    });

    return map;
};

export { buildCommandMap, extraCommandEntries };
export default buildTerminalEntries;
