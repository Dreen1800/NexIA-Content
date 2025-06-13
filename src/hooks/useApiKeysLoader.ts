import { useEffect, useState, useRef } from 'react';
import { useApiKeyStore } from '../stores/apiKeyStore';
import { useOpenAIKeyStore } from '../stores/openaiKeyStore';
import { useApifyKeyStore } from '../stores/apifyKeyStore';
import { useAuthStore } from '../stores/authStore';

// Controle global mais robusto para evitar múltiplas execuções
const globalApiKeysLoader = {
    status: 'idle' as 'idle' | 'loading' | 'loaded',
    promise: null as Promise<void> | null,
    userId: null as string | null,

    reset() {
        this.status = 'idle';
        this.promise = null;
        this.userId = null;
    },

    setUser(userId: string | null) {
        if (this.userId !== userId) {
            this.reset();
            this.userId = userId;
        }
    }
};

/**
 * Hook personalizado para carregar todas as chaves de API automaticamente
 * quando o usuário estiver autenticado
 */
export const useApiKeysLoader = () => {
    const { user } = useAuthStore();
    const { fetchApiKeys } = useApiKeyStore();
    const { fetchOpenAIKeys } = useOpenAIKeyStore();
    const { fetchApifyKeys } = useApifyKeyStore();
    const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

    // Refs para controle local
    const mountedRef = useRef(true);
    const userIdRef = useRef<string | null>(null);

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        const currentUserId = user?.id || null;

        // Se mudou o usuário, reseta o estado global
        globalApiKeysLoader.setUser(currentUserId);

        // Se não há usuário, reseta tudo
        if (!user) {
            if (isInitialLoadComplete) {
                setIsInitialLoadComplete(false);
            }
            return;
        }

        // Se já foi carregado para este usuário, marca como completo
        if (globalApiKeysLoader.status === 'loaded' && globalApiKeysLoader.userId === currentUserId) {
            if (!isInitialLoadComplete) {
                setIsInitialLoadComplete(true);
            }
            return;
        }

        // Se já está carregando, aguarda o Promise existente
        if (globalApiKeysLoader.status === 'loading' && globalApiKeysLoader.promise) {
            globalApiKeysLoader.promise
                .then(() => {
                    if (mountedRef.current) {
                        setIsInitialLoadComplete(true);
                    }
                })
                .catch(() => {
                    if (mountedRef.current) {
                        setIsInitialLoadComplete(true);
                    }
                });
            return;
        }

        // Inicia novo carregamento
        if (globalApiKeysLoader.status === 'idle') {
            globalApiKeysLoader.status = 'loading';

            const loadAllApiKeys = async () => {
                try {
                    console.log('🔄 Iniciando carregamento das chaves de API...');
                    const startTime = Date.now();

                    await Promise.all([
                        fetchApiKeys(),
                        fetchOpenAIKeys(),
                        fetchApifyKeys()
                    ]);

                    const loadTime = Date.now() - startTime;
                    console.log(`✅ Todas as chaves de API foram carregadas com sucesso em ${loadTime}ms`);

                    globalApiKeysLoader.status = 'loaded';

                    if (mountedRef.current) {
                        setIsInitialLoadComplete(true);
                    }
                } catch (error) {
                    console.error('❌ Erro ao carregar chaves de API:', error);
                    globalApiKeysLoader.status = 'idle'; // Permite nova tentativa

                    if (mountedRef.current) {
                        setIsInitialLoadComplete(true);
                    }
                } finally {
                    globalApiKeysLoader.promise = null;
                }
            };

            globalApiKeysLoader.promise = loadAllApiKeys();
        }
    }, [user, fetchApiKeys, fetchOpenAIKeys, fetchApifyKeys, isInitialLoadComplete]);

    return { isInitialLoadComplete };
}; 