import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

export interface Conversation {
    id: string;
    title: string;
    messages: ChatMessage[];
    createdAt: string;
    updatedAt: string;
}

const STORAGE_PREFIX = 'nyaya-chats';

function getStorageKey(sessionId: string) {
    return `${STORAGE_PREFIX}-${sessionId}`;
}

function loadConversations(sessionId: string): Conversation[] {
    try {
        const raw = localStorage.getItem(getStorageKey(sessionId));
        if (!raw) return [];
        return JSON.parse(raw) as Conversation[];
    } catch {
        return [];
    }
}

function persistConversations(sessionId: string, convos: Conversation[]) {
    try {
        localStorage.setItem(getStorageKey(sessionId), JSON.stringify(convos));
    } catch {
        console.error('Failed to save conversations to localStorage');
    }
}

function generateTitle(messages: ChatMessage[]): string {
    const firstUserMsg = messages.find(m => m.sender === 'user');
    if (!firstUserMsg) return 'New Consultation';
    const text = firstUserMsg.text.trim();
    return text.length > 45 ? text.slice(0, 42) + '...' : text;
}

function createId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function useConversations(sessionId: string) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const initialized = useRef(false);
    // Flag to suppress auto-save during conversation switching
    const isSwitchingRef = useRef(false);

    // Load from localStorage on mount
    useEffect(() => {
        if (!sessionId || initialized.current) return;
        initialized.current = true;
        const saved = loadConversations(sessionId);
        setConversations(saved);
        if (saved.length > 0) {
            setActiveId(saved[0].id);
        } else {
            const newConvo: Conversation = {
                id: createId(),
                title: 'New Consultation',
                messages: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setConversations([newConvo]);
            setActiveId(newConvo.id);
            persistConversations(sessionId, [newConvo]);
        }
    }, [sessionId]);

    // Get active conversation's messages
    const activeConversation = conversations.find(c => c.id === activeId) || null;

    // Save messages for active conversation (called explicitly, not via useEffect)
    const saveMessages = useCallback((messages: ChatMessage[]) => {
        if (!activeId || !sessionId || isSwitchingRef.current) return;
        setConversations(prev => {
            const updated = prev.map(c => {
                if (c.id !== activeId) return c;
                return {
                    ...c,
                    messages: messages.map(m => ({ ...m, isStreaming: false })),
                    title: messages.length > 0 ? generateTitle(messages) : c.title,
                    updatedAt: new Date().toISOString(),
                };
            });
            updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            persistConversations(sessionId, updated);
            return updated;
        });
    }, [activeId, sessionId]);

    // Save current messages before switching away (used by ChatPage)
    const saveBeforeSwitch = useCallback((currentMessages: ChatMessage[]) => {
        if (!activeId || !sessionId) return;
        setConversations(prev => {
            let updated = prev.map(c => {
                if (c.id !== activeId) return c;
                return {
                    ...c,
                    messages: currentMessages.map(m => ({ ...m, isStreaming: false })),
                    title: currentMessages.length > 0 ? generateTitle(currentMessages) : c.title,
                    updatedAt: new Date().toISOString(),
                };
            });
            // Remove the old active conversation if it has no messages (empty "New Consultation")
            const oldConvo = updated.find(c => c.id === activeId);
            if (oldConvo && oldConvo.messages.length === 0) {
                updated = updated.filter(c => c.id !== activeId);
            }
            updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            persistConversations(sessionId, updated);
            return updated;
        });
    }, [activeId, sessionId]);

    // Create a new conversation
    const createConversation = useCallback(() => {
        const newConvo: Conversation = {
            id: createId(),
            title: 'New Consultation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        isSwitchingRef.current = true;
        setConversations(prev => {
            const updated = [newConvo, ...prev];
            persistConversations(sessionId, updated);
            return updated;
        });
        setActiveId(newConvo.id);
        // Reset switching flag after state settles
        setTimeout(() => { isSwitchingRef.current = false; }, 100);
        return newConvo.id;
    }, [sessionId]);

    // Switch to an existing conversation
    const switchConversation = useCallback((id: string) => {
        isSwitchingRef.current = true;
        setActiveId(id);
        setTimeout(() => { isSwitchingRef.current = false; }, 100);
    }, []);

    // Delete a conversation
    const deleteConversation = useCallback((id: string) => {
        setConversations(prev => {
            let updated = prev.filter(c => c.id !== id);
            if (id === activeId) {
                if (updated.length > 0) {
                    setActiveId(updated[0].id);
                } else {
                    const newConvo: Conversation = {
                        id: createId(),
                        title: 'New Consultation',
                        messages: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    };
                    updated = [newConvo];
                    setActiveId(newConvo.id);
                }
            }
            persistConversations(sessionId, updated);
            return updated;
        });
    }, [sessionId, activeId]);

    return {
        conversations,
        activeId,
        activeConversation,
        saveMessages,
        saveBeforeSwitch,
        createConversation,
        switchConversation,
        deleteConversation,
        isSwitchingRef,
    };
}
