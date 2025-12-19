import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Clock, Target, ArrowsClockwise, CheckCircle, Warning } from '@phosphor-icons/react';
import type { Ticket, TechnicianLevel } from '@/lib/types';
import { getAvailableTickets } from '@/lib/tickets';

interface TicketSelectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  technicianLevel: TechnicianLevel;
  onSelectTicket: (ticket: Ticket) => void;
  completedTickets: string[];
}

export function TicketSelect({ 
  open, 
  onOpenChange, 
  technicianLevel, 
  onSelectTicket,
  completedTickets 
}: TicketSelectProps) {
  const [availableTickets, setAvailableTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const refreshTickets = () => {
    const tickets = getAvailableTickets(technicianLevel.level, 5);
    setAvailableTickets(tickets);
    setSelectedTicket(null);
  };

  useEffect(() => {
    if (open) {
      refreshTickets();
    }
  }, [open, technicianLevel.level]);

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

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  const handleAcceptTicket = () => {
    if (selectedTicket) {
      onSelectTicket(selectedTicket);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-card border-border max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-terminal-green flex items-center gap-2">
            <Target className="w-6 h-6" />
            Available Support Tickets
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground">
            Select a ticket to start working. Level {technicianLevel.level} Technician ({getDifficultyLabel(technicianLevel.level)})
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 mt-4">
          {/* Ticket List */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-sm text-muted-foreground">
                {availableTickets.length} tickets available
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshTickets}
                className="font-mono text-xs border-terminal-green/50 hover:border-terminal-green"
              >
                <ArrowsClockwise className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>

            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {availableTickets.map((ticket) => {
                  const isCompleted = completedTickets.includes(ticket.id);
                  const isSelected = selectedTicket?.id === ticket.id;

                  return (
                    <Card
                      key={ticket.id}
                      className={`p-3 cursor-pointer transition-all border ${
                        isSelected
                          ? 'border-terminal-green bg-terminal-green/10'
                          : 'border-border hover:border-terminal-green/50 hover:bg-secondary/50'
                      } ${isCompleted ? 'opacity-60' : ''}`}
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-terminal-green" weight="fill" />
                          )}
                          <span className="font-mono font-bold text-sm">
                            {ticket.id}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={`font-mono text-xs ${getDifficultyColor(ticket.difficulty)}`}
                          >
                            L{ticket.difficulty}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs border-terminal-amber text-terminal-amber">
                            <Trophy className="w-3 h-3 mr-1" />
                            {ticket.xpReward} XP
                          </Badge>
                        </div>
                      </div>

                      <h3 className="font-mono text-sm text-foreground mb-1">{ticket.title}</h3>
                      
                      <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(ticket.timeLimit)}
                        </span>
                        {!ticket.canFail && (
                          <span className="flex items-center gap-1 text-terminal-amber">
                            <Warning className="w-3 h-3" />
                            Cannot fail
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Ticket Details */}
          <div className="w-96">
            {selectedTicket ? (
              <Card className="p-4 border-border h-[400px] flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-sm">{selectedTicket.id}</span>
                      <Badge 
                        variant="outline" 
                        className={`font-mono text-xs ${getDifficultyColor(selectedTicket.difficulty)}`}
                      >
                        {getDifficultyLabel(selectedTicket.difficulty)}
                      </Badge>
                    </div>
                    <h3 className="font-mono text-lg text-terminal-green">{selectedTicket.title}</h3>
                  </div>
                </div>

                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-3 font-mono leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <Trophy className="w-4 h-4 text-terminal-amber" />
                        <span className="text-muted-foreground">Reward:</span>
                        <span className="text-terminal-green">+{selectedTicket.xpReward} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <Warning className="w-4 h-4 text-terminal-red" />
                        <span className="text-muted-foreground">Penalty:</span>
                        <span className="text-terminal-red">-{selectedTicket.xpPenalty} XP</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <Clock className="w-4 h-4 text-terminal-amber" />
                        <span className="text-muted-foreground">Time Limit:</span>
                        <span>{formatTime(selectedTicket.timeLimit)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-mono">
                        <Target className="w-4 h-4 text-terminal-green" />
                        <span className="text-muted-foreground">Server:</span>
                        <span className="text-terminal-green">{selectedTicket.sshHost}</span>
                      </div>
                    </div>

                    {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTicket.tags.map((tag) => (
                          <Badge 
                            key={tag} 
                            variant="outline" 
                            className="font-mono text-xs border-terminal-green/30 text-terminal-green/80"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedTicket(null)}
                    className="flex-1 font-mono"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleAcceptTicket}
                    className="flex-1 font-mono bg-terminal-green hover:bg-terminal-green/90 text-black"
                  >
                    Accept Ticket
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-4 border-border h-[400px] flex items-center justify-center">
                <div className="text-center text-muted-foreground font-mono text-sm">
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a ticket to view details</p>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
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
