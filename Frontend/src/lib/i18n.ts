import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptJSON from '../locales/pt.json';
import enJSON from '../locales/en.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            pt: { ...ptJSON },
            en: { ...enJSON },
        },
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false,
        },
    });

export default i18n;
