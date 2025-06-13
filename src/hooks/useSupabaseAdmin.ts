import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabaseClient';

export const useSupabaseAdmin = () => {
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!user) {
                setIsSuperAdmin(false);
                setIsLoading(false);
                return;
            }

            try {
                // Lista de emails que são considerados superadmin
                // Você pode personalizar esta lista ou implementar uma verificação no banco de dados
                const superAdminEmails = [
                    'admin@nexia.com',
                    'andboaventura18@gmail.com',
                    // Adicione aqui os emails dos superadmins
                ];

                // Verifica se o email do usuário está na lista de superadmins
                const isAdmin = superAdminEmails.includes(user.email || '');

                // Alternativamente, você pode verificar no banco de dados se existe uma tabela de admins
                // const { data, error } = await supabase
                //   .from('admin_users')
                //   .select('id')
                //   .eq('user_id', user.id)
                //   .single();

                // const isAdmin = !error && data;

                setIsSuperAdmin(isAdmin);
            } catch (error) {
                console.error('Erro ao verificar status de admin:', error);
                setIsSuperAdmin(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdminStatus();
    }, [user]);

    return { isSuperAdmin, isLoading };
}; 