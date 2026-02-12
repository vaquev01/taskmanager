import { useEffect } from 'react';
import { AdMob, BannerAdSize, BannerAdPosition, BannerAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

export const AdMobBanner = () => {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const showBanner = async () => {
            try {
                // Listen for Ad events
                AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
                    console.log('Banner Ad Loaded');
                });

                const options = {
                    adId: 'ca-app-pub-3940256099942544/6300978111', // Test ID
                    adSize: BannerAdSize.BANNER,
                    position: BannerAdPosition.BOTTOM_CENTER,
                    margin: 0,
                    isTesting: true
                };

                await AdMob.showBanner(options);
            } catch (e) {
                console.error('Failed to show banner:', e);
            }
        };

        showBanner();

        return () => {
            if (Capacitor.isNativePlatform()) {
                AdMob.hideBanner().catch(console.error);
                AdMob.removeBanner().catch(console.error);
            }
        };
    }, []);

    return null; // Banner is native overlay, no DOM element needed
};
