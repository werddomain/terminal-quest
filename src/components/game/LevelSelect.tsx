import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Trophy, Clock, Lightbulb, Target, Lock, CheckCircle, Play } from '@phosphor-icons/react';
import type { Level, GameProgress } from '@/lib/types';
import { levels } from '@/lib/levels';

interface LevelSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: GameProgress;
  onSelectLevel: (levelId: number) => void;
}

export function LevelSelect({ open, onOpenChange, progress, onSelectLevel }: LevelSelectProps) {
  const isLevelUnlocked = (levelId: number) => {
    if (levelId === 1) return true;
    return progress.completedLevels.includes(levelId - 1);
  };

  const getLevelScore = (levelId: number) => {
    return progress.scores[levelId];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-terminal-green flex items-center gap-2">
            <Target className="w-6 h-6" />
            Select Level
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground">
            Complete levels to unlock new challenges. Total Score: {progress.totalScore}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {levels.map((level) => {
            const unlocked = isLevelUnlocked(level.id);
            const score = getLevelScore(level.id);
            const completed = progress.completedLevels.includes(level.id);

            return (
              <Card
                key={level.id}
                className={`p-4 cursor-pointer transition-all border ${
                  unlocked
                    ? 'border-border hover:border-terminal-green/50 hover:bg-secondary/50'
                    : 'border-border/50 opacity-60 cursor-not-allowed'
                } ${completed ? 'bg-terminal-green/5' : ''}`}
                onClick={() => unlocked && onSelectLevel(level.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {completed ? (
                      <CheckCircle className="w-5 h-5 text-terminal-green" weight="fill" />
                    ) : unlocked ? (
                      <Play className="w-5 h-5 text-terminal-amber" weight="fill" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span className="font-mono font-bold text-sm">
                      Level {level.id}
                    </span>
                  </div>
                  
                  {score && (
                    <Badge variant="outline" className="font-mono text-xs border-terminal-amber text-terminal-amber">
                      <Trophy className="w-3 h-3 mr-1" />
                      {score.score}
                    </Badge>
                  )}
                </div>

                <h3 className="font-mono text-foreground mb-1">{level.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {level.description}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-terminal-amber" />
                    {level.baseScore} pts
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(level.timeLimitSeconds / 60)}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {level.maxHints} hints
                  </span>
                </div>

                {!unlocked && (
                  <div className="mt-2 text-xs font-mono text-terminal-red">
                    Complete Level {level.id - 1} to unlock
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="font-mono"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
