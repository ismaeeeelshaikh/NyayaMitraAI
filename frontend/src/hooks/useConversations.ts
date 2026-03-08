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

function getStorageKey(storageKey: string) {
    return `${STORAGE_PREFIX}-${storageKey}`;
}

function normalizeMessages(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(m => ({ ...m, isStreaming: false }));
}

function hasUserPrompt(messages: ChatMessage[]): boolean {
    return messages.some(m => m.sender === 'user' && m.text.trim().length > 0);
}

function sortByUpdatedAt(convos: Conversation[]): Conversation[] {
    return [...convos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

function sanitizeConversations(convos: Conversation[]): Conversation[] {
    return sortByUpdatedAt(
        convos
            .filter(c => hasUserPrompt(c.messages))
            .map(c => ({
                ...c,
                title: generateTitle(c.messages),
                messages: normalizeMessages(c.messages),
            }))
    );
}

function loadConversations(storageKey: string): Conversation[] {
    try {
        const raw = localStorage.getItem(getStorageKey(storageKey));
        if (!raw) return [];
        return sanitizeConversations(JSON.parse(raw) as Conversation[]);
    } catch {
        return [];
    }
}

function persistConversations(storageKey: string, convos: Conversation[]) {
    try {
        localStorage.setItem(getStorageKey(storageKey), JSON.stringify(sanitizeConversations(convos)));
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

function makeConversationFromMessages(messages: ChatMessage[]): Conversation {
    const now = new Date().toISOString();
    return {
        id: createId(),
        title: generateTitle(messages),
        messages: normalizeMessages(messages),
        createdAt: now,
        updatedAt: now,
    };
}

export function useConversations(storageKey: string) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const lastKeyRef = useRef<string>('');
    const canPersist = Boolean(storageKey);
    // Use a ref to always have the latest activeId available in callbacks
    const activeIdRef = useRef<string | null>(null);
    activeIdRef.current = activeId;

    // Flag to suppress auto-save during conversation switching
    const isSwitchingRef = useRef(false);

    // Load from localStorage on mount or when storage key changes
    useEffect(() => {
        if (!canPersist) {
            lastKeyRef.current = '';
            setConversations([]);
            setActiveId(null);
            return;
        }
        if (lastKeyRef.current === storageKey) return;
        lastKeyRef.current = storageKey;

        const saved = loadConversations(storageKey);
        setConversations(saved);
        // Always open chat tab on a fresh draft (ChatGPT-like behavior)
        setActiveId(null);
        // Also cleanup previously persisted empty conversations.
        persistConversations(storageKey, saved);
    }, [canPersist, storageKey]);

    // Get active conversation's messages
    const activeConversation = conversations.find(c => c.id === activeId) || null;

    // Save messages for the active conversation - uses ref so no stale closure
    const saveMessages = useCallback((messages: ChatMessage[]) => {
        const currentActiveId = activeIdRef.current;
        if (!canPersist || !storageKey || isSwitchingRef.current) return;

        const shouldPersist = hasUserPrompt(messages);

        // Draft -> first real message: create a persisted conversation.
        if (!currentActiveId) {
            if (!shouldPersist) return;
            const newConvo = makeConversationFromMessages(messages);
            setConversations(prev => {
                const updated = sortByUpdatedAt([newConvo, ...prev]);
                persistConversations(storageKey, updated);
                return updated;
            });
            setActiveId(newConvo.id);
            return;
        }

        setConversations(prev => {
            let updated: Conversation[];

            if (!shouldPersist) {
                updated = prev.filter(c => c.id !== currentActiveId);
            } else {
                updated = prev.map(c => {
                    if (c.id !== currentActiveId) return c;
                    return {
                        ...c,
                        messages: normalizeMessages(messages),
                        title: generateTitle(messages),
                        updatedAt: new Date().toISOString(),
                    };
                });
            }

            updated = sortByUpdatedAt(updated);
            persistConversations(storageKey, updated);
            return updated;
        });

        if (!shouldPersist) {
            setActiveId(null);
        }
    }, [canPersist, storageKey]);

    // Save messages for a specific conversation id (used before switching away)
    const saveForConversation = useCallback((convoId: string, currentMessages: ChatMessage[]) => {
        if (!canPersist || !convoId || !storageKey) return;

        const shouldPersist = hasUserPrompt(currentMessages);

        setConversations(prev => {
            let updated: Conversation[];

            if (!shouldPersist) {
                updated = prev.filter(c => c.id !== convoId);
            } else {
                updated = prev.map(c => {
                    if (c.id !== convoId) return c;
                    return {
                        ...c,
                        messages: normalizeMessages(currentMessages),
                        title: generateTitle(currentMessages),
                        updatedAt: new Date().toISOString(),
                    };
                });
            }

            updated = sortByUpdatedAt(updated);
            persistConversations(storageKey, updated);
            return updated;
        });

        if (!shouldPersist && activeIdRef.current === convoId) {
            setActiveId(null);
        }
    }, [canPersist, storageKey]);

    // Start a new draft conversation and persist current only if it has user content.
    const createConversation = useCallback((currentMessages: ChatMessage[]) => {
        if (!canPersist) {
            setActiveId(null);
            return null;
        }

        const oldActiveId = activeIdRef.current;
        const shouldPersist = hasUserPrompt(currentMessages);

        isSwitchingRef.current = true;

        if (oldActiveId) {
            setConversations(prev => {
                let updated: Conversation[];

                if (!shouldPersist) {
                    updated = prev.filter(c => c.id !== oldActiveId);
                } else {
                    updated = prev.map(c => {
                        if (c.id !== oldActiveId) return c;
                        return {
                            ...c,
                            messages: normalizeMessages(currentMessages),
                            title: generateTitle(currentMessages),
                            updatedAt: new Date().toISOString(),
                        };
                    });
                }

                updated = sortByUpdatedAt(updated);
                persistConversations(storageKey, updated);
                return updated;
            });
        } else if (shouldPersist) {
            const savedFromDraft = makeConversationFromMessages(currentMessages);
            setConversations(prev => {
                const updated = sortByUpdatedAt([savedFromDraft, ...prev]);
                persistConversations(storageKey, updated);
                return updated;
            });
        }

        // Move to a fresh draft (not persisted until user asks something)
        setActiveId(null);
        setTimeout(() => {
            isSwitchingRef.current = false;
        }, 300);

        return null;
    }, [canPersist, storageKey]);

    // Switch to an existing conversation - persists draft only if it has user content.
    const switchConversation = useCallback((id: string, currentMessages: ChatMessage[]) => {
        if (!canPersist) return;

        const oldActiveId = activeIdRef.current;
        if (id === oldActiveId) return;

        const shouldPersist = hasUserPrompt(currentMessages);

        isSwitchingRef.current = true;

        if (oldActiveId) {
            setConversations(prev => {
                let updated: Conversation[];

                if (!shouldPersist) {
                    updated = prev.filter(c => c.id !== oldActiveId);
                } else {
                    updated = prev.map(c => {
                        if (c.id !== oldActiveId) return c;
                        return {
                            ...c,
                            messages: normalizeMessages(currentMessages),
                            title: generateTitle(currentMessages),
                            updatedAt: new Date().toISOString(),
                        };
                    });
                }

                updated = sortByUpdatedAt(updated);
                persistConversations(storageKey, updated);
                return updated;
            });
        } else if (shouldPersist) {
            const savedFromDraft = makeConversationFromMessages(currentMessages);
            setConversations(prev => {
                const updated = sortByUpdatedAt([savedFromDraft, ...prev]);
                persistConversations(storageKey, updated);
                return updated;
            });
        }

        setActiveId(id);
        setTimeout(() => {
            isSwitchingRef.current = false;
        }, 300);
    }, [canPersist, storageKey]);

    // Delete a conversation
    const deleteConversation = useCallback((id: string) => {
        if (!canPersist || !storageKey) return;

        setConversations(prev => {
            const updated = prev.filter(c => c.id !== id);
            persistConversations(storageKey, updated);
            return updated;
        });

        if (id === activeIdRef.current) {
            setActiveId(null);
        }
    }, [canPersist, storageKey]);

    return {
        conversations,
        activeId,
        activeConversation,
        saveMessages,
        saveForConversation,
        createConversation,
        switchConversation,
        deleteConversation,
        isSwitchingRef,
    };
}
