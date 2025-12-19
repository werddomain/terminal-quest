import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OutputLine, TerminalState, Level } from '@/lib/types';
import { executeCommand } from '@/lib/terminal';

interface TerminalProps {
  state: TerminalState;
  onStateChange: (newState: Partial<TerminalState>) => void;
  level: Level;
  onHintRequest: () => void;
  disabled?: boolean;
}

export function Terminal({ state, onStateChange, level, onHintRequest, disabled }: TerminalProps) {
  const [input, setInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompt = `user@terminal-quest:${state.currentDirectory}$ `;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.outputHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim();
    
    const inputLine: OutputLine = {
      text: `${prompt}${trimmedCmd}`,
      type: 'input'
    };

    if (trimmedCmd === 'hint') {
      onHintRequest();
      onStateChange({
        outputHistory: [...state.outputHistory, inputLine],
        commandHistory: [...state.commandHistory, trimmedCmd]
      });
      return;
    }

    const result = executeCommand(trimmedCmd, state, level);
    
    onStateChange({
      ...result.newState,
      outputHistory: [...state.outputHistory, inputLine, ...result.output],
      commandHistory: trimmedCmd ? [...state.commandHistory, trimmedCmd] : state.commandHistory
    });
  }, [state, level, prompt, onStateChange, onHintRequest]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleCommand(input);
      setInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, state.commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setInput(state.commandHistory[state.commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        setInput(state.commandHistory[state.commandHistory.length - 1 - newIndex] || '');
      } else {
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onStateChange({ outputHistory: [] });
    }
  };

  const getLineColor = (type: OutputLine['type']) => {
    switch (type) {
      case 'error':
        return 'text-terminal-red';
      case 'success':
        return 'text-terminal-green text-glow';
      case 'info':
        return 'text-terminal-blue';
      case 'input':
        return 'text-terminal-dim';
      default:
        return 'text-foreground';
    }
  };

  return (
    <div 
      className="relative h-full bg-card rounded-lg border border-border overflow-hidden terminal-scanline"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20 pointer-events-none" />
      
      <ScrollArea className="h-full">
        <div className="p-4 font-mono text-sm leading-relaxed min-h-full">
          <div className="text-terminal-green mb-4">
            <pre className="text-xs text-terminal-dim">
{`╔════════════════════════════════════════════════════════════╗
║  TERMINAL QUEST v1.0 - Linux Puzzle Adventure              ║
║  Type 'help' for available commands                        ║
╚════════════════════════════════════════════════════════════╝`}
            </pre>
          </div>

          {state.outputHistory.map((line, i) => (
            <div key={i} className={`${getLineColor(line.type)} whitespace-pre-wrap break-all`}>
              {line.text}
            </div>
          ))}

          <div className="flex items-center">
            <span className="text-terminal-green">{prompt}</span>
            <div className="flex-1 relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="absolute inset-0 w-full bg-transparent border-none outline-none text-foreground font-mono opacity-0"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={disabled}
              />
              <span className="text-foreground">{input}</span>
              <span className="inline-block w-2 h-4 bg-terminal-green cursor-blink ml-0.5" />
            </div>
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
