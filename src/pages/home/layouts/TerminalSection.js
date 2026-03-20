const TerminalSection = ({ entry }) => {
    const {
        command,
        type,
        output,
        items,
        links,
        name,
        role,
        tags,
        shell,
        availability,
        uptime,
        avatar,
        avatarAlt,
    } = entry;
    const isUserEntry = entry.source === "user";
    const isErrorOutput =
        type === "text" &&
        typeof output === "string" &&
        output.toLowerCase().startsWith("command not found:");
    const articleClassName = `terminal-entry${isUserEntry ? " terminal-entry-user" : ""}`;
    const textOutputClassName = `terminal-output${isErrorOutput ? " terminal-output-error" : ""}`;

    return (
        <article className={articleClassName}>
            <div className="terminal-section-title">
                <span className="terminal-context">root@bucksh0t-dev</span>
                <span className="terminal-context-path">~</span>
                <span className="terminal-prompt">$</span>
                <span className="terminal-command">{command}</span>
            </div>

            {type === "text" && <div className={textOutputClassName}>{output}</div>}

            {type === "list" && (
                <div className="terminal-output terminal-grid">
                    {(items || []).map((item) => (
                        <span key={item} className="terminal-grid-item">
                            <span className="terminal-grid-bullet" aria-hidden="true">›</span>
                            <span>{item}</span>
                        </span>
                    ))}
                </div>
            )}

            {type === "links" && (
                <div className="terminal-output">
                    <div className="terminal-links">
                        {(links || []).map((link) => (
                            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
                                ↗ {link.label}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {type === "profile" && (
                <div className="terminal-output terminal-profile-shell">
                    <div className="terminal-profile-preview">
                        {avatar ? (
                            <img
                                className="terminal-profile-avatar"
                                src={avatar}
                                alt={avatarAlt || "profile"}
                                loading="lazy"
                                decoding="async"
                            />
                        ) : (
                            <div className="terminal-profile-avatar terminal-profile-avatar-empty">no image</div>
                        )}
                    </div>

                    <div className="terminal-profile">
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">id</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-value">{name}</span>
                        </div>
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">role</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-value">{role}</span>
                        </div>
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">shell</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-value">{shell}</span>
                        </div>
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">mode</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-value">{availability}</span>
                        </div>
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">uptime</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-value">{uptime}</span>
                        </div>
                        <div className="terminal-profile-line">
                            <span className="terminal-profile-key">status</span>
                            <span className="terminal-profile-separator">:</span>
                            <span className="terminal-profile-values">
                                {(tags || []).map((tag) => (
                                    <span key={tag} className="terminal-profile-value-item">{tag}</span>
                                ))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </article>
    );
};

export default TerminalSection;
