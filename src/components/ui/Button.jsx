import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './Card'; // Reusing cn utility

const variants = {
    primary: "bg-cyan-500 hover:bg-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] border-none",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    danger: "bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] border-none",
    ghost: "bg-transparent hover:bg-white/5 text-slate-300 hover:text-white border-transparent",
    outline: "bg-transparent border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-400"
};

const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base",
    icon: "p-2 aspect-square flex items-center justify-center"
};

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    icon: Icon,
    ...props
}) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
                "relative rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed outline-none focus:ring-2 focus:ring-cyan-500/50",
                variants[variant],
                sizes[size],
                className
            )}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && <Icon size={size === 'sm' ? 14 : 18} />}
                    {children}
                </>
            )}
        </motion.button>
    );
};

export default Button;
