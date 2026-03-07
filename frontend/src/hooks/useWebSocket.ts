import { useState, useRef, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';

const WS_URL = import.meta.env.VITE_WEBSOCKET_URL;

export interface WebSocketPayload {
    error?: string;
    error_code?: string;
    message?: string;
    message_id?: string;
    answer?: string;
    timestamp?: string;
    confidence_score?: number;
    confidence_label?: string;
    confidence_color?: 'green' | 'teal' | 'yellow' | 'orange';
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
    risk_score?: number;
    citations?: ChatMessage['citations'];
    recommended_actions?: ChatMessage['recommended_actions'];
    crisis_resources?: ChatMessage['crisis_resources'];
    queries_used?: number;
    queries_remaining?: number;
    queries_limit?: number;
}

export function useWebSocket(
    sessionId: string,
    onError?: (error: WebSocketPayload) => void,
    onServerMessage?: (data: WebSocketPayload) => void
) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);

    const connect = useCallback(() => {
        if (!sessionId) return;
        if (wsRef.current?.readyState === WebSocket.OPEN) return;

        const ws = new WebSocket(`${WS_URL}?session_id=${sessionId}`);
        wsRef.current = ws;

        ws.onopen = () => { setConnected(true); console.log('WS connected'); };
        ws.onclose = () => { setConnected(false); setLoading(false); };
        ws.onerror = () => { setConnected(false); setLoading(false); };

        ws.onmessage = (event) => {
            setLoading(false);
            try {
                const data = JSON.parse(event.data) as WebSocketPayload;
                onServerMessage?.(data);

                // Error / limit response
                if (data.error || data.error_code) {
                    onError?.(data);
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        sender: 'system',
                        text: data.message || data.error || 'Unexpected error from server.',
                        timestamp: new Date().toISOString(),
                    }]);
                    return;
                }

                // Normal AI response — set isStreaming for typewriter effect
                setMessages(prev => [...prev, {
                    id: data.message_id || Date.now().toString(),
                    sender: 'assistant',
                    text: data.answer || '',
                    timestamp: data.timestamp || new Date().toISOString(),
                    isStreaming: true,
                    confidence_score: data.confidence_score,
                    confidence_label: data.confidence_label,
                    confidence_color: data.confidence_color,
                    risk_level: data.risk_level,
                    risk_score: data.risk_score,
                    citations: data.citations || [],
                    recommended_actions: data.recommended_actions || [],
                    crisis_resources: data.crisis_resources,
                }]);
            } catch {
                console.error('WS JSON parse error');
            }
        };
    }, [onError, onServerMessage, sessionId]);

    const sendMessage = useCallback((text: string, language: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const msgId = Date.now().toString();
        setMessages(prev => [...prev, {
            id: msgId, sender: 'user', text, timestamp: new Date().toISOString()
        }]);
        setLoading(true);
        wsRef.current.send(JSON.stringify({
            action: 'sendMessage', session_id: sessionId, message_id: msgId, text, language
        }));
    }, [sessionId]);

    const markStreamingDone = useCallback((msgId: string) => {
        setMessages(prev => prev.map(m =>
            m.id === msgId ? { ...m, isStreaming: false } : m
        ));
    }, []);

    useEffect(() => {
        connect();
        return () => wsRef.current?.close();
    }, [connect]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    return { messages, setMessages, connected, loading, sendMessage, markStreamingDone, clearMessages };
}
