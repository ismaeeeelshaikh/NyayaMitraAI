import React, { createContext, useContext, useState } from 'react';
import type { Session } from '../types';

interface SessionCtx {
    session: Session | null;
    setSession: (s: Session | null) => void;
    isGuest: boolean;
    queriesLeft: number;
}

const SessionContext = createContext<SessionCtx | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    return (
        <SessionContext.Provider value={{
            session,
            setSession,
            isGuest: session?.anonymous_mode ?? true,
            queriesLeft: session?.query_limit_remaining ?? 5,
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error('useSession must be inside SessionProvider');
    return ctx;
};
