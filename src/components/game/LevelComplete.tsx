import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Lightbulb, Target, ArrowRight, ArrowCounterClockwise } from '@phosphor-icons/react';
import type { LevelScore, Level } from '@/lib/types';
import { motion } from 'framer-motion';

interface LevelCompleteProps {
  open: boolean;
  level: Level;
  score: LevelScore;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onRetry: () => void;
  onLevelSelect: () => void;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function LevelComplete({ 
  open, 
  level, 
  score, 
  hasNextLevel, 
  onNextLevel, 
  onRetry,
  onLevelSelect 
}: LevelCompleteProps) {
  const getGrade = () => {
    const maxScore = level.baseScore + level.timeBonus;
    const percentage = (score.score / maxScore) * 100;
    
    if (percentage >= 90) return { grade: 'S', color: 'text-terminal-amber' };
    if (percentage >= 75) return { grade: 'A', color: 'text-terminal-green' };
    if (percentage >= 60) return { grade: 'B', color: 'text-terminal-blue' };
    if (percentage >= 40) return { grade: 'C', color: 'text-muted-foreground' };
    return { grade: 'D', color: 'text-terminal-red' };
  };

  const { grade, color } = getGrade();

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-card border-border [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-terminal-green flex items-center gap-2 justify-center">
            <Trophy className="w-6 h-6 text-terminal-amber" weight="fill" />
            Level Complete!
          </DialogTitle>
          <DialogDescription className="font-mono text-center text-muted-foreground">
            {level.title}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            className={`text-8xl font-mono font-bold ${color} mb-4`}
          >
            {grade}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-mono font-bold text-terminal-amber flex items-center gap-2"
          >
            <Trophy className="w-8 h-8" />
            {score.score}
          </motion.div>
          <span className="text-sm font-mono text-muted-foreground">points</span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold">
              <Clock className="w-4 h-4 text-terminal-blue" />
              {formatTime(score.time)}
            </div>
            <span className="text-xs font-mono text-muted-foreground">Time</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold">
              <Lightbulb className="w-4 h-4 text-terminal-amber" />
              {score.hintsUsed}
            </div>
            <span className="text-xs font-mono text-muted-foreground">Hints</span>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-lg font-mono font-bold">
              <Target className="w-4 h-4 text-terminal-green" />
              {score.attempts}
            </div>
            <span className="text-xs font-mono text-muted-foreground">Attempts</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {hasNextLevel && (
            <Button
              onClick={onNextLevel}
              className="w-full font-mono bg-terminal-green text-primary-foreground hover:bg-terminal-green/90"
              autoFocus={false}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Next Level
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onRetry}
              className="flex-1 font-mono"
            >
              <ArrowCounterClockwise className="w-4 h-4 mr-2" />
              Retry
            </Button>
            
            <Button
              variant="outline"
              onClick={onLevelSelect}
              className="flex-1 font-mono"
            >
              <Target className="w-4 h-4 mr-2" />
              Levels
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
