-- Ativa o RLS em todas as tabelas necessárias
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela profiles
-- Permite que usuários autenticados vejam apenas seu próprio perfil
CREATE POLICY "Usuários podem ver apenas seu próprio perfil" 
ON public.profiles
FOR SELECT 
USING (auth.uid() = id);

-- Permite que usuários autenticados atualizem apenas seu próprio perfil
CREATE POLICY "Usuários podem atualizar apenas seu próprio perfil"
ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

-- Políticas para a tabela messages
-- Permite que usuários autenticados vejam apenas suas próprias mensagens
CREATE POLICY "Usuários podem ver apenas suas próprias mensagens"
ON public.messages
FOR SELECT 
USING (auth.uid() = user_id);

-- Permite que usuários autenticados criem mensagens
CREATE POLICY "Usuários podem criar mensagens"
ON public.messages
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Permite que usuários autenticados atualizem apenas suas próprias mensagens
CREATE POLICY "Usuários podem atualizar apenas suas próprias mensagens"
ON public.messages
FOR UPDATE 
USING (auth.uid() = user_id);

-- Permite que usuários autenticados excluam apenas suas próprias mensagens
CREATE POLICY "Usuários podem excluir apenas suas próprias mensagens"
ON public.messages
FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas para a tabela achievements (todos podem ver as conquistas, mas apenas admins podem gerenciar)
-- Permite que qualquer usuário veja as conquistas disponíveis
CREATE POLICY "Conquistas são visíveis para todos"
ON public.achievements
FOR SELECT 
USING (true);

-- Apenas admins podem gerenciar conquistas
CREATE POLICY "Apenas admins podem gerenciar conquistas"
ON public.achievements
FOR ALL 
USING (auth.role() = 'service_role');

-- Políticas para a tabela user_achievements
-- Usuários podem ver apenas suas próprias conquistas
CREATE POLICY "Usuários podem ver apenas suas próprias conquistas"
ON public.user_achievements
FOR SELECT 
USING (auth.uid() = user_id);

-- Apenas funções autorizadas podem inserir/atualizar conquistas de usuário
CREATE POLICY "Apenas funções autorizadas podem gerenciar conquistas de usuário"
ON public.user_achievements
FOR ALL 
USING (auth.role() IN ('service_role', 'authenticated'))
WITH CHECK (auth.role() = 'service_role' OR 
           (auth.uid() = user_id AND 
            EXISTS (SELECT 1 FROM public.achievements a WHERE a.id = achievement_id)));

-- Função auxiliar para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN auth.role() = 'service_role';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
