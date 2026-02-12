import React, { useEffect } from 'react';
import { StarBackground } from '../components/ui/StarBackground';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Pricing } from '../components/landing/Pricing';
import { Footer } from '../components/landing/Footer';
import { FAQ } from '../components/landing/FAQ';

export const LandingPage = () => {
    useEffect(() => {
        // Ensure scroll to top on load
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-slate-950 min-h-screen relative font-sans antialiased selection:bg-cyan-500/30">
            <StarBackground />

            <main className="relative z-10">
                <Hero />
                <Features />
                <FAQ />
                <Pricing />
            </main>

            <Footer />
        </div>
    );
};
