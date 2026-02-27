import { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;

export function useVoice(sessionId: string, language: string) {
    const [isRecording, setIsRecording] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const mrRef = useRef<MediaRecorder | null>(null);
    const chunks = useRef<Blob[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mrRef.current = mr;
            chunks.current = [];
            mr.ondataavailable = e => { if (e.data.size > 0) chunks.current.push(e.data); };
            mr.start(250);
            setIsRecording(true);
        } catch (e) {
            alert('Mic access denied. Please allow microphone access in browser settings.');
        }
    };

    const stopRecording = (): Promise<string> => {
        return new Promise(resolve => {
            const mr = mrRef.current;
            if (!mr) return resolve('');

            mr.onstop = async () => {
                setIsRecording(false);
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const b64 = (reader.result as string).split(',')[1];
                        const resp = await axios.post(`${API}/v1/voice/input`, {
                            audio_data: b64, language, session_id: sessionId
                        });
                        // Poll for transcript (simplified — 3 seconds wait)
                        await new Promise(r => setTimeout(r, 3000));
                        resolve(resp.data.job_name ? 'Voice input received (processing)' : '');
                    } catch { resolve(''); }
                };
                reader.readAsDataURL(blob);
                mr.stream.getTracks().forEach(t => t.stop());
            };
            mr.stop();
        });
    };

    const speakText = async (text: string) => {
        setIsSpeaking(true);
        try {
            const { data } = await axios.post(`${API}/v1/voice/output`, { text, language });
            const bytes = Uint8Array.from(atob(data.audio_base64), c => c.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => { setIsSpeaking(false); URL.revokeObjectURL(url); };
            audioRef.current.play();
        } catch { setIsSpeaking(false); }
    };

    const stopSpeaking = () => { audioRef.current?.pause(); setIsSpeaking(false); };

    return { isRecording, isSpeaking, startRecording, stopRecording, speakText, stopSpeaking };
}
