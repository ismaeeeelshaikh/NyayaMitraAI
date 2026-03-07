import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * ChatGPT-style typewriter hook.
 * Feed it the full text + a streaming flag → it reveals word-by-word.
 */
export function useTypewriter(
    fullText: string,
    isStreaming: boolean,
    speed: number = 30          // ms per word
) {
    const [displayedText, setDisplayedText] = useState('');
    const [isDone, setIsDone] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const indexRef = useRef(0);

    // Split into words once
    const wordsRef = useRef<string[]>([]);

    const cleanup = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    useEffect(() => {
        // If not streaming, show full text immediately
        if (!isStreaming) {
            cleanup();
            setDisplayedText(fullText);
            setIsDone(true);
            return;
        }

        // Start streaming
        wordsRef.current = fullText.split(/(\s+)/);   // keep whitespace
        indexRef.current = 0;
        setDisplayedText('');
        setIsDone(false);

        timerRef.current = setInterval(() => {
            indexRef.current += 1;
            const slice = wordsRef.current.slice(0, indexRef.current).join('');
            setDisplayedText(slice);

            if (indexRef.current >= wordsRef.current.length) {
                cleanup();
                setIsDone(true);
            }
        }, speed);

        return cleanup;
    }, [fullText, isStreaming, speed, cleanup]);

    return { displayedText, isDone };
}
