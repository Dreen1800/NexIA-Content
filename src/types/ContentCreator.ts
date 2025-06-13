// Tipos para o ContentCreator
export interface Message {
    id: number;
    content: string;
    sender: 'user' | 'ai' | 'error';
    timestamp: Date;
    isAudio: boolean;
    audioBlob: Blob | null;
    audioUrl: string | null;
}

export interface Status {
    text: string;
    type: 'online' | 'processing' | 'recording' | 'error';
}

export interface AudioData {
    data: string;
    type: string;
    encoding: 'base64';
}

export interface WebhookPayload {
    message: string;
    timestamp: string;
    user_id: string;
    message_type: 'text' | 'audio';
    audio?: AudioData;
}

export interface WebhookResponse {
    success?: boolean;
    data?: {
        response: string;
    };
    output?: string;
    response?: string;
    message?: string;
} 