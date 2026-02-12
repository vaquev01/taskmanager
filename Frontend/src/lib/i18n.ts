import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
    pt: {
        translation: {
            "sidebar": {
                "dashboard": "Dashboard",
                "calendar": "Calendário",
                "team": "Equipe",
                "settings": "Configurações",
                "logout": "Sair",
                "connect_ws": "Conectar WhatsApp"
            },
            "hero": {
                "badge": "O Futuro da Produtividade",
                "title": "Seu Segundo Cérebro",
                "subtitle": "Turbinado por IA",
                "desc": "Gerencie tarefas pelo WhatsApp, converse com personas e deixe a IA organizar sua vida.",
                "cta_start": "Começar Agora Gratuitamente",
                "cta_features": "Ver Funcionalidades"
            },
            "common": {
                "loading": "Carregando...",
                "error": "Ocorreu um erro",
                "success": "Sucesso",
                "premium_upgrade": "Remover Anúncios"
            }
        }
    },
    en: {
        translation: {
            "sidebar": {
                "dashboard": "Dashboard",
                "calendar": "Calendar",
                "team": "Team",
                "settings": "Settings",
                "logout": "Logout",
                "connect_ws": "Connect WhatsApp"
            },
            "hero": {
                "badge": "The Future of Productivity",
                "title": "Your Second Brain",
                "subtitle": "Powered by AI",
                "desc": "Manage tasks via WhatsApp, chat with personas, and let AI organize your life.",
                "cta_start": "Start Now for Free",
                "cta_features": "See Features"
            },
            "common": {
                "loading": "Loading...",
                "error": "An error occurred",
                "success": "Success",
                "premium_upgrade": "Remove Ads"
            }
        }
    },
    es: {
        translation: {
            "sidebar": {
                "dashboard": "Tablero",
                "calendar": "Calendario",
                "team": "Equipo",
                "settings": "Ajustes",
                "logout": "Cerrar Sesión",
                "connect_ws": "Conectar WhatsApp"
            },
            "hero": {
                "badge": "El Futuro de la Productividad",
                "title": "Tu Segundo Cerebro",
                "subtitle": "Impulsado por IA",
                "desc": "Gestiona tareas por WhatsApp, chatea con personas y deja que la IA organice tu vida.",
                "cta_start": "Empezar Gratis Ahora",
                "cta_features": "Ver Funcionalidades"
            },
            "common": {
                "loading": "Cargando...",
                "error": "Ocurrió un error",
                "success": "Éxito",
                "premium_upgrade": "Eliminar Anuncios"
            }
        }
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false
        }
    });

export default i18n;
