import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CopyrightFooter from './CopyrightFooter';
import { motion, AnimatePresence } from 'framer-motion';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Abstract Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
                </div>

                <main className="flex-1 overflow-hidden z-10 p-6 relative">
                    <AnimatePresence mode="wait">
                        <Outlet />
                    </AnimatePresence>
                </main>

                <CopyrightFooter className="bg-slate-900/50 border-t border-slate-800/50 backdrop-blur-sm" />
            </div>
        </div>
    );
}
