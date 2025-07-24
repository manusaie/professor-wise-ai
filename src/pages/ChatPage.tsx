import { useState, useEffect } from 'react';
import i18n from '@/i18n';
import { ChatInterface } from '@/components/ChatInterface';
import { HistorySidebar } from '@/components/HistorySidebar';
import { UserProfileHeader } from '@/components/UserProfileHeader';
import { LearningHeader } from '@/components/LearningHeader';
import { SettingsPanel } from '@/components/SettingsPanel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Lógica para tema e idioma
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'pt-BR');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    i18n.changeLanguage(language);
    localStorage.setItem('language', language);
  }, [language]);

  const handleSelectConversation = (conversationId: string | null) => {
    setSelectedConversationId(conversationId);
  };

  const handleSaveSettings = (settings: { language: string; darkMode: boolean }) => {
    setLanguage(settings.language);
    setDarkMode(settings.darkMode);
    localStorage.setItem('language', settings.language);
    localStorage.setItem('darkMode', settings.darkMode.toString());
    setIsSettingsOpen(false); // Fecha o modal após salvar
  };

  return (
    <>
      <div className="flex h-screen bg-background text-foreground">
        {/* Barra Lateral de Histórico */}
        <div className="w-1/4 border-r border-border p-4 flex flex-col">
          <HistorySidebar onSelectConversation={handleSelectConversation} />
        </div>

        {/* Conteúdo Principal do Chat */}
        <div className="flex-1 flex flex-col">
          <header className="p-4 border-b border-border">
            <LearningHeader userName="Usuário" onSettingsClick={() => setIsSettingsOpen(true)} />
          </header>
          <main className="flex-1 grid grid-cols-3 gap-6 p-6 overflow-hidden">
            <div className="col-span-2 h-full">
              <ChatInterface conversationId={selectedConversationId} key={selectedConversationId} />
            </div>
            <div className="col-span-1 h-full overflow-y-auto">
              <UserProfileHeader />
            </div>
          </main>
        </div>
      </div>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Configurações</DialogTitle>
          </DialogHeader>
          <SettingsPanel
            language={language}
            darkMode={darkMode}
            onSave={handleSaveSettings}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// Exportação padrão para compatibilidade com App.tsx
export default ChatPage;
