import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// We'll use environment variables here
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || '';

// Check if we already have clients in window (for development hot reloading)
const globalAny = globalThis as any;

// Configuração auth para o cliente principal
const clientAuthOptions = {
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storageKey: 'supabase.auth.token'
};

// Cliente regular para operações normais de usuário (com chave anônima)
export const supabase = globalAny.__supabase__ || (globalAny.__supabase__ = createClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: clientAuthOptions
    }
));

// Cliente admin para operações que requerem acesso privilegiado (com chave de serviço)
// Configurado SEM auth client para evitar conflitos com GoTrueClient
export const supabaseAdmin = globalAny.__supabaseAdmin__ || (globalAny.__supabaseAdmin__ = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            // Desabilita completamente o auth client
            flowType: 'implicit' as const
        },
        global: {
            headers: {
                'apikey': supabaseServiceKey,
                'Authorization': `Bearer ${supabaseServiceKey}`
            }
        }
    }
));