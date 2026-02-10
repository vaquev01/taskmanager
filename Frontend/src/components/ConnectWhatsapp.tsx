import { useEffect, useState } from 'react';
import api from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

export const ConnectWhatsapp = () => {
    const [status, setStatus] = useState<{ isReady: boolean; qrCode: string | null }>({ isReady: false, qrCode: null });

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data } = await api.get('/whatsapp/status');
                setStatus(data);
            } catch (error) {
                console.error("Failed to fetch WhatsApp status", error);
            }
        };

        const interval = setInterval(fetchStatus, 3000);
        fetchStatus();
        return () => clearInterval(interval);
    }, []);

    if (status.isReady) {
        return (
            <div className="card flex items-center gap-4 border-l-4 border-l-[var(--success)]">
                <div className="p-2 bg-[var(--success)] bg-opacity-20 rounded-full text-[var(--success)]">
                    📱
                </div>
                <div>
                    <h3 className="text-xl">WhatsApp Conectado</h3>
                    <p className="text-muted">Bot está ativo e ouvindo mensagens.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <h3 className="text-xl mb-4">Conectar WhatsApp</h3>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg">
                {status.qrCode ? (
                    <>
                        <QRCodeSVG value={status.qrCode} size={256} />
                        <p className="text-black mt-4 text-center">Escaneie com seu WhatsApp<br />(Aparelhos Conectados)</p>
                    </>
                ) : (
                    <div className="text-black">Aguardando QR Code...</div>
                )}
            </div>
        </div>
    );
};
