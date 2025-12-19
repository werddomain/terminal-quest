import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Lightbulb, Trophy, Clock, Target, Warning, XCircle } from '@phosphor-icons/react';
import type { ActiveTicket } from '@/lib/types';

interface TicketHUDProps {
  activeTicket: ActiveTicket;
  elapsedTime: number;
  onHintRequest: () => void;
  onAbandonTicket: () => void;
  currentXP: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TicketHUD({ 
  activeTicket, 
  elapsedTime, 
  onHintRequest, 
  onAbandonTicket,
  currentXP 
}: TicketHUDProps) {
  const ticket = activeTicket.ticket;
  const hintsRemaining = ticket.hints.length - activeTicket.hintsUsed;
  const timeProgress = Math.min((elapsedTime / ticket.timeLimit) * 100, 100);
  const isOverTime = elapsedTime > ticket.timeLimit;

  const getDifficultyColor = (difficulty: 1 | 2 | 3) => {
    switch (difficulty) {
      case 1: return 'text-terminal-red border-terminal-red';
      case 2: return 'text-terminal-amber border-terminal-amber';
      case 3: return 'text-terminal-green border-terminal-green';
    }
  };

  const getDifficultyLabel = (difficulty: 1 | 2 | 3) => {
    switch (difficulty) {
      case 1: return 'Senior';
      case 2: return 'Intermediate';
      case 3: return 'Junior';
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="p-4 bg-card/80 backdrop-blur border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-terminal-green" />
            <span className="font-mono text-sm font-bold text-terminal-green">
              {ticket.id}: {ticket.title}
            </span>
            <Badge 
              variant="outline" 
              className={`font-mono text-xs ${getDifficultyColor(ticket.difficulty)}`}
            >
              {getDifficultyLabel(ticket.difficulty)}
            </Badge>
          </div>
          <Badge variant="outline" className="font-mono text-terminal-amber border-terminal-amber">
            <Trophy className="w-3 h-3 mr-1" />
            {currentXP} XP
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 font-mono">
          {ticket.description}
        </p>

        <div className="flex items-center gap-4 text-xs font-mono mb-3">
          <div className="flex items-center gap-2 flex-1">
            <Clock className={`w-4 h-4 ${isOverTime ? 'text-terminal-red' : 'text-terminal-amber'}`} />
            <span className={isOverTime ? 'text-terminal-red' : 'text-muted-foreground'}>
              {formatTime(elapsedTime)} / {formatTime(ticket.timeLimit)}
            </span>
            <Progress 
              value={timeProgress} 
              className="flex-1 h-1.5"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1 text-terminal-green">
            <Trophy className="w-4 h-4" />
            <span>Reward: +{ticket.xpReward} XP</span>
          </div>
          <div className="flex items-center gap-1 text-terminal-red">
            <Warning className="w-4 h-4" />
            <span>Penalty: -{ticket.xpPenalty} XP</span>
          </div>
        </div>

        {isOverTime && (
          <div className="mt-3 p-2 bg-terminal-red/10 border border-terminal-red/30 rounded">
            <div className="flex items-center gap-2 text-terminal-red text-xs font-mono">
              <Warning className="w-4 h-4" />
              <span>Time limit exceeded! Complete ticket or abandon to avoid penalty.</span>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-3 bg-card/80 backdrop-blur border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-terminal-amber" />
            <span className="font-mono text-xs text-muted-foreground">
              Hints: {hintsRemaining} available
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onHintRequest}
              disabled={hintsRemaining <= 0}
              className="font-mono text-xs border-terminal-amber/50 hover:border-terminal-amber hover:bg-terminal-amber/10"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Hint
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onAbandonTicket}
              className="font-mono text-xs border-terminal-red/50 hover:border-terminal-red hover:bg-terminal-red/10 text-terminal-red"
            >
              <XCircle className="w-3 h-3 mr-1" />
              Abandon
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-3 bg-terminal-green/10 border-terminal-green/30">
        <div className="flex items-start gap-2">
          <Target className="w-4 h-4 text-terminal-green mt-0.5 shrink-0" />
          <div className="font-mono text-sm text-terminal-green">
            <div className="font-bold mb-1">Server: {ticket.sshHost}</div>
            <div className="text-xs text-muted-foreground">
              Use: ssh user@{ticket.sshHost}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
