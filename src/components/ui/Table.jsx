import React from 'react';
import { cn } from './Card';

export const Table = ({ children, className }) => (
    <div className={cn("w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm", className)}>
        <table className="w-full text-left text-sm">
            {children}
        </table>
    </div>
);

export const TableHeader = ({ children }) => (
    <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase text-xs font-bold tracking-wider">
        {children}
    </thead>
);

export const TableBody = ({ children }) => (
    <tbody className="divide-y divide-slate-800">
        {children}
    </tbody>
);

export const TableRow = ({ children, className, onClick }) => (
    <tr
        onClick={onClick}
        className={cn(
            "transition-colors hover:bg-slate-800/50",
            onClick && "cursor-pointer active:bg-slate-800",
            className
        )}
    >
        {children}
    </tr>
);

export const TableHead = ({ children, className }) => (
    <th className={cn("px-4 py-3 font-medium", className)}>
        {children}
    </th>
);

export const TableCell = ({ children, className }) => (
    <td className={cn("px-4 py-3 text-slate-300", className)}>
        {children}
    </td>
);
