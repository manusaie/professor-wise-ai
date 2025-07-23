import { Button } from "@/components/ui/button";
import { LogOut, BookOpen } from "lucide-react";

interface LearningHeaderProps {
  userName: string;
}

export function LearningHeader({ userName }: LearningHeaderProps) {
  return (
    <header className="flex items-center justify-between p-6 bg-card border-b">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <BookOpen className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Welcome back, {userName}! 👋</h1>
        </div>
      </div>
      
      <Button variant="outline" size="sm" className="gap-2">
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>
    </header>
  );
}