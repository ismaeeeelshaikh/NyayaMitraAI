interface CognitoConfig {
    domain: string;
    clientId: string;
    region: string;
    redirectUri: string;
    logoutUri: string;
}

interface BuildAuthUrlParams {
    codeChallenge: string;
    state: string;
    screenHint?: 'signup';
    loginHint?: string;
}

interface ExchangeAuthCodeParams {
    code: string;
    codeVerifier: string;
}

export interface CognitoTokens {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    token_type: string;
    expires_in: number;
}

interface SignUpParams {
    email: string;
    password: string;
    name?: string;
}

interface SignUpResult {
    userConfirmed: boolean;
    userSub: string;
    username: string;
    deliveryDestination?: string;
}

interface ForgotPasswordStartResult {
    deliveryDestination?: string;
}

const CODE_VERIFIER_KEY = 'nyaya_mitra_code_verifier';
const OAUTH_STATE_KEY = 'nyaya_mitra_oauth_state';
const TOKEN_STORAGE_KEY = 'nyaya_mitra_auth_tokens';

const toBase64Url = (bytes: Uint8Array): string =>
    btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const toUtf8 = (input: string): Uint8Array =>
    new TextEncoder().encode(input);

const normalizeDomain = (raw: string): string => {
    const trimmed = raw.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('http://')) return trimmed.replace('http://', 'https://');
    return `https://${trimmed}`;
};

export const getCognitoConfig = (): CognitoConfig | null => {
    const domain = normalizeDomain(import.meta.env.VITE_COGNITO_DOMAIN || '');
    const clientId = (import.meta.env.VITE_COGNITO_CLIENT_ID || '').trim();
    const region = (import.meta.env.VITE_AWS_REGION || 'ap-south-1').trim();
    if (!domain || !clientId) {
        return null;
    }

    return {
        domain,
        clientId,
        region,
        redirectUri: (import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/callback`).trim(),
        logoutUri: (import.meta.env.VITE_COGNITO_LOGOUT_URI || `${window.location.origin}/`).trim(),
    };
};

const parseErrorMessage = (payload: unknown, fallback: string): string => {
    if (!payload || typeof payload !== 'object') return fallback;
    const data = payload as Record<string, unknown>;
    if (typeof data.message === 'string' && data.message.trim()) return data.message.trim();
    if (typeof data.Message === 'string' && data.Message.trim()) return data.Message.trim();
    return fallback;
};

const callCognitoIdp = async <T>(
    config: CognitoConfig,
    action: string,
    body: Record<string, unknown>
): Promise<T> => {
    const endpoint = `https://cognito-idp.${config.region}.amazonaws.com/`;
    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': `AWSCognitoIdentityProviderService.${action}`,
        },
        body: JSON.stringify(body),
    });

    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(parseErrorMessage(payload, `Cognito ${action} failed.`));
    }

    return payload as T;
};

const toTokenShape = (auth: Record<string, unknown>): CognitoTokens => {
    const idToken = typeof auth.IdToken === 'string' ? auth.IdToken : '';
    const accessToken = typeof auth.AccessToken === 'string' ? auth.AccessToken : '';

    if (!idToken || !accessToken) {
        throw new Error('Cognito authentication did not return valid tokens.');
    }

    return {
        access_token: accessToken,
        id_token: idToken,
        refresh_token: typeof auth.RefreshToken === 'string' ? auth.RefreshToken : undefined,
        token_type: typeof auth.TokenType === 'string' ? auth.TokenType : 'Bearer',
        expires_in: typeof auth.ExpiresIn === 'number' ? auth.ExpiresIn : 3600,
    };
};

const buildUsernameFromEmail = (email: string): string => {
    const normalized = email.trim().toLowerCase();
    const slug = normalized.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    // Small deterministic hash to avoid collisions for similar local parts.
    let hash = 2166136261;
    for (let i = 0; i < normalized.length; i++) {
        hash ^= normalized.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    const suffix = (hash >>> 0).toString(36);
    return `u_${(slug || 'user').slice(0, 24)}_${suffix}`;
};

const randomString = (length: number): string => {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes).slice(0, length);
};

const sha256 = async (value: string): Promise<Uint8Array> => {
    const digest = await crypto.subtle.digest('SHA-256', toUtf8(value) as unknown as BufferSource);
    return new Uint8Array(digest);
};

export const createPkce = async (): Promise<{ codeVerifier: string; codeChallenge: string }> => {
    const codeVerifier = randomString(64);
    const codeChallenge = toBase64Url(await sha256(codeVerifier));
    return { codeVerifier, codeChallenge };
};

export const buildAuthUrl = (params: BuildAuthUrlParams): string => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    const query = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        code_challenge_method: 'S256',
        code_challenge: params.codeChallenge,
        state: params.state,
    });

    if (params.screenHint === 'signup') {
        query.set('screen_hint', 'signup');
    }
    if (params.loginHint) {
        query.set('login_hint', params.loginHint);
    }

    return `${config.domain}/oauth2/authorize?${query.toString()}`;
};

export const exchangeAuthCode = async (params: ExchangeAuthCodeParams): Promise<CognitoTokens> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        code: params.code,
        code_verifier: params.codeVerifier,
    });

    const response = await fetch(`${config.domain}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(`Cognito token exchange failed: ${message}`);
    }

    return response.json();
};

export const signInWithPassword = async (email: string, password: string): Promise<CognitoTokens> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    const response = await callCognitoIdp<Record<string, unknown>>(config, 'InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.clientId,
        AuthParameters: {
            USERNAME: email.trim(),
            PASSWORD: password,
        },
    });

    if (typeof response.ChallengeName === 'string' && response.ChallengeName) {
        throw new Error(`Additional auth challenge required: ${response.ChallengeName}`);
    }

    const authResult = (response.AuthenticationResult as Record<string, unknown>) || {};
    return toTokenShape(authResult);
};

export const signUpWithPassword = async (params: SignUpParams): Promise<SignUpResult> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    const attributes = [
        { Name: 'email', Value: params.email.trim() },
    ];

    if (params.name?.trim()) {
        attributes.push({ Name: 'name', Value: params.name.trim() });
    }

    const username = buildUsernameFromEmail(params.email);
    const response = await callCognitoIdp<Record<string, unknown>>(config, 'SignUp', {
        ClientId: config.clientId,
        Username: username,
        Password: params.password,
        UserAttributes: attributes,
    });

    const codeDelivery = (response.CodeDeliveryDetails as Record<string, unknown>) || {};
    return {
        userConfirmed: Boolean(response.UserConfirmed),
        userSub: typeof response.UserSub === 'string' ? response.UserSub : '',
        username,
        deliveryDestination: typeof codeDelivery.Destination === 'string' ? codeDelivery.Destination : undefined,
    };
};

export const confirmSignUpCode = async (email: string, code: string): Promise<void> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    await callCognitoIdp<Record<string, unknown>>(config, 'ConfirmSignUp', {
        ClientId: config.clientId,
        Username: email.trim(),
        ConfirmationCode: code.trim(),
    });
};

export const startForgotPassword = async (username: string): Promise<ForgotPasswordStartResult> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    const response = await callCognitoIdp<Record<string, unknown>>(config, 'ForgotPassword', {
        ClientId: config.clientId,
        Username: username.trim(),
    });

    const delivery = (response.CodeDeliveryDetails as Record<string, unknown>) || {};
    return {
        deliveryDestination: typeof delivery.Destination === 'string' ? delivery.Destination : undefined,
    };
};

export const confirmForgotPassword = async (
    username: string,
    confirmationCode: string,
    newPassword: string
): Promise<void> => {
    const config = getCognitoConfig();
    if (!config) {
        throw new Error('Cognito is not configured in frontend environment variables.');
    }

    await callCognitoIdp<Record<string, unknown>>(config, 'ConfirmForgotPassword', {
        ClientId: config.clientId,
        Username: username.trim(),
        ConfirmationCode: confirmationCode.trim(),
        Password: newPassword,
    });
};

export const parseIdTokenClaims = (idToken: string): Record<string, string> => {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid id_token');
    }

    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(payload.padEnd(payload.length + (4 - (payload.length % 4 || 4)), '='));
    return JSON.parse(decoded);
};

export const buildLogoutUrl = (logoutUriOverride?: string): string | null => {
    const config = getCognitoConfig();
    if (!config) {
        return null;
    }

    const logoutUri = (logoutUriOverride || config.logoutUri || '').trim();
    if (!logoutUri) {
        return null;
    }

    const query = new URLSearchParams({
        client_id: config.clientId,
        logout_uri: logoutUri,
        redirect_uri: logoutUri,
    });
    return `${config.domain}/logout?${query.toString()}`;
};

export const savePkceState = (codeVerifier: string, state: string) => {
    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);
};

export const getPkceState = (): { codeVerifier: string; state: string } => {
    return {
        codeVerifier: sessionStorage.getItem(CODE_VERIFIER_KEY) || '',
        state: sessionStorage.getItem(OAUTH_STATE_KEY) || '',
    };
};

export const clearPkceState = () => {
    sessionStorage.removeItem(CODE_VERIFIER_KEY);
    sessionStorage.removeItem(OAUTH_STATE_KEY);
};

export const saveAuthTokens = (tokens: CognitoTokens) => {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearAuthTokens = () => {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};
