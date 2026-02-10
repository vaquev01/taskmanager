import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { Menu } from 'lucide-react';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="flex w-full h-screen bg-[var(--bg-app)] overflow-hidden">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 flex flex-col h-full relative overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden sticky top-0 z-30 flex items-center justify-between p-4 bg-[var(--bg-app)]/80 backdrop-blur-xl border-b border-[var(--glass-border)]">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="p-2.5 rounded-xl bg-[var(--glass-surface)] text-white border border-[var(--glass-border)] hover:bg-[var(--glass-surface-hover)] transition-all"
                    >
                        <Menu size={20} />
                    </button>
                    <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">TaskFlow</span>
                    <div className="w-10" />
                </div>

                <div className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
