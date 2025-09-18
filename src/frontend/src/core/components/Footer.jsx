import React from 'react';

export default function Footer() {
    return (
        <footer className="relative w-screen left-1/2 -translate-x-1/2 bg-[#000510] text-white overflow-visible">
            {/* Fade halus di tepi atas footer */}
            <div className="pointer-events-none absolute inset-x-0 -top-10 h-10 bg-gradient-to-t from-[#000510] to-transparent" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-4 sm:gap-6">
                    <div className="sm:text-left">
                        <span className="uppercase tracking-wider text-white/90">(© 2025 FRADIUM)</span>
                    </div>
                    <a href="#report" className="uppercase tracking-wider text-white/90 hover:text-white">(VIEW REPORT)</a>
                    <a href="#products" className="uppercase tracking-wider text-white/90 hover:text-white">(PRODUCTS)</a>
                    <a href="#docs" className="uppercase tracking-wider text-white/90 hover:text-white sm:text-right">(DOCUMENTATION)</a>
                </div>
            </div>
        </footer>
    );
}


