import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

export const ConnectWhatsapp = () => {
    const [status, setStatus] = useState<{ isReady: boolean; qrCode: string | null }>({ isReady: false, qrCode: null });
    const [restarting, setRestarting] = useState(false);
    const [qrAge, setQrAge] = useState(0);
    const lastQr = useRef<string | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const { data } = await api.get('/whatsapp/status');
            if (data.qrCode !== lastQr.current) {
                lastQr.current = data.qrCode;
                setQrAge(0);
            }
            setStatus(data);
            if (data.isReady) setRestarting(false);
        } catch (error) {
            console.error("Failed to fetch WhatsApp status", error);
        }
    }, []);

    useEffect(() => {
        const id = setTimeout(fetchStatus, 0);
        const interval = setInterval(fetchStatus, 2000);
        return () => { clearTimeout(id); clearInterval(interval); };
    }, [fetchStatus]);

    // QR age counter (QR expires every ~20s)
    useEffect(() => {
        if (!status.qrCode) return;
        const timer = setInterval(() => setQrAge(a => a + 1), 1000);
        return () => clearInterval(timer);
    }, [status.qrCode]);

    const handleRestart = async () => {
        setRestarting(true);
        try {
            await api.post('/whatsapp/restart');
        } catch (e) {
            console.error('Restart failed:', e);
        }
    };

    if (status.isReady) {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div>
                    <p className="font-semibold text-green-400 text-sm">WhatsApp Conectado</p>
                    <p className="text-xs text-[var(--text-muted)]">Bot ativo e ouvindo mensagens</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3">
            {status.qrCode ? (
                <>
                    <div className="bg-white p-3 rounded-xl">
                        <QRCodeSVG value={status.qrCode} size={220} />
                    </div>
                    <p className="text-xs text-center text-[var(--text-muted)]">
                        Escaneie com seu WhatsApp &gt; Aparelhos Conectados
                    </p>
                    {qrAge > 15 && (
                        <p className="text-xs text-amber-400 animate-pulse">
                            QR expirando... aguarde o pr&#243;ximo
                        </p>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                    {restarting ? (
                        <>
                            <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-[var(--text-muted)]">Reiniciando cliente...</p>
                        </>
                    ) : (
                        <>
                            <div className="w-8 h-8 border-2 border-[var(--text-dim)] border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs text-[var(--text-muted)]">Aguardando QR Code...</p>
                        </>
                    )}
                </div>
            )}

            {!status.isReady && !restarting && (
                <button
                    onClick={handleRestart}
                    className="text-xs px-4 py-1.5 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-violet-500/30 transition-all"
                >
                    Reconectar WhatsApp
                </button>
            )}
        </div>
    );
};
