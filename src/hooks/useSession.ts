import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para obter a sessão do usuário autenticado.
 * Encapsula o `useAuth` para fornecer acesso direto à sessão do Supabase.
 */
export const useSession = () => {
  const { session } = useAuth();
  
  const getToken = async () => {
    if (!session) return null;
    return session.access_token;
  };
  
  return { session, getToken };
};
