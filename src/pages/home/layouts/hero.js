import { useMemo, useRef, useState } from "react";
import buildTerminalEntries, { buildCommandMap, extraCommandEntries } from "./terminalContent.js";
import TerminalSection from "./TerminalSection.js";
import TerminalInput from "./TerminalInput.js";

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const MAX_USER_LOG = 6;
const QUICK_COMMANDS = ["help", "profile", "whoami", "focus", "projects", "stack", "links", "music", "clear"];

const HeroLayout = () => {
    const yearsInIndustry = new Date().getFullYear() - 2015;
    const baseEntries = useMemo(
        () => buildTerminalEntries({ yearsInIndustry }).map((entry) => ({ ...entry, id: createId() })),
        [yearsInIndustry]
    );
    const commandMap = useMemo(
        () => buildCommandMap([...baseEntries, ...extraCommandEntries]),
        [baseEntries]
    );
    const [userLog, setUserLog] = useState([]);
    const audioRef = useRef(null);

    const scrollToBottom = () => {
        if (typeof window === "undefined") return;
        const doc = document.documentElement;
        const top = Math.max(doc.scrollHeight, document.body.scrollHeight) - doc.clientHeight;
        window.scrollTo(0, top);
    };

    const toggleMusic = () => {
        const audio = audioRef.current;
        if (!audio) return "Music Not Found!";
        audio.loop = true;
        audio.volume = 0.3;
        if (audio.paused) {
            audio.play().catch(() => {});
            return "This devil plays to win ~ and he never loses.";
        }
        audio.pause();
        return "Signal muted.";
    };

    const appendUserEntry = (entry) => {
        setUserLog((prev) => {
            const next = [...prev, entry];
            if (next.length <= MAX_USER_LOG) return next;
            return next.slice(next.length - MAX_USER_LOG);
        });
    };

    const handleCommand = (rawCommand) => {
        const normalized = rawCommand.trim().toLowerCase();
        if (!normalized) return;

        if (normalized === "clear") {
            setUserLog([]);
            scrollToBottom();
            return;
        }

        const match = commandMap[normalized];
        if (match) {
            let outputOverride;
            if (match.effect === "music") {
                outputOverride = toggleMusic();
            }
            appendUserEntry({
                ...match,
                id: createId(),
                command: rawCommand,
                output: outputOverride ?? match.output,
                source: "user",
            });
            scrollToBottom();
            return;
        }

        appendUserEntry({
            id: createId(),
            command: rawCommand,
            type: "text",
            output: `command not found: ${rawCommand}`,
            source: "user",
        });
        scrollToBottom();
    };

    return (
        <div className="terminal-stack">
            <section className="terminal-section terminal-section--single">
                {baseEntries.map((entry) => (
                    <TerminalSection key={entry.id} entry={entry} />
                ))}

                {userLog.map((entry) => (
                    <TerminalSection key={entry.id} entry={entry} />
                ))}

                <TerminalInput onSubmit={handleCommand} suggestions={QUICK_COMMANDS} />
            </section>
            <audio ref={audioRef} src="/libs/music.mp3" preload="auto" style={{ display: "none" }} />
        </div>
    );
}

export default HeroLayout;
