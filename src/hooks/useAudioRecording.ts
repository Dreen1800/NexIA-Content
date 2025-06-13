import { useState, useRef, useCallback } from 'react';
import { Status } from '../types/ContentCreator';

interface UseAudioRecordingReturn {
    isRecording: boolean;
    recordingTime: string;
    currentAudioBlob: Blob | null;
    showAudioPreview: boolean;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    toggleRecording: () => Promise<void>;
    discardRecording: () => void;
    setCurrentAudioBlob: (blob: Blob | null) => void;
    setShowAudioPreview: (show: boolean) => void;
}

export const useAudioRecording = (
    onError: (message: string) => void,
    updateStatus: (text: string, type: Status['type']) => void
): UseAudioRecordingReturn => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState('00:00');
    const [currentAudioBlob, setCurrentAudioBlob] = useState<Blob | null>(null);
    const [showAudioPreview, setShowAudioPreview] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingStartTimeRef = useRef<number | null>(null);
    const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previewAudioRef = useRef<HTMLAudioElement | null>(null);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setCurrentAudioBlob(audioBlob);
                setShowAudioPreview(true);

                // Parar todas as tracks para liberar microfone
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            recordingStartTimeRef.current = Date.now();
            updateStatus('Gravando áudio...', 'recording');

            // Iniciar timer
            recordingIntervalRef.current = setInterval(() => {
                if (recordingStartTimeRef.current) {
                    const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
                    const minutes = Math.floor(elapsed / 60);
                    const seconds = elapsed % 60;
                    setRecordingTime(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
                }
            }, 1000);

        } catch (error) {
            console.error('Erro ao iniciar gravação:', error);
            onError('❌ Erro ao acessar o microfone. Verifique as permissões do navegador.');
        }
    }, [onError, updateStatus]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            updateStatus('Online e pronto para ajudar', 'online');

            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
                recordingIntervalRef.current = null;
            }
        }
    }, [isRecording, updateStatus]);

    const toggleRecording = useCallback(async () => {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }, [isRecording, startRecording, stopRecording]);

    const discardRecording = useCallback(() => {
        setCurrentAudioBlob(null);
        setShowAudioPreview(false);

        if (previewAudioRef.current?.src) {
            URL.revokeObjectURL(previewAudioRef.current.src);
            previewAudioRef.current.src = '';
        }
    }, []);

    return {
        isRecording,
        recordingTime,
        currentAudioBlob,
        showAudioPreview,
        startRecording,
        stopRecording,
        toggleRecording,
        discardRecording,
        setCurrentAudioBlob,
        setShowAudioPreview
    };
}; 