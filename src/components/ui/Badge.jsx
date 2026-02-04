import React from 'react';
import { cn } from './Card';

const variants = {
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    neutral: "bg-slate-700/30 text-slate-400 border-slate-700/50"
};

const Badge = ({ children, variant = 'neutral', className }) => {
    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};

export default Badge;
