import React, { createContext, useContext, useState, useRef } from 'react';

interface StealthCtx {
    isStealthMode: boolean;
    handleLogoTap: () => void;
    exitStealth: () => void;
}

const StealthContext = createContext<StealthCtx | null>(null);

export function StealthProvider({ children }: { children: React.ReactNode }) {
    const [isStealthMode, setIsStealthMode] = useState(false);
    const tapCount = useRef(0);
    const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleLogoTap = () => {
        tapCount.current += 1;
        if (tapCount.current >= 3) {
            setIsStealthMode(true);
            tapCount.current = 0;
            if (tapTimer.current) clearTimeout(tapTimer.current);
            return;
        }
        if (tapTimer.current) clearTimeout(tapTimer.current);
        tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 1500);
    };

    const exitStealth = () => {
        setIsStealthMode(false);
        tapCount.current = 0;
    };

    return (
        <StealthContext.Provider value={{ isStealthMode, handleLogoTap, exitStealth }}>
            {children}
        </StealthContext.Provider>
    );
}

export const useStealth = () => {
    const ctx = useContext(StealthContext);
    if (!ctx) throw new Error('useStealth must be inside StealthProvider');
    return ctx;
};
