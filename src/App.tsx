import { useState, useEffect, useCallback } from 'react';
import { useKV } from '@github/spark/hooks';
import { Terminal } from '@/components/terminal/Terminal';
import { Editor } from '@/components/terminal/Editor';
import { GameHUD } from '@/components/game/GameHUD';
import { TicketHUD } from '@/components/game/TicketHUD';
import { XPBar } from '@/components/game/XPBar';
import { LevelSelect } from '@/components/game/LevelSelect';
import { LevelComplete } from '@/components/game/LevelComplete';
import { TicketSelect } from '@/components/game/TicketSelect';
import { TicketComplete } from '@/components/game/TicketComplete';
import { StageTransition } from '@/components/game/StageTransition';
import { CertificateInstall } from '@/components/game/CertificateInstall';
import { Button } from '@/components/ui/button';
import { List, House, Info, Briefcase } from '@phosphor-icons/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { levels } from '@/lib/levels';
import type { TerminalState, GameProgress, LevelState, LevelScore, ActiveTicket, Ticket, TechnicianLevel } from '@/lib/types';
import { toast, Toaster } from 'sonner';

const DEFAULT_PROGRESS: GameProgress = {
  currentLevel: 1,
  completedLevels: [],
  scores: {},
  totalScore: 0,
  stage: 'hobbyist',
  technicianLevel: undefined,
  completedTickets: [],
  sshCertificates: []
};

function App() {
  const [progressData, setProgress] = useKV<GameProgress>('terminal-quest-progress', DEFAULT_PROGRESS);
  const progress = progressData ?? DEFAULT_PROGRESS;
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [showTicketSelect, setShowTicketSelect] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showComplete, setShowComplete] = useState(false);
  const [showTicketComplete, setShowTicketComplete] = useState(false);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [showCertificateInstall, setShowCertificateInstall] = useState(false);
  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTicket, setActiveTicket] = useState<ActiveTicket | null>(null);
  const [ticketXPGained, setTicketXPGained] = useState(0);
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const currentLevel = levels.find(l => l.id === currentLevelId) || levels[0];
  const isHobbyistStage = progress.stage === 'hobbyist';
  const isTechnicianStage = progress.stage === 'technician';

  const [terminalState, setTerminalState] = useState<TerminalState>(() => ({
    currentDirectory: currentLevel.initialDirectory,
    fileSystem: JSON.parse(JSON.stringify(currentLevel.fileSystem)),
    commandHistory: [],
    outputHistory: [],
    installedPackages: currentLevel.installedPackages || [],
    env: {},
    editingFile: null,
    editingContent: ''
  }));

  const [levelState, setLevelState] = useState<LevelState>(() => ({
    startTime: Date.now(),
    hintsUsed: 0,
    hintsRevealed: [],
    attempts: 0,
    completed: false
  }));

  const [completedScore, setCompletedScore] = useState<LevelScore | null>(null);

  useEffect(() => {
    if (progress.currentLevel) {
      setCurrentLevelId(progress.currentLevel);
    }
  }, []);

  useEffect(() => {
    if (!isPlaying || levelState.completed) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - levelState.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, levelState.startTime, levelState.completed]);

  useEffect(() => {
    if (!isPlaying || levelState.completed) return;

    const won = currentLevel.checkWinCondition(terminalState);
    if (won) {
      handleLevelComplete();
    }
  }, [terminalState, isPlaying, levelState.completed, currentLevel]);

  const handleLevelComplete = useCallback(() => {
    const finalTime = Math.floor((Date.now() - levelState.startTime) / 1000);
    
    let score = currentLevel.baseScore;
    
    if (finalTime <= currentLevel.timeLimitSeconds) {
      const timeRatio = 1 - (finalTime / currentLevel.timeLimitSeconds);
      score += Math.floor(currentLevel.timeBonus * timeRatio);
    }
    
    score -= levelState.hintsUsed * 25;
    score -= Math.floor(levelState.attempts * 5);
    score = Math.max(0, score);

    const levelScore: LevelScore = {
      score,
      time: finalTime,
      hintsUsed: levelState.hintsUsed,
      attempts: levelState.attempts,
      completed: true
    };

    setCompletedScore(levelScore);
    setLevelState(prev => ({ ...prev, completed: true }));

    const existingScore = progress.scores[currentLevelId]?.score || 0;
    const isNewHighScore = score > existingScore;

    setProgress((prev): GameProgress => {
      const current = prev ?? DEFAULT_PROGRESS;
      return {
        ...current,
        completedLevels: current.completedLevels.includes(currentLevelId) 
          ? current.completedLevels 
          : [...current.completedLevels, currentLevelId],
        scores: {
          ...current.scores,
          [currentLevelId]: isNewHighScore ? levelScore : current.scores[currentLevelId]
        },
        totalScore: isNewHighScore 
          ? current.totalScore - existingScore + score 
          : current.totalScore
      };
    });

    setShowComplete(true);
    
    if (isNewHighScore && existingScore > 0) {
      toast.success('New High Score!', { description: `+${score - existingScore} points improvement` });
    }
  }, [currentLevel, levelState, progress, currentLevelId, setProgress]);

  // Check for stage transition after completing level 15
  useEffect(() => {
    if (showComplete && currentLevelId === 15 && isHobbyistStage && !showStageTransition) {
      // Delay to show completion dialog first
      const timer = setTimeout(() => {
        setShowStageTransition(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showComplete, currentLevelId, isHobbyistStage, showStageTransition]);

  // Check for ticket completion
  useEffect(() => {
    if (!isPlaying || !activeTicket || levelState.completed) return;

    const won = activeTicket.ticket.checkWinCondition(terminalState);
    if (won) {
      handleTicketComplete(true);
    }
  }, [terminalState, isPlaying, activeTicket, levelState.completed]);

  const handleStageTransition = useCallback(() => {
    setProgress((prev): GameProgress => {
      const current = prev ?? DEFAULT_PROGRESS;
      return {
        ...current,
        stage: 'technician',
        technicianLevel: {
          level: 3,
          xp: 0
        },
        sshCertificates: ['level-3']
      };
    });
    setShowStageTransition(false);
    setShowComplete(false);
    toast.success('Welcome to the Technician Stage!');
  }, [setProgress]);

  const handleTicketComplete = useCallback((success: boolean) => {
    if (!activeTicket) return;

    const finalTime = Math.floor((Date.now() - levelState.startTime) / 1000);
    const ticket = activeTicket.ticket;
    
    let xpChange = 0;
    if (success) {
      xpChange = ticket.xpReward;
    } else {
      // Apply penalty only if ticket can fail
      xpChange = ticket.canFail ? -ticket.xpPenalty : 0;
    }

    const currentXP = progress.technicianLevel?.xp || 0;
    const newXP = Math.max(0, currentXP + xpChange);
    const currentTechLevel = progress.technicianLevel?.level || 3;
    
    // Check for level up
    let newLevel = currentTechLevel;
    let leveledUp = false;
    
    if (currentTechLevel === 3 && newXP >= 1000) {
      newLevel = 2;
      leveledUp = true;
    } else if (currentTechLevel === 2 && newXP >= 3000) {
      newLevel = 1;
      leveledUp = true;
    }

    setTicketXPGained(xpChange);
    setTicketSuccess(success);
    setLevelState(prev => ({ ...prev, completed: true }));

    setProgress((prev): GameProgress => {
      const current = prev ?? DEFAULT_PROGRESS;
      return {
        ...current,
        technicianLevel: {
          level: newLevel as 1 | 2 | 3,
          xp: newXP
        },
        completedTickets: success 
          ? [...(current.completedTickets || []), ticket.id]
          : current.completedTickets,
        sshCertificates: leveledUp && newLevel !== currentTechLevel
          ? [...(current.sshCertificates || []), `level-${newLevel}`]
          : current.sshCertificates
      };
    });

    setShowTicketComplete(true);
    
    // Show certificate install dialog if leveled up
    if (leveledUp) {
      setTimeout(() => {
        setShowCertificateInstall(true);
      }, 2000);
    }

    if (success) {
      toast.success('Ticket Completed!', { description: `+${xpChange} XP` });
    } else {
      toast.error('Ticket Failed', { description: xpChange < 0 ? `${xpChange} XP` : 'No penalty' });
    }
  }, [activeTicket, levelState, progress, setProgress]);

  const handleAbandonTicket = useCallback(() => {
    if (!activeTicket) return;
    handleTicketComplete(false);
  }, [activeTicket, handleTicketComplete]);

  const startLevel = useCallback((levelId: number) => {
    const level = levels.find(l => l.id === levelId) || levels[0];
    
    setCurrentLevelId(levelId);
    setTerminalState({
      currentDirectory: level.initialDirectory,
      fileSystem: JSON.parse(JSON.stringify(level.fileSystem)),
      commandHistory: [],
      outputHistory: [],
      installedPackages: level.installedPackages || [],
      env: {},
      editingFile: null,
      editingContent: ''
    });
    setLevelState({
      startTime: Date.now(),
      hintsUsed: 0,
      hintsRevealed: [],
      attempts: 0,
      completed: false
    });
    setElapsedTime(0);
    setIsPlaying(true);
    setShowLevelSelect(false);
    setShowComplete(false);
    setCompletedScore(null);
    setShowIntro(false);
    
    setProgress((prev): GameProgress => {
      const current = prev ?? DEFAULT_PROGRESS;
      return {
        ...current,
        currentLevel: levelId
      };
    });
  }, [setProgress]);

  const startTicket = useCallback((ticket: Ticket) => {
    setActiveTicket({
      ticket,
      startTime: Date.now(),
      hintsUsed: 0,
      attempts: 0
    });
    setTerminalState({
      currentDirectory: ticket.initialDirectory,
      fileSystem: JSON.parse(JSON.stringify(ticket.fileSystem)),
      commandHistory: [],
      outputHistory: [],
      installedPackages: [],
      env: {},
      editingFile: null,
      editingContent: '',
      sshConnected: false,
      sshHost: undefined
    });
    setLevelState({
      startTime: Date.now(),
      hintsUsed: 0,
      hintsRevealed: [],
      attempts: 0,
      completed: false
    });
    setElapsedTime(0);
    setIsPlaying(true);
    setShowTicketSelect(false);
    setShowTicketComplete(false);
    setShowIntro(false);
    
    toast.info('Ticket started', { description: 'Connect to the server and complete the task' });
  }, []);

  const handleTerminalStateChange = useCallback((newState: Partial<TerminalState>) => {
    setTerminalState(prev => ({ ...prev, ...newState }));
    
    if (newState.commandHistory && newState.commandHistory.length > terminalState.commandHistory.length) {
      setLevelState(prev => ({ ...prev, attempts: prev.attempts + 1 }));
    }
  }, [terminalState.commandHistory.length]);

  const handleHintRequest = useCallback(() => {
    const hints = activeTicket ? activeTicket.ticket.hints : currentLevel.hints;
    const maxHints = activeTicket ? activeTicket.ticket.hints.length : currentLevel.maxHints;
    
    if (levelState.hintsUsed >= maxHints) {
      toast.error('No hints remaining!');
      return;
    }

    const nextHint = hints[levelState.hintsUsed];
    if (nextHint) {
      setLevelState(prev => ({
        ...prev,
        hintsUsed: prev.hintsUsed + 1,
        hintsRevealed: [...prev.hintsRevealed, nextHint]
      }));
      
      if (activeTicket) {
        setActiveTicket(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
      }
      
      setTerminalState(prev => ({
        ...prev,
        outputHistory: [...prev.outputHistory, {
          text: `💡 HINT: ${nextHint}`,
          type: 'info'
        }]
      }));
      
      toast.info('Hint revealed');
    }
  }, [levelState.hintsUsed, currentLevel, activeTicket]);

  const handleNextLevel = useCallback(() => {
    // Guard: only proceed if the completion dialog is actually shown
    if (!showComplete || !completedScore) {
      return;
    }
    
    const nextLevelId = currentLevelId + 1;
    if (nextLevelId <= levels.length) {
      startLevel(nextLevelId);
    }
  }, [currentLevelId, startLevel, showComplete, completedScore]);

  const handleEditorClose = useCallback(() => {
    setTerminalState(prev => ({
      ...prev,
      editingFile: null,
      editingContent: ''
    }));
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Toaster theme="dark" position="top-center" />
      
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-terminal-green">
            {'>'} Terminal Quest
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowIntro(true)}
            className="font-mono text-xs"
          >
            <Info className="w-4 h-4" />
          </Button>
          {isHobbyistStage ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => startLevel(1)}
                className="font-mono text-xs"
              >
                <House className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLevelSelect(true)}
                className="font-mono text-xs"
              >
                <List className="w-4 h-4 mr-1" />
                Levels
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTicketSelect(true)}
              className="font-mono text-xs border-terminal-green/50 hover:border-terminal-green"
            >
              <Briefcase className="w-4 h-4 mr-1" />
              Tickets
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
        <div className="lg:w-80 shrink-0">
          {isTechnicianStage && progress.technicianLevel && (
            <div className="mb-3">
              <XPBar technicianLevel={progress.technicianLevel} />
            </div>
          )}
          
          {activeTicket && isTechnicianStage ? (
            <TicketHUD
              activeTicket={activeTicket}
              elapsedTime={elapsedTime}
              onHintRequest={handleHintRequest}
              onAbandonTicket={handleAbandonTicket}
              currentXP={progress.technicianLevel?.xp || 0}
            />
          ) : (
            <GameHUD
              level={currentLevel}
              levelState={levelState}
              elapsedTime={elapsedTime}
              onHintRequest={handleHintRequest}
              totalScore={progress.totalScore}
            />
          )}
        </div>
        
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <Terminal
            state={terminalState}
            onStateChange={handleTerminalStateChange}
            level={currentLevel}
            onHintRequest={handleHintRequest}
            disabled={!isPlaying || levelState.completed}
          />
          
          {terminalState.editingFile && (
            <Editor
              state={terminalState}
              onStateChange={handleTerminalStateChange}
              onClose={handleEditorClose}
            />
          )}
        </div>
      </main>

      <LevelSelect
        open={showLevelSelect}
        onOpenChange={setShowLevelSelect}
        progress={progress}
        onSelectLevel={startLevel}
      />

      {completedScore && (
        <LevelComplete
          open={showComplete}
          level={currentLevel}
          score={completedScore}
          hasNextLevel={currentLevelId < levels.length}
          onNextLevel={handleNextLevel}
          onRetry={() => startLevel(currentLevelId)}
          onLevelSelect={() => {
            setShowComplete(false);
            setShowLevelSelect(true);
          }}
        />
      )}

      {isTechnicianStage && progress.technicianLevel && (
        <>
          <TicketSelect
            open={showTicketSelect}
            onOpenChange={setShowTicketSelect}
            technicianLevel={progress.technicianLevel}
            onSelectTicket={startTicket}
            completedTickets={progress.completedTickets || []}
          />

          {activeTicket && (
            <TicketComplete
              open={showTicketComplete}
              onClose={() => {
                setShowTicketComplete(false);
                setActiveTicket(null);
                setIsPlaying(false);
              }}
              activeTicket={activeTicket}
              success={ticketSuccess}
              elapsedTime={elapsedTime}
              xpGained={ticketXPGained}
              newXP={progress.technicianLevel.xp}
              leveledUp={showCertificateInstall}
              newLevel={progress.technicianLevel.level}
            />
          )}

          {showCertificateInstall && (
            <CertificateInstall
              open={showCertificateInstall}
              onClose={() => setShowCertificateInstall(false)}
              technicianLevel={progress.technicianLevel.level}
            />
          )}
        </>
      )}

      <StageTransition
        open={showStageTransition}
        onTransition={handleStageTransition}
      />

      <Dialog open={showIntro} onOpenChange={setShowIntro}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-mono text-xl text-terminal-green flex items-center gap-2">
              {'>'} Welcome to Terminal Quest
            </DialogTitle>
            <DialogDescription className="font-mono text-muted-foreground">
              Master Linux commands through puzzle challenges
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 font-mono text-sm">
            <p className="text-foreground">
              You are a system administrator facing various Linux challenges. 
              Use terminal commands to solve puzzles, install packages, edit files, and more!
            </p>
            
            <div className="space-y-2">
              <h4 className="text-terminal-amber font-bold">How to Play:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Type <code className="text-terminal-green">help</code> for available commands</li>
                <li>• Each level has a specific objective to complete</li>
                <li>• Use <code className="text-terminal-green">hint</code> if you're stuck (costs points)</li>
                <li>• Faster completion = higher score!</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-terminal-amber font-bold">Scoring:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Base score + time bonus</li>
                <li>• -25 points per hint used</li>
                <li>• -5 points per command attempt</li>
              </ul>
            </div>
          </div>
          
          <Button
            onClick={() => {
              setShowIntro(false);
              startLevel(progress.currentLevel || 1);
            }}
            className="w-full font-mono bg-terminal-green text-primary-foreground hover:bg-terminal-green/90"
          >
            Start Game
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
