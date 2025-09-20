import React from 'react';
import { Link } from 'react-router';

export default function Footer() {
    return (
        <footer className="relative w-screen left-1/2 -translate-x-1/2 bg-[#000510] text-white overflow-visible">
            {/* Fade halus di tepi atas footer */}
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[#000510] to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-5 sm:gap-6">
                    <div className="sm:text-left">
                        <span className="uppercase tracking-wider text-white/90">(© 2025 FRADIUM)</span>
                    </div>
                    <Link to="/reports" className="uppercase tracking-wider text-white/90 hover:text-white transition-colors duration-200">(VIEW REPORT)</Link>
                    <Link to="/assistant" className="uppercase tracking-wider text-white/90 hover:text-white transition-colors duration-200">(AI ASSISTANT)</Link>
                    <Link to="/products" className="uppercase tracking-wider text-white/90 hover:text-white transition-colors duration-200">(PRODUCTS)</Link>
                    <a href="https://fradium.gitbook.io/docs" target="_blank" rel="noopener noreferrer" className="uppercase tracking-wider text-white/90 hover:text-white transition-colors duration-200 sm:text-right">(DOCUMENTATION)</a>
                </div>
            </div>
        </footer>
    );
}


