import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Trophy, Clock, Target, Warning } from '@phosphor-icons/react';
import type { Level, LevelState } from '@/lib/types';

interface GameHUDProps {
  level: Level;
  levelState: LevelState;
  elapsedTime: number;
  onHintRequest: () => void;
  totalScore: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function GameHUD({ level, levelState, elapsedTime, onHintRequest, totalScore }: GameHUDProps) {
  const hintsRemaining = level.maxHints - levelState.hintsUsed;
  const timeProgress = Math.min((elapsedTime / level.timeLimitSeconds) * 100, 100);
  const isOverTime = elapsedTime > level.timeLimitSeconds;

  const calculateCurrentScore = () => {
    let score = level.baseScore;
    
    if (!isOverTime) {
      const timeRatio = 1 - (elapsedTime / level.timeLimitSeconds);
      score += Math.floor(level.timeBonus * timeRatio);
    }
    
    score -= levelState.hintsUsed * 25;
    score -= Math.floor(levelState.attempts * 5);
    
    return Math.max(0, score);
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4 bg-card/80 backdrop-blur border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-terminal-green" />
            <span className="font-mono text-sm font-bold text-terminal-green">
              Level {level.id}: {level.title}
            </span>
          </div>
          <Badge variant="outline" className="font-mono text-terminal-amber border-terminal-amber">
            <Trophy className="w-3 h-3 mr-1" />
            {totalScore}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 font-mono">
          {level.objective}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 flex-1">
            <Clock className={`w-4 h-4 ${isOverTime ? 'text-terminal-red' : 'text-terminal-amber'}`} />
            <span className={isOverTime ? 'text-terminal-red' : 'text-muted-foreground'}>
              {formatTime(elapsedTime)}
            </span>
            <Progress 
              value={timeProgress} 
              className="flex-1 h-1.5"
            />
          </div>
          
          <div className="flex items-center gap-1 text-terminal-amber">
            <Trophy className="w-4 h-4" />
            <span>~{calculateCurrentScore()}</span>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-card/80 backdrop-blur border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-terminal-amber" />
            <span className="font-mono text-xs text-muted-foreground">
              Hints: {hintsRemaining}/{level.maxHints}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onHintRequest}
            disabled={hintsRemaining <= 0}
            className="font-mono text-xs border-terminal-amber/50 hover:border-terminal-amber hover:bg-terminal-amber/10"
          >
            <Lightbulb className="w-3 h-3 mr-1" />
            Get Hint (-25 pts)
          </Button>
        </div>

        {levelState.hintsRevealed.length > 0 && (
          <div className="mt-3 space-y-2">
            {levelState.hintsRevealed.map((hint, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono">
                <Warning className="w-3 h-3 text-terminal-amber mt-0.5 shrink-0" />
                <span className="text-muted-foreground">{hint}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
