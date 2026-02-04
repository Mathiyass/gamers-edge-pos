import React from 'react';
import { cn } from './Card';

const Input = ({ label, icon: Icon, className, error, ...props }) => {
    return (
        <div className={cn("space-y-1.5", className)}>
            {label && (
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    className={cn(
                        "w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-100 placeholder:text-slate-600 outline-none transition-all duration-200",
                        "focus:border-cyan-500/50 focus:bg-slate-900 focus:shadow-[0_0_15px_rgba(6,182,212,0.1)]",
                        Icon && "pl-10",
                        error && "border-red-500/50 focus:border-red-500 text-red-100"
                    )}
                    {...props}
                />
            </div>
            {error && (
                <p className="text-xs text-red-400 ml-1">{error}</p>
            )}
        </div>
    );
};

export default Input;
