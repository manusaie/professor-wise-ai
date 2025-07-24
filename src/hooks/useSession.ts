import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook para obter a sessão do usuário autenticado.
 * Encapsula o `useAuth` para fornecer acesso direto à sessão do Supabase.
 */
export const useSession = () => {
  const { session } = useAuth();
  return { session };
};
