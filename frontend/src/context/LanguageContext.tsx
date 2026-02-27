import React, { createContext, useContext, useState } from 'react';
import en from '../i18n/en.json';
import hi from '../i18n/hi.json';

type Language = 'en' | 'hi';
interface LangCtx {
    language: Language;
    t: (key: string) => string;
    toggleLang: () => void;
    setLang: (l: Language) => void;
}

const LanguageContext = createContext<LangCtx | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');
    const strings = language === 'hi' ? hi : en;

    // "chat.placeholder" → strings.chat.placeholder
    const t = (key: string): string => {
        const parts = key.split('.');
        let val: any = strings;
        for (const p of parts) val = val?.[p];
        return typeof val === 'string' ? val : key;
    };

    return (
        <LanguageContext.Provider value={{
            language,
            t,
            toggleLang: () => setLanguage(p => p === 'en' ? 'hi' : 'en'),
            setLang: setLanguage
        }}>
            <div className={language === 'hi' ? 'font-hindi' : 'font-sans'}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
    return ctx;
};
