-- EXECUTE ESTE SCRIPT NO DASHBOARD DO SUPABASE (SQL Editor)
-- Este script corrige a estrutura da tabela messages e resolve o erro de constraint
-- VERSÃO CORRIGIDA: Limpa dados inconsistentes ANTES de aplicar constraints

-- 1. Primeiro, vamos verificar se a tabela messages existe e sua estrutura atual
-- Se não existir, vamos criá-la do zero

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    sender TEXT NOT NULL,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_url TEXT,
    file_type TEXT,
    file_size INTEGER
);

-- 2. PRIMEIRO: Limpa dados inconsistentes se existirem (ANTES da constraint)
DELETE FROM messages WHERE sender NOT IN ('user', 'ai');

-- 3. Remove constraint antiga se existir
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;

-- 4. Adiciona constraint correta para o campo sender (APÓS limpeza)
ALTER TABLE messages ADD CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'ai'));

-- 5. Garante que a tabela conversations existe
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Adiciona foreign keys se não existirem
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_conversation_id_fkey'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey 
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'messages_user_id_fkey'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 7. Cria índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 8. Habilita RLS (Row Level Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 9. Cria políticas RLS para messages
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (auth.uid() = user_id);

-- 10. Cria políticas RLS para conversations
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
CREATE POLICY "Users can view their own conversations" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversations;
CREATE POLICY "Users can insert their own conversations" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
CREATE POLICY "Users can update their own conversations" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- SUCESSO: Estrutura do banco corrigida e pronta para uso!
