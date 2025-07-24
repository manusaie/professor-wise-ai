-- SCRIPT GAMIFICAÇÃO COMPLETO E IDEMPOTENTE SUPABASE

-- 1. REMOÇÃO DE FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS increment_user_stats(UUID, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS check_and_grant_achievements(UUID);

-- 2. CRIAÇÃO DE TABELAS (SE NÃO EXISTIREM)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    display_name TEXT,
    avatar_url TEXT,
    coins INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adiciona colunas à tabela 'achievements' somente se não existirem.
-- Isso garante que o script seja seguro para reexecução e não falhe se a tabela já existir.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='requirement_type') THEN
        ALTER TABLE achievements ADD COLUMN requirement_type TEXT NOT NULL DEFAULT 'xp';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='requirement_value') THEN
        ALTER TABLE achievements ADD COLUMN requirement_value INTEGER NOT NULL DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='achievements' AND column_name='criteria') THEN
        ALTER TABLE achievements ADD COLUMN criteria JSONB;
    END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    achievement_id UUID REFERENCES achievements(id),
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    sender TEXT NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS & POLÍTICAS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view achievements" ON achievements;
CREATE POLICY "Anyone can view achievements" ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view their own achievements" ON user_achievements;
CREATE POLICY "Users can view their own achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;
CREATE POLICY "Users can insert their own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = user_id);

-- 4. TRIGGER DE ATUALIZAÇÃO DO updated_at EM profiles
CREATE OR REPLACE FUNCTION set_updated_at_profiles()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles_trigger ON profiles;
CREATE TRIGGER set_updated_at_profiles_trigger
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION set_updated_at_profiles();

-- 5. FUNÇÃO DE INCREMENTO DE XP/COINS
CREATE OR REPLACE FUNCTION increment_user_stats(
    user_id_in UUID,
    xp_increment INTEGER DEFAULT 0,
    coins_increment INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO profiles (id, xp, coins, level)
    VALUES (user_id_in, xp_increment, coins_increment, 1)
    ON CONFLICT (id) DO UPDATE SET 
        xp = profiles.xp + xp_increment,
        coins = profiles.coins + coins_increment,
        level = GREATEST(1, (profiles.xp + xp_increment) / 100 + 1),
        updated_at = NOW();
END;
$$;

-- 6. FUNÇÃO DE CHECAGEM E CONCESSÃO DE CONQUISTAS
CREATE OR REPLACE FUNCTION check_and_grant_achievements(user_id_in UUID)
RETURNS TABLE(
    unlocked_achievement_name TEXT,
    unlocked_achievement_description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_profile RECORD;
    achievement_record RECORD;
    message_count INTEGER;
BEGIN
    SELECT * INTO user_profile FROM profiles WHERE id = user_id_in;
    IF user_profile IS NULL THEN RETURN; END IF;

    SELECT COUNT(*) INTO message_count FROM messages WHERE user_id = user_id_in AND sender = 'user';

    FOR achievement_record IN 
        SELECT a.* FROM achievements a
        WHERE NOT EXISTS (
            SELECT 1 FROM user_achievements ua 
            WHERE ua.user_id = user_id_in AND ua.achievement_id = a.id
        )
        AND (
            (a.requirement_type = 'xp' AND user_profile.xp >= a.requirement_value) OR
            (a.requirement_type = 'messages' AND message_count >= a.requirement_value)
        )
    LOOP
        INSERT INTO user_achievements (user_id, achievement_id)
        VALUES (user_id_in, achievement_record.id);
        unlocked_achievement_name := achievement_record.name;
        unlocked_achievement_description := achievement_record.description;
        RETURN NEXT;
    END LOOP;

    RETURN;
END;
$$;

-- 7. POPULA AS CONQUISTAS (idempotente)
INSERT INTO achievements (name, description, requirement_type, requirement_value, criteria) VALUES
('Primeira Mensagem', 'Enviou sua primeira mensagem!', 'messages', 1, '{"type": "messages", "value": 1}'),
('Conversador', 'Enviou 10 mensagens', 'messages', 10, '{"type": "messages", "value": 10}'),
('Tagarela', 'Enviou 50 mensagens', 'messages', 50, '{"type": "messages", "value": 50}'),
('Iniciante', 'Alcançou 100 XP', 'xp', 100, '{"type": "xp", "value": 100}'),
('Estudioso', 'Alcançou 500 XP', 'xp', 500, '{"type": "xp", "value": 500}'),
('Expert', 'Alcançou 1000 XP', 'xp', 1000, '{"type": "xp", "value": 1000}')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value,
    criteria = EXCLUDED.criteria;
