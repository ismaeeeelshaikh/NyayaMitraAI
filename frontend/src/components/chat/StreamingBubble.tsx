import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useTypewriter } from '../../hooks/useTypewriter';
import type { ChatMessage } from '../../types';

interface Props {
    msg: ChatMessage;
    onStreamingDone: (id: string) => void;
    formatText: (text: string) => ReactNode[];
}

/**
 * Renders an assistant message with a ChatGPT-like word-by-word reveal.
 * Once done, it calls onStreamingDone so badges/citations can appear.
 */
export default function StreamingBubble({ msg, onStreamingDone, formatText }: Props) {
    const { displayedText, isDone } = useTypewriter(
        msg.text,
        !!msg.isStreaming,
        30
    );

    useEffect(() => {
        if (isDone && msg.isStreaming) {
            onStreamingDone(msg.id);
        }
    }, [isDone, msg.id, msg.isStreaming, onStreamingDone]);

    return (
        <>
            {formatText(displayedText)}
            {msg.isStreaming && !isDone && (
                <span className="inline-block w-2 h-4 bg-[#E87D20] animate-pulse ml-0.5 rounded-sm align-middle" />
            )}
        </>
    );
}
