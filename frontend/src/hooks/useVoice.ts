import { useState, useRef } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_HTTP_API_URL;
const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS = 2500;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
            mr.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunks.current.push(event.data);
                }
            };
            mr.start(250);
            setIsRecording(true);
        } catch {
            alert('Mic access denied. Please allow microphone access in browser settings.');
        }
    };

    const pollTranscript = async (jobName: string): Promise<string> => {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            try {
                const { data } = await axios.get(`${API}/v1/voice/status`, {
                    params: { job_name: jobName }
                });

                if (data.status === 'completed') {
                    return (data.transcript || '').trim();
                }

                if (data.status === 'failed') {
                    return '';
                }
            } catch {
                // Keep polling until timeout.
            }

            await sleep(POLL_INTERVAL_MS);
        }

        return '';
    };

    const stopRecording = (): Promise<string> => {
        return new Promise(resolve => {
            const mr = mrRef.current;
            if (!mr) {
                resolve('');
                return;
            }

            mr.onstop = async () => {
                setIsRecording(false);
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.onloadend = async () => {
                    try {
                        const b64 = (reader.result as string).split(',')[1];
                        const resp = await axios.post(`${API}/v1/voice/input`, {
                            audio_data: b64,
                            language,
                            session_id: sessionId
                        });

                        const jobName = resp.data?.job_name as string | undefined;
                        if (!jobName) {
                            resolve('');
                            return;
                        }

                        const transcript = await pollTranscript(jobName);
                        resolve(transcript);
                    } catch {
                        resolve('');
                    }
                };
                reader.readAsDataURL(blob);
                mr.stream.getTracks().forEach(track => track.stop());
            };
            mr.stop();
        });
    };

    const speakText = async (text: string) => {
        setIsSpeaking(true);
        try {
            const { data } = await axios.post(`${API}/v1/voice/output`, { text, language });
            const bytes = Uint8Array.from(atob(data.audio_base64), char => char.charCodeAt(0));
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            const url = URL.createObjectURL(blob);
            audioRef.current = new Audio(url);
            audioRef.current.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(url);
            };
            audioRef.current.play();
        } catch {
            setIsSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        audioRef.current?.pause();
        setIsSpeaking(false);
    };

    return { isRecording, isSpeaking, startRecording, stopRecording, speakText, stopSpeaking };
}
