import { useState } from "react";
import { LearningHeader } from "@/components/LearningHeader";
import { ProgressCards } from "@/components/ProgressCards";
import { NavigationTabs } from "@/components/NavigationTabs";
import { ChatInterface } from "@/components/ChatInterface";

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
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Settings</h2>
              <p className="text-muted-foreground">Customize your learning experience.</p>
            </div>
          </div>
        );
      default:
        return <ChatInterface />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <LearningHeader userName={userData.name} />
      
      <div className="mb-6">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏆 Your Learning Progress
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
  );
};

export default Index;