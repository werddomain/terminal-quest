import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, CheckCircle, Clock, TrendUp, Warning, XCircle } from '@phosphor-icons/react';
import type { ActiveTicket } from '@/lib/types';

interface TicketCompleteProps {
  open: boolean;
  onClose: () => void;
  activeTicket: ActiveTicket;
  success: boolean;
  elapsedTime: number;
  xpGained: number;
  newXP: number;
  leveledUp: boolean;
  newLevel?: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TicketComplete({ 
  open, 
  onClose, 
  activeTicket, 
  success, 
  elapsedTime, 
  xpGained,
  newXP,
  leveledUp,
  newLevel
}: TicketCompleteProps) {
  const ticket = activeTicket.ticket;
  const isOverTime = elapsedTime > ticket.timeLimit;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className={`font-mono text-xl flex items-center gap-2 ${success ? 'text-terminal-green' : 'text-terminal-red'}`}>
            {success ? (
              <>
                <CheckCircle className="w-6 h-6" weight="fill" />
                Ticket Completed!
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6" weight="fill" />
                Ticket Failed
              </>
            )}
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground">
            {ticket.id}: {ticket.title}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* XP Summary */}
          <Card className={`p-4 ${success ? 'bg-terminal-green/10 border-terminal-green/30' : 'bg-terminal-red/10 border-terminal-red/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className={`w-8 h-8 ${success ? 'text-terminal-amber' : 'text-terminal-red'}`} />
                <div>
                  <div className="font-mono text-2xl font-bold text-terminal-amber">
                    {success ? '+' : ''}{xpGained} XP
                  </div>
                  <div className="font-mono text-xs text-muted-foreground">
                    {success ? 'Reward earned' : 'Penalty applied'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm text-muted-foreground">Total XP</div>
                <div className="font-mono text-xl font-bold text-terminal-green">{newXP}</div>
              </div>
            </div>

            {leveledUp && newLevel && (
              <div className="pt-3 border-t border-border">
                <div className="flex items-center gap-2 font-mono text-terminal-amber">
                  <TrendUp className="w-5 h-5" weight="bold" />
                  <span className="font-bold">Level Up! You are now Level {newLevel}</span>
                </div>
              </div>
            )}
          </Card>

          {/* Stats */}
          <Card className="p-4 bg-card/50 border-border">
            <div className="space-y-3 font-mono text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Time Taken:</span>
                </div>
                <span className={isOverTime ? 'text-terminal-red' : 'text-terminal-green'}>
                  {formatTime(elapsedTime)}
                  {isOverTime && ' (Over time)'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Time Limit:</span>
                </div>
                <span>{formatTime(ticket.timeLimit)}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span>Hints Used:</span>
                </div>
                <span>{activeTicket.hintsUsed}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Warning className="w-4 h-4" />
                  <span>Attempts:</span>
                </div>
                <span>{activeTicket.attempts}</span>
              </div>
            </div>
          </Card>

          {!success && (
            <Card className="p-3 bg-terminal-amber/10 border-terminal-amber/30">
              <div className="flex items-start gap-2">
                <Warning className="w-5 h-5 text-terminal-amber mt-0.5 shrink-0" />
                <div className="font-mono text-sm text-muted-foreground">
                  {ticket.canFail 
                    ? "Don't give up! Try another ticket to earn back XP."
                    : "This task was abandoned. No failure penalty applied."}
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <Button
            onClick={onClose}
            className="font-mono bg-terminal-green hover:bg-terminal-green/90 text-black px-8"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
