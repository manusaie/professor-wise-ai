import { useState, useEffect } from "react";
import { LearningHeader } from "@/components/LearningHeader";
import { ProgressCards } from "@/components/ProgressCards";
import NavigationTabs from "@/components/NavigationTabs";
import { ChatInterface } from "@/components/ChatInterface";
import { SettingsPanel } from "@/components/SettingsPanel";
import RemindersPanel from "@/components/RemindersPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  // Mock user data
  const userData = {
    name: "paulo",
    level: 1,
    xp: 5,
    maxXp: 100,
    coins: 0,
    streak: 0,
    totalXp: 5
  };

  // Persistência e controle de idioma e dark mode
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'pt-BR');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "chat":
        return <ChatInterface />;
      case "achievements":
        return (
          <div className="px-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Achievements</h2>
              <p className="text-muted-foreground">Keep learning to unlock achievements!</p>
            </div>
          </div>
        );
      case "schedule":
        return (
          <div className="px-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Study Schedule</h2>
              <p className="text-muted-foreground">Plan your learning sessions here.</p>
            </div>
          </div>
        );
      case "settings":
        return (
          <div className="px-6">
            <SettingsPanel
              language={language}
              darkMode={darkMode}
              onSave={(settings) => {
                setLanguage(settings.language);
                setDarkMode(settings.darkMode);
              }}
            />
          </div>
        );
      case "reminders":
        return (
          <div className="px-6">
            <RemindersPanel />
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-card shadow-sm">
        <LearningHeader 
          userName={userData.name} 
          onSettingsClick={() => setActiveTab("settings")} 
        />
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="px-2 py-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🏆 Seu Progresso de Aprendizado
            </h2>
          </div>
          
          <ProgressCards
            level={userData.level}
            xp={userData.xp}
            maxXp={userData.maxXp}
            coins={userData.coins}
            streak={userData.streak}
            totalXp={userData.totalXp}
          />
        </div>

        <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <div className="pb-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Index;