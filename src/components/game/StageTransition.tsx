import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, Briefcase, Target, CheckCircle } from '@phosphor-icons/react';
import { level3Tickets } from '@/lib/tickets';

interface StageTransitionProps {
  open: boolean;
  onTransition: () => void;
}

export function StageTransition({ open, onTransition }: StageTransitionProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl bg-card border-border" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl text-terminal-green flex items-center gap-2 justify-center">
            <CheckCircle className="w-8 h-8" weight="fill" />
            Hobbyist Stage Complete!
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground text-center">
            You've mastered the fundamentals of Linux
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-6">
          <Card className="p-6 bg-terminal-green/10 border-terminal-green/30">
            <div className="flex items-start gap-4">
              <Trophy className="w-12 h-12 text-terminal-amber mt-1" />
              <div>
                <h3 className="font-mono font-bold text-lg text-terminal-green mb-2">
                  Congratulations!
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  You've successfully completed all 15 hobbyist missions and demonstrated 
                  proficiency in essential Linux commands and system administration basics.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-terminal-amber/10 border-terminal-amber/30">
            <div className="flex items-start gap-4">
              <Briefcase className="w-12 h-12 text-terminal-amber mt-1" />
              <div>
                <h3 className="font-mono font-bold text-lg text-terminal-amber mb-2">
                  Welcome to the Technician Stage
                </h3>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed mb-4">
                  You're now entering the technician career system. This is a simulation of 
                  real IT support work where you'll:
                </p>
                <ul className="space-y-2 font-mono text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-terminal-green mt-0.5 shrink-0" />
                    <span>Accept and complete support tickets from a random pool</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-terminal-green mt-0.5 shrink-0" />
                    <span>Earn XP to progress from Junior to Senior Technician</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-terminal-green mt-0.5 shrink-0" />
                    <span>Connect to remote servers via SSH</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Target className="w-4 h-4 text-terminal-green mt-0.5 shrink-0" />
                    <span>Face time-limited challenges with XP rewards and penalties</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/50 border-border">
            <div className="font-mono text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Starting Level:</span>
                <span className="text-terminal-green font-bold">Level 3 - Junior Technician</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Starting XP:</span>
                <span className="text-terminal-green font-bold">0 / 1000 XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Available Tickets:</span>
                <span className="text-terminal-green font-bold">{level3Tickets.length} Junior Level Tasks</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onTransition}
            className="font-mono bg-terminal-green hover:bg-terminal-green/90 text-black px-8 py-6 text-lg"
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Start Technician Career
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
