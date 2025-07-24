import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, Bot, User, Clock, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Skeleton } from './ui/skeleton';
import { toast } from './ui/use-toast';
import { config } from '@/config/env';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
  conversation_id?: string;
  user_id?: string;
}

interface ChatInterfaceProps {
  conversationId?: string | null;
}

export function ChatInterface({ conversationId: propConversationId }: ChatInterfaceProps) {
  const { t } = useTranslation();
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(propConversationId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    const fetchConversation = async () => {
      setLoading(true);
      try {
        let currentConversationId = propConversationId;

        if (!currentConversationId) {
          const { data: conversation } = await supabase
            .from('conversations')
            .select('id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          currentConversationId = conversation?.id || null;
        }

        if (currentConversationId) {
          setConversationId(currentConversationId);
          const { data: messagesData, error: messagesError } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', currentConversationId)
            .order('created_at', { ascending: true });

          if (messagesError) {
            console.error('Error fetching messages:', messagesError);
          } else {
            const formattedMessages = messagesData.map(msg => ({
              id: msg.id,
              sender: msg.sender,
              content: msg.content,
              timestamp: new Date(msg.created_at).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }));
            setMessages(formattedMessages);
          }
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error in fetchConversation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversation();
  }, [user, propConversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages', 
          filter: `conversation_id=eq.${conversationId}` 
        },
        (payload) => {
          const newMessage = payload.new as any;
          if (newMessage.sender === 'ai') {
            setMessages(prevMessages => [...prevMessages, {
              id: newMessage.id,
              sender: newMessage.sender,
              content: newMessage.content,
              timestamp: new Date(newMessage.created_at).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isSending || !session) return;
    
    setIsSending(true);

    try {
      let currentConversationId = conversationId;

      // 1. Garante que uma conversa exista
      if (!currentConversationId) {
        const { data: newConversation, error: newConvError } = await supabase
          .from('conversations')
          .insert({ user_id: user.id })
          .select('id')
          .single();
        
        if (newConvError) {
          console.error('Error creating conversation:', newConvError);
          toast({
            title: 'Erro',
            description: 'Não foi possível criar a conversa. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
        currentConversationId = newConversation.id;
        setConversationId(currentConversationId);
      }

      // 2. Cria uma mensagem temporária para a UI
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const userMessage: Message = {
        id: tempId,
        sender: 'user',
        content: newMessage,
        timestamp: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: 'sending',
      };

      setMessages(prev => [...prev, userMessage]);
      const messageToSave = newMessage;
      setNewMessage('');

      // 3. Salva a mensagem do usuário no banco de dados
      const { data: savedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          content: messageToSave,
          conversation_id: currentConversationId,
          user_id: user.id,
          sender: 'user'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving message:', insertError);
        setMessages(prev => prev.map(m => 
          m.id === tempId ? { ...m, status: 'error' } : m
        ));
        toast({
          title: 'Erro',
          description: 'Não foi possível salvar a mensagem. Tente novamente.',
          variant: 'destructive',
        });
        return;
      }

      // Atualiza o status da mensagem na UI
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, status: 'sent', id: savedMessage.id } : m
      ));

      // 4. Incrementa estatísticas do usuário (gamificação)
      try {
        await supabase.rpc('increment_user_stats', { 
          user_id_in: user.id,
          xp_increment: 10,
          coins_increment: 5
        });

        // Verifica novas conquistas
        const { data: newAchievements, error: achievementsError } = await supabase
          .rpc('check_and_grant_achievements', { user_id_in: user.id });

        if (achievementsError) {
          console.error('Error checking achievements:', achievementsError);
        } else if (newAchievements && newAchievements.length > 0) {
          newAchievements.forEach((ach: any) => {
            toast({ 
              title: `${t('Achievement Unlocked!')}: ${ach.unlocked_achievement_name}`,
              description: ach.unlocked_achievement_description,
              duration: 5000,
            });
          });
        }
      } catch (error) {
        console.error('Error with gamification:', error);
      }

      // 5. Chama a Edge Function segura (Proxy para o N8N)
      try {
        const response = await fetch(`${config.supabase.url}/functions/v1/n8n-proxy`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ 
            message: messageToSave,
            conversation_id: currentConversationId,
            user_id: user.id
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('N8N proxy error:', errorData);
          throw new Error('Failed to get response from AI tutor.');
        }

        // A resposta da IA será recebida pelo listener do Supabase Realtime
        console.log('Message sent to N8N successfully');

      } catch (error) {
        console.error('Error calling n8n-proxy:', error);
        toast({
          title: 'Aviso',
          description: 'Mensagem enviada, mas pode haver atraso na resposta da IA.',
          variant: 'default',
        });
      }

    } catch (error) {
      console.error('Unexpected error in handleSendMessage:', error);
      toast({
        title: 'Erro',
        description: 'Erro inesperado. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6">
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="flex flex-row items-center gap-3 pb-4">
            <Avatar className="h-10 w-10 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold">{t('Tutor Name')}</h3>
              <p className="text-sm text-muted-foreground">{t('Your AI Learning Assistant')}</p>
            </div>
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              {t('Active')}
            </Badge>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 p-0">
            <div className="flex-1 overflow-y-auto px-6 space-y-4">
              {loading ? (
                <div className="space-y-4 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-10 w-3/4" />
                  </div>
                  <div className="flex items-center gap-3 justify-end">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-10 w-1/2" />
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full text-center text-muted-foreground">
                  {t('No messages yet. Start the conversation!')}
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.sender === 'ai' && (
                      <Avatar className="h-8 w-8 bg-primary">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                      <div
                        className={`p-3 rounded-xl ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 px-3 flex items-center gap-1">
                        {message.timestamp}
                        {message.sender === 'user' && message.status === 'sending' && (
                          <Clock className="h-3 w-3 animate-spin" />
                        )}
                        {message.sender === 'user' && message.status === 'error' && (
                          <AlertCircle className="h-3 w-3 text-destructive" />
                        )}
                      </p>
                    </div>

                    {message.sender === 'user' && (
                      <Avatar className="h-8 w-8 bg-secondary">
                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 pt-0">
              <div className="flex gap-2">
                <Input
                  placeholder={t('Type your message...')}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                  disabled={loading || isSending}
                />
                <Button 
                  onClick={handleSendMessage} 
                  size="icon" 
                  disabled={loading || isSending || !newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 bg-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{t('Tutor Name')}</h3>
                <p className="text-sm text-muted-foreground">{t('Your Personal Learning Assistant')}</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold flex items-center gap-2">
              {t('Quick Tips')} 💡
            </h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium">• {t('Ask specific questions to get detailed explanations')}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">• {t('Earn XP for every question you ask')}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">• {t('Customize your tutor\'s name and avatar')}</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">• {t('Check your achievements regularly')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}