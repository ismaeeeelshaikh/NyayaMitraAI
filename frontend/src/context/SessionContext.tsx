import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { Session } from '../types';

const SESSION_STORAGE_KEY = 'nyaya_mitra_session';

export const clearStoredSession = () => {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // Ignore storage access errors in restricted environments.
    }
};

interface SessionCtx {
    session: Session | null;
    setSession: React.Dispatch<React.SetStateAction<Session | null>>;
    isGuest: boolean;
    queriesLeft: number;
}

const SessionContext = createContext<SessionCtx | null>(null);

const loadSession = (): Session | null => {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as Session;
    } catch {
        return null;
    }
};

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(() => loadSession());

    useEffect(() => {
        if (session) {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } else {
            clearStoredSession();
        }
    }, [session]);

    const value = useMemo<SessionCtx>(() => ({
        session,
        setSession,
        isGuest: session?.anonymous_mode ?? true,
        queriesLeft: session?.query_limit_remaining ?? 5,
    }), [session]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be inside SessionProvider');
    return ctx;
};
