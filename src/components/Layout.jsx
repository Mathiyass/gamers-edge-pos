import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import CopyrightFooter from './CopyrightFooter';
import { AnimatePresence } from 'framer-motion';

export default function Layout() {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-[#121212] text-slate-100 font-sans overflow-hidden">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <div className="flex-1 flex flex-col overflow-hidden relative bg-[#121212]">

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
