import React from 'react';
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer" id="contact">
            <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
                <div className="footer-bottom">
                    <span>© 1997 - {year} bucksh0t</span>
                    <div className="footer-icons">
                        <a rel="noopener noreferrer" href="https://t.me/bucksh0tdev" target="_blank" aria-label="Telegram">
                            <FaTelegramPlane />
                        </a>
                        <a rel="noopener noreferrer" href="https://instagram.com/bucksh0t.dev" target="_blank" aria-label="Instagram">
                            <FaInstagram />
                        </a>
                        <a rel="noopener noreferrer" href="https://wa.me/+905340694057" target="_blank" aria-label="Whatsapp">
                            <FaWhatsapp />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer;
