import React from 'react';
import { FaInstagram, FaTelegramPlane, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer" id="contact">
            <div className="mx-auto w-full max-w-6xl px-6 lg:px-10">
                <div className="footer-bottom">
                    <span>© 1997 - {year} kilicdev</span>
                    <div className="footer-icons">
                        <a rel="noopener noreferrer" href="https://t.me/kilicdev" target="_blank" aria-label="Telegram">
                            <FaTelegramPlane />
                        </a>
                        <a rel="noopener noreferrer" href="https://instagram.com/kilic.dev" target="_blank" aria-label="Instagram">
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
