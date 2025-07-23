import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Coins, Target, Trophy } from "lucide-react";

interface ProgressCardsProps {
  level: number;
  xp: number;
  maxXp: number;
  coins: number;
  streak: number;
  totalXp: number;
}

export function ProgressCards({ level, xp, maxXp, coins, streak, totalXp }: ProgressCardsProps) {
  const progressPercentage = (xp / maxXp) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{level}</div>
            <div className="text-sm text-muted-foreground">Level</div>
            <div className="text-xs text-muted-foreground mt-1">{xp}/{maxXp} XP</div>
            <Progress value={progressPercentage} className="mt-2 h-2" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-warning rounded-lg">
            <Coins className="h-5 w-5 text-warning-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{coins}</div>
            <div className="text-sm text-muted-foreground">Coins</div>
            <div className="text-xs text-muted-foreground">Earned</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-success rounded-lg">
            <Target className="h-5 w-5 text-success-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{streak}</div>
            <div className="text-sm text-muted-foreground">Streak</div>
            <div className="text-xs text-muted-foreground">Days</div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="p-2 bg-accent rounded-lg">
            <Trophy className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold">{totalXp}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
            <div className="text-xs text-muted-foreground">Experience</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}