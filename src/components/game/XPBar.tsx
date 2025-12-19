import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendUp } from '@phosphor-icons/react';
import type { TechnicianLevel } from '@/lib/types';

interface XPBarProps {
  technicianLevel: TechnicianLevel;
}

// XP thresholds for each level
const XP_THRESHOLDS = {
  3: { min: 0, max: 1000, label: 'Junior Technician' },      // Level 3 (easiest)
  2: { min: 1000, max: 3000, label: 'Intermediate Technician' }, // Level 2
  1: { min: 3000, max: Infinity, label: 'Senior Technician' }    // Level 1 (hardest)
};

export function XPBar({ technicianLevel }: XPBarProps) {
  const currentLevel = technicianLevel.level;
  const currentXP = technicianLevel.xp;
  const threshold = XP_THRESHOLDS[currentLevel];

  // Calculate progress percentage
  let progress = 0;
  let xpToNextLevel = 0;
  let xpInCurrentLevel = 0;

  if (currentLevel === 3) {
    // Level 3 -> Level 2: 0-1000 XP
    xpInCurrentLevel = currentXP;
    xpToNextLevel = 1000 - currentXP;
    progress = (currentXP / 1000) * 100;
  } else if (currentLevel === 2) {
    // Level 2 -> Level 1: 1000-3000 XP
    xpInCurrentLevel = currentXP - 1000;
    xpToNextLevel = 3000 - currentXP;
    progress = ((currentXP - 1000) / 2000) * 100;
  } else {
    // Level 1: Max level, no progression needed
    progress = 100;
    xpToNextLevel = 0;
    xpInCurrentLevel = currentXP - 3000;
  }

  const isMaxLevel = currentLevel === 1;

  return (
    <Card className="p-3 bg-card/80 backdrop-blur border-border">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-terminal-amber" />
          <span className="font-mono text-sm font-bold text-terminal-green">
            {threshold.label}
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-terminal-amber border-terminal-amber">
          Level {currentLevel}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendUp className="w-3 h-3" />
            {currentXP} XP
          </span>
          {!isMaxLevel && (
            <span>{xpToNextLevel} XP to Level {currentLevel - 1}</span>
          )}
          {isMaxLevel && (
            <span className="text-terminal-green">Max Level!</span>
          )}
        </div>
        
        <Progress 
          value={progress} 
          className="h-2"
        />

        {!isMaxLevel && (
          <div className="text-xs font-mono text-muted-foreground text-center">
            {Math.floor(progress)}% complete
          </div>
        )}
      </div>
    </Card>
  );
}
