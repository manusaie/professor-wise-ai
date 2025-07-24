-- Fix messages table structure and constraints
-- This migration ensures the messages table has the correct structure and constraints

-- Drop existing constraint if it exists
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_check;

-- Ensure all required columns exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid() PRIMARY KEY;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS content TEXT NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender TEXT NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS user_id UUID NOT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE messages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add proper constraint for sender field
ALTER TABLE messages ADD CONSTRAINT messages_sender_check CHECK (sender IN ('user', 'ai'));

-- Add foreign key constraints if they don't exist
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS messages_conversation_id_fkey 
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS messages_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);
