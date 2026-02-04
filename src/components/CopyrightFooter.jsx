import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function CopyrightFooter({ className = "" }) {
    return (
        <div className={`w-full text-center py-4 text-xs z-50 ${className}`}>
            <a
                href="https://mathiyass.github.io/MAportfolio/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-400 transition-colors font-medium group"
            >
                <span>&copy; {new Date().getFullYear()} Mathisha Angirasa (MATHIYA)</span>
                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-y-[1px]" />
            </a>
        </div>
    );
}
