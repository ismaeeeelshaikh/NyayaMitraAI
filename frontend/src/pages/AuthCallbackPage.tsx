import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { useSession } from '../context/SessionContext';
import {
    clearPkceState,
    exchangeAuthCode,
    getPkceState,
    parseIdTokenClaims,
    saveAuthTokens,
} from '../auth/cognito';

const API = import.meta.env.VITE_HTTP_API_URL;

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { language } = useLanguage();
    const { setSession } = useSession();
    const [error, setError] = useState('');

    useEffect(() => {
        const completeLogin = async () => {
            const code = searchParams.get('code') || '';
            const returnedState = searchParams.get('state') || '';
            if (!code) {
                setError('Authorization code missing from callback URL.');
                return;
            }

            const { codeVerifier, state } = getPkceState();
            if (!codeVerifier || !state || state !== returnedState) {
                setError('Invalid OAuth state. Please login again.');
                clearPkceState();
                return;
            }

            try {
                const tokens = await exchangeAuthCode({ code, codeVerifier });
                saveAuthTokens(tokens);

                const claims = parseIdTokenClaims(tokens.id_token);
                const userId = claims.email || claims.sub || '';
                if (!userId) {
                    throw new Error('Could not identify authenticated user.');
                }

                const { data } = await axios.post(`${API}/v1/entry/session`, {
                    language_code: language,
                    mode_selection: 'chat',
                    anonymous_mode: false,
                    user_id: userId,
                });

                setSession(data);
                clearPkceState();
                navigate('/dashboard', { replace: true });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
                clearPkceState();
            }
        };

        completeLogin();
    }, [language, navigate, searchParams, setSession]);

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#0D1220] border border-[#1E293B] rounded-3xl p-8 text-center">
                {!error ? (
                    <>
                        <div className="w-10 h-10 border-4 border-[#E87D20] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <h1 className="text-xl font-bold">Completing secure login...</h1>
                        <p className="text-[#8B95A5] mt-2">Please wait while we verify your session.</p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold text-red-400">Login failed</h1>
                        <p className="text-[#8B95A5] mt-2">{error}</p>
                        <button
                            onClick={() => navigate('/login', { replace: true })}
                            className="mt-6 px-5 py-2 rounded-xl bg-[#E87D20] text-white font-bold"
                        >
                            Go back to login
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
