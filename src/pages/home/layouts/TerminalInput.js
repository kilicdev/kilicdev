import { useMemo, useRef, useState } from "react";

const TerminalInput = ({ onSubmit, suggestions = [] }) => {
    const inputRef = useRef(null);
    const [value, setValue] = useState("");
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [completionSeed, setCompletionSeed] = useState("");
    const [completionIndex, setCompletionIndex] = useState(-1);

    const normalizedSuggestions = useMemo(
        () => suggestions.map((item) => item.trim().toLowerCase()).filter(Boolean),
        [suggestions]
    );

    const focusInput = () => {
        if (!inputRef.current) return;
        inputRef.current.focus();
    };

    const setInputValue = (nextValue) => {
        setValue(nextValue);
        if (inputRef.current) {
            inputRef.current.value = nextValue;
        }
    };

    const handleChange = (event) => {
        setValue(event.target.value);
        setCompletionSeed("");
        setCompletionIndex(-1);
    };

    const completeByTab = () => {
        const raw = value.trim().toLowerCase();
        if (!raw || normalizedSuggestions.length === 0) return;
        const activeSeed = completionSeed && raw.startsWith(completionSeed) ? completionSeed : raw;
        const matches = normalizedSuggestions.filter((item) => item.startsWith(activeSeed));
        if (matches.length === 0) return;

        if (matches.length === 1) {
            setInputValue(matches[0]);
            setCompletionSeed(matches[0]);
            setCompletionIndex(0);
            return;
        }

        if (completionSeed !== activeSeed) {
            setInputValue(matches[0]);
            setCompletionSeed(activeSeed);
            setCompletionIndex(0);
            return;
        }

        const nextIndex = completionIndex >= matches.length - 1 ? 0 : completionIndex + 1;
        setInputValue(matches[nextIndex]);
        setCompletionSeed(activeSeed);
        setCompletionIndex(nextIndex);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Tab") {
            event.preventDefault();
            completeByTab();
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const command = value.trim();
            if (!command) return;

            onSubmit(command);
            setHistory((prev) => [...prev, command]);
            setHistoryIndex(-1);
            setCompletionSeed("");
            setCompletionIndex(-1);
            setInputValue("");
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            if (history.length === 0) return;
            const nextIndex = historyIndex < 0 ? history.length - 1 : Math.max(historyIndex - 1, 0);
            setHistoryIndex(nextIndex);
            setInputValue(history[nextIndex]);
            return;
        }

        if (event.key === "ArrowDown") {
            event.preventDefault();
            if (history.length === 0) return;
            const nextIndex = historyIndex >= history.length - 1 ? -1 : historyIndex + 1;
            setHistoryIndex(nextIndex);
            setInputValue(nextIndex === -1 ? "" : history[nextIndex]);
            return;
        }

        if (event.key === "Escape") {
            event.preventDefault();
            setHistoryIndex(-1);
            setCompletionSeed("");
            setCompletionIndex(-1);
            setInputValue("");
        }
    };

    return (
        <div className="terminal-input-row" onClick={focusInput}>
            <div className="terminal-input-prefix" aria-hidden="true">
                <span className="terminal-user terminal-user-desktop">root@bucksh0t-dev</span>
                <span className="terminal-user terminal-user-mobile">root@node</span>
                <span className="terminal-path">~</span>
                <span className="terminal-prompt">$</span>
            </div>
            <input
                ref={inputRef}
                className="terminal-input-text"
                type="text"
                value={value}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="run command (help)"
                aria-label="Terminal command input"
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
            />
        </div>
    );
};

export default TerminalInput;
