import React from 'react';
import { Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="py-10 border-t border-slate-800 bg-slate-950 text-slate-400 relative z-10">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">TaskFlow</h2>
                    <p className="text-sm">Dominando a produtividade intergaláctica.</p>
                </div>

                <div className="flex gap-6 text-sm">
                    <a href="/terms" className="hover:text-white transition-colors">Termos de Uso</a>
                    <a href="/terms" className="hover:text-white transition-colors">Privacidade</a>
                </div>

                <div className="flex gap-6">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 transition-colors"><Twitter className="w-5 h-5" /></a>
                    <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-purple-400 transition-colors"><Github className="w-5 h-5" /></a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
                </div>

                <div className="text-sm text-slate-500">
                    &copy; 2024 TaskFlow. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
};
