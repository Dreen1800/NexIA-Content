import { WebhookPayload, WebhookResponse, AudioData } from '../types/ContentCreator';

export class WebhookService {
    private webhookUrl: string;
    private userId: string;

    constructor(webhookUrl: string, userId: string) {
        this.webhookUrl = webhookUrl;
        this.userId = userId;
    }

    // Converter blob para base64
    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                } else {
                    reject(new Error('Erro ao converter blob para base64'));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // Processar resposta do webhook
    private processWebhookResponse(textResponse: string): string {
        console.log(`[DEBUG] Processing response: ${textResponse.length} chars`);
        console.log(`[DEBUG] Raw response preview:`, textResponse.substring(0, 500));

        let data: any;

        try {
            // Primeira tentativa: JSON direto
            data = JSON.parse(textResponse);
            console.log('[DEBUG] JSON parsed successfully');
            console.log('[DEBUG] Parsed data:', JSON.stringify(data, null, 2));
        } catch (jsonError) {
            console.log(`[DEBUG] JSON parse failed: ${(jsonError as Error).message}`);

            try {
                // Segunda tentativa: limpeza de caracteres
                let cleanedText = this.cleanJsonString(textResponse);
                data = JSON.parse(cleanedText);
                console.log('[DEBUG] JSON cleaned and parsed successfully');
            } catch (cleanError) {
                console.log(`[DEBUG] Cleaned JSON parse failed: ${(cleanError as Error).message}`);

                // Terceira tentativa: extração manual mais robusta
                data = this.extractJsonManually(textResponse);
                if (!data) {
                    console.log('[DEBUG] Manual extraction failed, trying emergency extraction...');

                    // Quarta tentativa: extração de emergência - sempre funciona
                    const emergencyContent = this.emergencyContentExtraction(textResponse);
                    if (emergencyContent) {
                        data = [{ "output": emergencyContent }];
                        console.log(`[DEBUG] Emergency extraction successful: ${emergencyContent.length} chars`);
                    } else {
                        throw new Error('Não foi possível processar a resposta do servidor');
                    }
                } else {
                    console.log('[DEBUG] Manual extraction successful');
                }
            }
        }

        // Extrai a resposta do formato identificado
        const response = this.extractResponseFromData(data);
        console.log(`[DEBUG] Final response extracted: ${response.length} chars`);

        return response;
    }

    // Extração de emergência - último recurso
    private emergencyContentExtraction(textResponse: string): string | null {
        console.log('[DEBUG] Starting emergency content extraction...');

        try {
            // Remove tudo que claramente não é conteúdo
            let content = textResponse
                .replace(/^\s*[\[\{].*?"(output|response)"\s*:\s*"/i, '') // Remove início JSON
                .replace(/"\s*[\}\]]\s*$/i, '') // Remove fim JSON
                .replace(/\\"/g, '"') // Unescape aspas
                .replace(/\\n/g, '\n') // Unescape quebras de linha
                .replace(/\\r/g, '\r')
                .replace(/\\t/g, '\t')
                .replace(/\\\\/g, '\\')
                .trim();

            // Se ainda está muito longo, pode ser que tenha JSON misturado
            if (content.includes('"') && content.includes('{')) {
                // Busca por texto que parece ser o conteúdo real
                const possibleContent = content.match(/[A-Z][^"{}[\]]*(?:\n[^"{}[\]]*)*$/);
                if (possibleContent) {
                    content = possibleContent[0].trim();
                }
            }

            // Verifica se o conteúdo parece válido
            if (content.length > 50 && !content.includes('{"') && !content.includes('[{')) {
                console.log(`[DEBUG] Emergency extraction found valid content: ${content.length} chars`);
                return content;
            }

            // Se ainda não conseguiu, tenta extrair qualquer texto longo
            const textMatches = textResponse.match(/[A-Za-z][^"{}[\]]{100,}/g);
            if (textMatches && textMatches.length > 0) {
                const longestMatch = textMatches.reduce((a, b) => a.length > b.length ? a : b);
                console.log(`[DEBUG] Emergency extraction using longest text: ${longestMatch.length} chars`);
                return longestMatch.trim();
            }

            console.log('[DEBUG] Emergency extraction found no usable content');
            return null;

        } catch (error) {
            console.log(`[DEBUG] Emergency extraction error: ${(error as Error).message}`);
            return null;
        }
    }

    // Limpeza ultra-agressiva do JSON
    private cleanJsonString(jsonString: string): string {
        console.log('[DEBUG] Cleaning JSON string...');
        console.log(`[DEBUG] Original length: ${jsonString.length}`);

        let cleaned = jsonString
            // Remove BOM e caracteres invisíveis
            .replace(/^\uFEFF/, '')
            .replace(/\0/g, '')

            // Trata caracteres de controle de forma mais específica
            .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, (match, offset) => {
                console.log(`[DEBUG] Found control char at position ${offset}: ${match.charCodeAt(0)}`);
                // Preserva apenas alguns caracteres importantes
                if (match === '\n') return '\\n';
                if (match === '\r') return '\\r';
                if (match === '\t') return '\\t';
                return ' '; // Substitui outros por espaço ao invés de remover
            })

            // Normaliza quebras de linha
            .replace(/\r\n/g, '\\n')
            .replace(/\r/g, '\\n')

            // Corrige aspas não escapadas de forma mais inteligente
            .replace(/"([^"\\]*(?:\\.[^"\\]*)*)"(\s*[,}\]])/g, '"$1"$2')

            // Remove espaços múltiplos, mas preserva estrutura
            .replace(/[ \t]+/g, ' ')
            .replace(/\n\s*\n/g, '\n')

            .trim();

        console.log(`[DEBUG] Cleaned length: ${cleaned.length}`);
        console.log(`[DEBUG] Cleaned preview: ${cleaned.substring(0, 200)}...`);

        return cleaned;
    }

    // Extração manual ultra-robusta
    private extractJsonManually(textResponse: string): any {
        console.log('[DEBUG] Starting manual JSON extraction...');

        // Log dos primeiros e últimos 200 caracteres para debug
        console.log(`[DEBUG] Response start: ${textResponse.substring(0, 200)}`);
        console.log(`[DEBUG] Response end: ${textResponse.substring(textResponse.length - 200)}`);

        try {
            // Método 1: Busca por "response": e extrai até o final real do JSON
            const responseIndex = textResponse.indexOf('"response":');
            if (responseIndex !== -1) {
                const quoteStart = textResponse.indexOf('"', responseIndex + 11);
                if (quoteStart !== -1) {
                    console.log(`[DEBUG] Method 1: Found response quote at position: ${quoteStart}`);

                    // Conta chaves e aspas para encontrar o final real
                    let current = quoteStart + 1;
                    let inString = true;
                    let escaped = false;
                    let content = '';

                    while (current < textResponse.length && inString) {
                        const char = textResponse[current];

                        if (escaped) {
                            escaped = false;
                            content += char;
                        } else if (char === '\\') {
                            escaped = true;
                            content += char;
                        } else if (char === '"') {
                            // Verifica se é realmente o final checando o que vem depois
                            const nextNonSpace = textResponse.substring(current + 1).match(/^\s*([}\]])/);
                            if (nextNonSpace) {
                                inString = false;
                                break;
                            } else {
                                content += char;
                            }
                        } else {
                            content += char;
                        }

                        current++;
                    }

                    if (content.length > 100) {
                        const unescapedContent = this.unescapeJsonString(content);
                        console.log(`[DEBUG] Method 1 extracted: ${unescapedContent.length} chars`);
                        return { "success": true, "data": { "response": unescapedContent } };
                    }
                }
            }

            // Método 2: Busca por "output": com extração similar
            const outputIndex = textResponse.indexOf('"output":');
            if (outputIndex !== -1) {
                const quoteStart = textResponse.indexOf('"', outputIndex + 9);
                if (quoteStart !== -1) {
                    console.log(`[DEBUG] Method 2: Found output quote at position: ${quoteStart}`);

                    let current = quoteStart + 1;
                    let inString = true;
                    let escaped = false;
                    let content = '';

                    while (current < textResponse.length && inString) {
                        const char = textResponse[current];

                        if (escaped) {
                            escaped = false;
                            content += char;
                        } else if (char === '\\') {
                            escaped = true;
                            content += char;
                        } else if (char === '"') {
                            const nextNonSpace = textResponse.substring(current + 1).match(/^\s*([}\]])/);
                            if (nextNonSpace) {
                                inString = false;
                                break;
                            } else {
                                content += char;
                            }
                        } else {
                            content += char;
                        }

                        current++;
                    }

                    if (content.length > 100) {
                        const unescapedContent = this.unescapeJsonString(content);
                        console.log(`[DEBUG] Method 2 extracted: ${unescapedContent.length} chars`);
                        return [{ "output": unescapedContent }];
                    }
                }
            }

            console.log('[DEBUG] All manual extraction methods failed');
            return null;

        } catch (error) {
            console.log(`[DEBUG] Manual extraction error: ${(error as Error).message}`);
            return null;
        }
    }

    // Decodificação de strings JSON escapadas
    private unescapeJsonString(str: string): string {
        return str
            .replace(/\\"/g, '"')
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\\\/g, '\\');
    }

    private extractResponseFromData(data: any): string {
        console.log('[DEBUG] Extracting response from data...');

        // Formato array: [{"output": "..."}]
        if (Array.isArray(data) && data.length > 0) {
            if (data[0].output) {
                console.log('[DEBUG] Found array format with output');
                return this.processResponseMessage(data[0].output);
            }
        }

        // Formato objeto: {"success": true, "data": {"response": "..."}}
        if (data && data.success === true && data.data && data.data.response) {
            console.log('[DEBUG] Found success format with data.response');
            return this.processResponseMessage(data.data.response);
        }

        // Outros formatos
        if (data && data.data && data.data.response) {
            console.log('[DEBUG] Found data.response');
            return this.processResponseMessage(data.data.response);
        }

        if (data && data.output) {
            console.log('[DEBUG] Found direct output');
            return this.processResponseMessage(data.output);
        }

        if (data && data.response) {
            console.log('[DEBUG] Found direct response');
            return this.processResponseMessage(data.response);
        }

        if (data && data.message) {
            console.log('[DEBUG] Found message');
            return this.processResponseMessage(data.message);
        }

        console.log('[DEBUG] No valid format found');
        throw new Error('Formato de resposta não reconhecido');
    }

    private processResponseMessage(message: any): string {
        if (!message || typeof message !== 'string') {
            console.log('[DEBUG] Invalid message type');
            return message || 'Resposta vazia';
        }

        console.log(`[DEBUG] Processing message: ${message.length} characters`);

        // Remove marcadores específicos e caracteres de controle que podem quebrar a renderização
        let processedMessage = message
            .replace(/^\[AUDIO\]\s*/i, '')
            .replace(/\s*\[FIGURINHAS\]$/i, '')
            .trim()
            // Remover caracteres de controle (exceto tab, CR e LF) que podem interromper a renderização
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

        console.log(`[DEBUG] Processed message: ${processedMessage.length} characters`);
        return processedMessage;
    }

    // Chamar webhook
    async callWebhook(message: string, audioData?: AudioData): Promise<string> {
        try {
            const payload: WebhookPayload = {
                message: message,
                timestamp: new Date().toISOString(),
                user_id: this.userId,
                message_type: audioData ? 'audio' : 'text'
            };

            if (audioData) {
                payload.audio = audioData;
            }

            const response = await fetch(this.webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
            }

            const textResponse = await response.text();
            console.log(`[DEBUG] Response received: ${textResponse.length} chars`);

            return this.processWebhookResponse(textResponse);

        } catch (error) {
            console.log(`[DEBUG] Webhook error: ${(error as Error).message}`);
            throw error;
        }
    }

    // Enviar mensagem de texto
    async sendTextMessage(message: string): Promise<string> {
        return this.callWebhook(message);
    }

    // Enviar mensagem de áudio
    async sendAudioMessage(audioBlob: Blob): Promise<string> {
        const base64Audio = await this.blobToBase64(audioBlob);

        const audioData: AudioData = {
            data: base64Audio,
            type: audioBlob.type,
            encoding: 'base64'
        };

        return this.callWebhook('', audioData);
    }
} 