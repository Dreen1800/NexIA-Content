import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Status } from '../../types/ContentCreator';
import { useAudioRecording } from '../../hooks/useAudioRecording';
import { WebhookService } from '../../services/webhookService';
import './styles/index.css';

const ContentCreator: React.FC = () => {
    // Estados principais
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState<string>('');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [status, setStatus] = useState<Status>({ text: 'Online e pronto para ajudar', type: 'online' });
    const [debugMode, setDebugMode] = useState<boolean>(false);
    const [debugInfo, setDebugInfo] = useState<string>('Debug: Aguardando...');

    // Refs
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const chatInputRef = useRef<HTMLTextAreaElement>(null);
    const audioFileInputRef = useRef<HTMLInputElement>(null);

    // Serviços
    const userId = useRef<string>(`user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    const webhookService = useRef<WebhookService>(
        new WebhookService('https://webhook.fernandabeppler.com.br/webhook/chat_ai', userId.current)
    );

    // Callbacks utilitários
    const log = useCallback((message: string) => {
        console.log(`[DEBUG] ${message}`);
        if (debugMode) {
            setDebugInfo(`${new Date().toLocaleTimeString()}: ${message}`);
        }
    }, [debugMode]);

    const scrollToBottom = useCallback((): void => {
        setTimeout(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }, 100);
    }, []);

    const updateStatus = useCallback((text: string, type: Status['type']): void => {
        setStatus({ text, type });
    }, []);

    const addMessage = useCallback((content: string, sender: Message['sender'], isAudio: boolean = false, audioBlob: Blob | null = null): void => {
        const newMessage: Message = {
            id: Date.now() + Math.random(),
            content,
            sender,
            timestamp: new Date(),
            isAudio,
            audioBlob,
            audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null
        };

        setMessages(prev => [...prev, newMessage]);
        scrollToBottom();
    }, [scrollToBottom]);

    // Hook de áudio
    const {
        isRecording,
        recordingTime,
        currentAudioBlob,
        showAudioPreview,
        toggleRecording,
        discardRecording,
        setShowAudioPreview
    } = useAudioRecording(
        (message: string) => addMessage(message, 'error'),
        updateStatus
    );

    // Funções principais
    const sendMessage = useCallback(async (): Promise<void> => {
        const message = inputMessage.trim();
        if (!message) return;

        addMessage(message, 'user');
        setInputMessage('');
        setIsTyping(true);
        updateStatus('Processando...', 'processing');

        try {
            const response = await webhookService.current.sendTextMessage(message);
            setIsTyping(false);
            addMessage(response, 'ai');
            updateStatus('Online e pronto para ajudar', 'online');
        } catch (error) {
            setIsTyping(false);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            addMessage(`❌ Erro: ${errorMessage}`, 'error');
            updateStatus('Erro na conexão - Tente novamente', 'error');

            setTimeout(() => {
                updateStatus('Online e pronto para ajudar', 'online');
            }, 10000);
        }
    }, [inputMessage, addMessage, updateStatus]);

    const sendAudioMessage = useCallback(async (): Promise<void> => {
        if (!currentAudioBlob) return;

        setShowAudioPreview(false);
        addMessage('Mensagem de áudio', 'user', true, currentAudioBlob);
        setIsTyping(true);
        updateStatus('Processando áudio...', 'processing');

        try {
            const response = await webhookService.current.sendAudioMessage(currentAudioBlob);
            setIsTyping(false);
            addMessage(response, 'ai');
            updateStatus('Online e pronto para ajudar', 'online');
        } catch (error) {
            setIsTyping(false);
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            addMessage(`❌ Erro ao processar áudio: ${errorMessage}`, 'error');
            updateStatus('Erro - Tente novamente', 'error');

            setTimeout(() => {
                updateStatus('Online e pronto para ajudar', 'online');
            }, 5000);
        }
    }, [currentAudioBlob, addMessage, updateStatus, setShowAudioPreview]);

    const handleAudioFile = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('audio/')) {
            addMessage('❌ Por favor, selecione apenas arquivos de áudio.', 'error');
            return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            addMessage('❌ Arquivo muito grande. Tamanho máximo: 10MB.', 'error');
            return;
        }

        // Usar hook de áudio para gerenciar o arquivo
        addMessage('Arquivo de áudio carregado com sucesso!', 'user', true, file);
        event.target.value = '';
    }, [addMessage]);

    // Utilitários de formatação
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMessageContent = useCallback((content: string): string => {
        if (!content || typeof content !== 'string') {
            return content || '';
        }

        console.log('[DEBUG] Original content length:', content.length);
        console.log('[DEBUG] Original content preview:', content.substring(0, 200) + '...');

        // Substituir sequências escapadas de aspas por aspas reais
        const cleaned = content.replace(/\\"/g, '"');

        console.log('[DEBUG] Cleaned content length:', cleaned.length);
        console.log('[DEBUG] Cleaned content preview:', cleaned.substring(0, 200) + '...');

        // Processamento de markdown mais robusto
        let formatted = processAdvancedMarkdown(cleaned);

        // Converte URLs em links clicáveis
        formatted = makeLinksClickable(formatted);

        // Preserva quebras de linha
        formatted = formatted.replace(/\n/g, '<br>');

        console.log('[DEBUG] Final formatted length:', formatted.length);
        console.log('[DEBUG] Final formatted preview:', formatted.substring(0, 200) + '...');

        return formatted;
    }, []);

    // Processamento avançado de markdown
    const processAdvancedMarkdown = (text: string): string => {
        return text
            // Títulos (### -> h3, ## -> h2, # -> h1)
            .replace(/^### (.+)$/gm, '<h3>$1</h3>')
            .replace(/^## (.+)$/gm, '<h2>$1</h2>')
            .replace(/^# (.+)$/gm, '<h1>$1</h1>')

            // Texto em negrito (**texto** -> <strong>texto</strong>)
            .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')

            // Texto em itálico (*texto* -> <em>texto</em>)
            .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')

            // Separadores (--- -> <hr>)
            .replace(/^---+$/gm, '<hr class="markdown-separator">')

            // Listas não ordenadas (* item -> <li>item</li>)
            .replace(/^\* (.+)$/gm, '<li>$1</li>')

            // Listas numeradas (1. item -> <li>item</li>)
            .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')

            // Envolver listas consecutivas em <ul>
            .replace(/(<li>.*?<\/li>(?:\s*<li>.*?<\/li>)*)/gs, '<ul>$1</ul>')

            // Parágrafos (quebras duplas)
            .replace(/\n\n/g, '</p><p>')
            .replace(/^([^<].*)/, '<p>$1')
            .replace(/(.*[^>])$/, '$1</p>')

            // Limpa parágrafos vazios
            .replace(/<p><\/p>/g, '')
            .replace(/<p>\s*<\/p>/g, '');
    };

    // Converter URLs em links clicáveis
    const makeLinksClickable = (text: string): string => {
        const urlRegex = /(https?:\/\/[^\s<>"]+|www\.[^\s<>"]+)/gi;

        return text.replace(urlRegex, (url) => {
            const href = url.startsWith('www.') ? `https://${url}` : url;
            const displayUrl = url.length > 50 ? url.substring(0, 47) + '...' : url;
            return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="message-link">${displayUrl}</a>`;
        });
    };

    // Event handlers
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>): void => {
        setInputMessage(e.target.value);

        // Auto-resize
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    };

    // Effect para limpar URLs de áudio
    useEffect(() => {
        return () => {
            messages.forEach(message => {
                if (message.audioUrl) {
                    URL.revokeObjectURL(message.audioUrl);
                }
            });
        };
    }, [messages]);

    return (
        <div className="chat-container">
            {/* Header */}
            <div className="chat-header" onDoubleClick={() => setDebugMode(!debugMode)}>
                <div className="ai-avatar">
                    <img src="https://archive.org/download/meu_20250506/MEU.png" alt="AI Logo" />
                </div>
                <div className="ai-info">
                    <h2>NexIA - Content</h2>
                    <div className="ai-status">
                        <div className={`status-dot ${status.type}`}></div>
                        <span>{status.text}</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="chat-messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="welcome-message">
                        <h3>Olá! 👋</h3>
                        <p>Sou seu assistente de conteúdo IA. Como posso ajudá-lo hoje?<br />
                            <small>O que quer produzir hoje?</small></p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <div key={message.id} className={`message ${message.sender}`}>
                            <div className="message-avatar">
                                {message.sender === 'user' ? (
                                    '👤'
                                ) : message.sender === 'error' ? (
                                    '⚠️'
                                ) : (
                                    <img src="https://archive.org/download/meu_20250506/MEU.png" alt="AI" />
                                )}
                            </div>
                            <div className="message-content">
                                {message.isAudio ? (
                                    <div className="audio-message">
                                        <div className="audio-icon">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                                                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                                            </svg>
                                        </div>
                                        <div className="audio-player">
                                            <audio controls src={message.audioUrl || undefined} />
                                            <div className="audio-info">
                                                🎵 Mensagem de áudio
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }} />
                                )}
                                <div className="message-time">
                                    {formatTime(message.timestamp)}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {/* Typing indicator */}
                {isTyping && (
                    <div className="message ai">
                        <div className="message-avatar">
                            <img src="https://archive.org/download/meu_20250506/MEU.png" alt="AI" />
                        </div>
                        <div className="typing-indicator">
                            <div className="typing-dots">
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                                <div className="typing-dot"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="chat-input-container">
                {/* Audio preview */}
                {showAudioPreview && currentAudioBlob && (
                    <div className="audio-preview">
                        <div className="audio-info">
                            🎵 <strong>Áudio gravado</strong> - Pronto para enviar
                        </div>
                        <audio
                            controls
                            src={currentAudioBlob ? URL.createObjectURL(currentAudioBlob) : ''}
                        />
                        <div className="audio-preview-controls">
                            <button className="preview-button" onClick={discardRecording}>
                                🗑️ Descartar
                            </button>
                            <button className="preview-button primary" onClick={sendAudioMessage}>
                                📤 Enviar Áudio
                            </button>
                        </div>
                    </div>
                )}

                <div className="chat-input-wrapper">
                    <textarea
                        ref={chatInputRef}
                        className="chat-input"
                        placeholder="Digite sua mensagem..."
                        value={inputMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />

                    <div className="audio-controls">
                        <button
                            className="audio-button"
                            onClick={() => audioFileInputRef.current?.click()}
                            title="Enviar arquivo de áudio"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7,10 12,15 17,10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                        </button>

                        <button
                            className={`audio-button ${isRecording ? 'recording' : ''}`}
                            onClick={toggleRecording}
                            title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </button>
                    </div>

                    <button
                        className="send-button"
                        onClick={sendMessage}
                        disabled={!inputMessage.trim()}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'white' }}>
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22,2 15,22 11,13 2,9"></polygon>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Hidden file input */}
            <input
                type="file"
                ref={audioFileInputRef}
                className="hidden"
                accept="audio/*"
                onChange={handleAudioFile}
            />

            {/* Recording indicator */}
            {isRecording && (
                <div className="recording-indicator">
                    🔴 Gravando<span className="recording-timer">{recordingTime}</span>
                </div>
            )}

            {/* Debug info */}
            {debugMode && (
                <div className="debug-info">
                    {debugInfo}
                </div>
            )}
        </div>
    );
};

export default ContentCreator; 