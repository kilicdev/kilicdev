const buildTerminalEntries = ({ yearsInIndustry }) => ([
    {
        command: "cat profile.sys",
        aliases: ["profile", "id"],
        type: "profile",
        avatar: "/libs/bucksh0t.png",
        avatarAlt: "bucksh0t profile image",
        previewPath: "/dev/identity/bucksh0t.png",
        name: "bucksh0t",
        role: "software architect",
        shell: "zsh",
        availability: "freelance.part-time",
        uptime: "100%",
        tags: ["Online"],
    },
    {
        command: "whoami",
        type: "text",
        output: `KILIC SARSILMAZ — Software Architect, Senior Full Stack Engineer. ${yearsInIndustry} yıldır sektördeyim. ${yearsInIndustry - 5} yıldır freelance çalışıyorum.`,
    },
    {
        command: "cat signal.txt",
        aliases: ["signal"],
        type: "text",
        output:
            "Sakin, premium ve hızlı ürünler kurarım. Node.js/Express, React/Next.js, microservice mimarileri, API tasarımı, mobil uygulamaları odağım.",
    },
    {
        command: "ls focus",
        aliases: ["focus"],
        type: "list",
        items: ["next.js/", "react native/", "express/", "java/"],
    },
    {
        command: "ls projects",
        aliases: ["projects"],
        type: "list",
        items: ["inelity.com/", "truith.com/", "waveme.app/", "cashra/"],
    },
    {
        command: "cat services.txt",
        aliases: ["services"],
        type: "text",
        output:
            "Freelance, Part-Time ve ortaklık tekliflerine açığım. Gelir odaklı, net kapsamlı işlerde hızlı hareket ederim.",
    },
    {
        command: "open stack",
        aliases: ["stack"],
        type: "text",
        output: "Nodejs, PHP, MySQL, MongoDB, C#, C++, Python, Java, Tailwind, Sql",
    },
    {
        command: "cat manifesto.txt",
        aliases: ["manifesto"],
        type: "text",
        output: "Görünüm sakin, sistemler sağlam olmalı. Detayları yüksek tutup, hızlı çalışırım. Premium hissi hız ve sağlamlıkla kurarım, Çözüm odaklı çalışırım.",
    },
    {
        command: "links",
        type: "links",
        links: [
            { label: "whatsapp", href: "https://wa.me/+905340694057" },
            { label: "github", href: "https://github.com/bucksh0tdev" },
            { label: "youtube", href: "https://youtube.com/bucksh0tdev" },
            { label: "telegram", href: "https://t.me/bucksh0tdev" },
            { label: "instagram", href: "https://instagram.com/bucksh0t.dev" },
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
