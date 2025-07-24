import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, Settings } from "lucide-react";

interface LearningHeaderProps {
  userName: string;
  onSettingsClick: () => void;
}

export function LearningHeader({ userName, onSettingsClick }: LearningHeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between p-4 bg-card border-b">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <BookOpen className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{t('Welcome back', { name: userName })}! 👋</h1>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onSettingsClick} aria-label={t('Settings')}>
          <Settings className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="sm" className="gap-2">
          <LogOut className="h-4 w-4" />
          {t('Sign Out')}
        </Button>
      </div>
    </header>
  );
}