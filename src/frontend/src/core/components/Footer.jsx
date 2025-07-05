import React from "react";
import styles from "./footer.module.css";
import Button from './Button';

const Footer = () => {
    return (
        <footer className={`${styles.footerRoot} relative w-full flex flex-col items-center`}>
            {/* Ilustrasi footer absolute di belakang frame, nempel di atas frame */}
            <img
                src="/assets/images/Illus-footer.png"
                alt="Footer Illustration"
                className="absolute left-1/2 top-0 -translate-x-1/2 z-[1] max-w-[100vw] w-auto select-none pointer-events-none"
                draggable="false"
                style={{}}
            />
            {/* Frame glassmorphism */}
            <div className={styles.footerContent} style={{ position: 'relative', zIndex: 2, marginTop: '260px' }}>
                <div className={styles.leftCol}>
                    <div className={styles.logoRow}>
                        <img src="/logo.svg" alt="Crypgo Logo" className={styles.logo} />
                        <span className={styles.brand}>Crypgo</span>
                    </div>
                    <p className={styles.desc}>
                        Fradium equips you with powerful tools to analyse, protect, and transact securely across the blockchain.
                    </p>
                    <div className={styles.socialRow}>
                        <a href="#" aria-label="Facebook"><img src="/assets/images/facebook.png" alt="Facebook" /></a>
                        <a href="#" aria-label="Instagram"><img src="/assets/images/instagram.png" alt="Instagram" /></a>
                        <a href="#" aria-label="X"><img src="/assets/images/x.png" alt="X" /></a>
                    </div>
                </div>
                <div className={styles.linksCol}>
                    <div className={styles.linksBlock}>
                        <div className={styles.linksTitle}>Links</div>
                        <ul>
                            <li><a href="#">Features</a></li>
                            <li><a href="#">Benefits</a></li>
                            <li><a href="#">Services</a></li>
                            <li><a href="#">Why Crypgo</a></li>
                            <li><a href="#">FAQs</a></li>
                        </ul>
                    </div>
                    <div className={styles.linksBlock}>
                        <div className={styles.linksTitle}>Other Pages</div>
                        <ul>
                            <li><a href="#">Terms</a></li>
                            <li><a href="#">Latest News</a></li>
                        </ul>
                        <Button className="mt-8" size="sm">
                            Launch Wallet &nbsp;→
                        </Button>
                    </div>
                </div>
            </div>
            {/* Copyright di bawah frame */}
            <div className={styles.copyright}>
                Copyright &copy;2025 Fradium. All rights reserved
            </div>
        </footer>
    );
};

export default Footer; 