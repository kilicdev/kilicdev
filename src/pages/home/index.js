import FooterLayout from "../../layouts/footer.js";
import HeroLayout from "./layouts/hero.js";

const HomePage = () => {
    return (
        <div className="page-shell">
            <div className="bg-grid" aria-hidden="true"></div>
            <div className="crt-vignette" aria-hidden="true"></div>

            <main className="page-main">
                <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
                    <div className="terminal-window">
                        <div className="terminal-header">
                            <div className="terminal-dots">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                            <div className="terminal-title" data-title="root@bucksh0t-dev:~">root@bucksh0t-dev:~</div>
                            <div className="terminal-status">ENCRYPTED</div>
                        </div>
                        <div className="terminal-body">
                            <HeroLayout />
                        </div>
                        <div className="terminal-footer-bar">
                            <span>tty0</span>
                            <span>utf-8</span>
                            <span>latency: 12ms</span>
                        </div>
                    </div>
                </div>
            </main>

            <FooterLayout />
        </div>
    )
}

export default HomePage;
