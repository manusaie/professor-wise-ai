import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, MessageSquare, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Conversation {
  id: string;
  created_at: string;
}

interface HistorySidebarProps {
  onSelectConversation: (conversationId: string | null) => void;
}

export function HistorySidebar({ onSelectConversation }: HistorySidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
      setLoading(false);
    };

    fetchConversations();
  }, [user]);

  const filteredConversations = conversations.filter(conv => 
    new Date(conv.created_at).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <h3 className="font-semibold flex items-center gap-2">{t('History')}</h3>
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder={t('Search history...')}
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <Button 
            variant="ghost"
            className="m-2 flex items-center justify-start gap-2"
            onClick={() => onSelectConversation(null)} >
            <PlusCircle className="h-4 w-4"/>
            {t('New Chat')}
        </Button>
        <ScrollArea className="flex-1 px-2">
          {loading ? (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('Loading...')}</p>
          ) : filteredConversations.length > 0 ? (
            <div className="space-y-2">
              {filteredConversations.map(conv => (
                <Button
                  key={conv.id}
                  variant="ghost"
                  className="w-full justify-start gap-2 truncate"
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <MessageSquare className="h-4 w-4"/>
                  <span className="flex-1 truncate">
                    {new Date(conv.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })}
                  </span>
                </Button>
              ))}
            </div>
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">{t('No conversations found')}</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
