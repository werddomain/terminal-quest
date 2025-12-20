import { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { OutputLine, TerminalState, Level, FileSystemNode } from '@/lib/types';
import { executeCommand, resolvePath, normalizePath } from '@/lib/terminal';
import { getFileAtPath } from '@/lib/levels';

interface TerminalProps {
  state: TerminalState;
  onStateChange: (newState: Partial<TerminalState>) => void;
  level: Level;
  onHintRequest: () => void;
  disabled?: boolean;
}

// Get autocomplete suggestions for the current input
function getAutocompleteSuggestions(input: string, state: TerminalState): string[] {
  const parts = input.split(/\s+/);
  if (parts.length === 0) return [];
  
  const command = parts[0];
  const lastArg = parts[parts.length - 1] || '';
  
  // List of available commands
  const commands = [
    'ls', 'cd', 'cat', 'pwd', 'echo', 'mkdir', 'touch', 'rm', 'chmod',
    'grep', 'apt', 'apt-get', 'nano', 'vim', 'vi', 'clear', 'help',
    'whoami', 'date', 'uname', 'man', 'history', 'hint'
  ];
  
  // If we're completing the first word (command)
  if (parts.length === 1 && !input.endsWith(' ')) {
    return commands
      .filter(cmd => cmd.startsWith(command))
      .sort();
  }
  
  // If we're completing a path argument
  if (parts.length >= 1) {
    return getPathSuggestions(lastArg, state);
  }
  
  return [];
}

// Get path suggestions based on filesystem
function getPathSuggestions(partial: string, state: TerminalState): string[] {
  const isAbsolute = partial.startsWith('/');
  const isHome = partial.startsWith('~');
  const isRelativeScript = partial.startsWith('./');
  
  let basePath: string;
  let searchPrefix: string;
  
  if (isRelativeScript) {
    // Handle ./ prefix
    basePath = state.currentDirectory;
    searchPrefix = partial.slice(2);
  } else if (isAbsolute) {
    // Absolute path
    const lastSlash = partial.lastIndexOf('/');
    basePath = lastSlash === 0 ? '/' : partial.slice(0, lastSlash);
    searchPrefix = partial.slice(lastSlash + 1);
  } else if (isHome) {
    // Home path
    const withoutTilde = partial.slice(1);
    const lastSlash = withoutTilde.lastIndexOf('/');
    basePath = lastSlash === -1 ? '/home/user' : normalizePath('/home/user' + withoutTilde.slice(0, lastSlash + 1));
    searchPrefix = lastSlash === -1 ? withoutTilde.slice(1) : withoutTilde.slice(lastSlash + 1);
  } else {
    // Relative path
    const lastSlash = partial.lastIndexOf('/');
    if (lastSlash === -1) {
      basePath = state.currentDirectory;
      searchPrefix = partial;
    } else {
      const relativePart = partial.slice(0, lastSlash);
      basePath = normalizePath(resolvePath(relativePart, state.currentDirectory));
      searchPrefix = partial.slice(lastSlash + 1);
    }
  }
  
  const node = getFileAtPath(state.fileSystem, basePath);
  if (!node || node.type !== 'directory' || !node.children) {
    return [];
  }
  
  const matches = Object.keys(node.children)
    .filter(name => name.startsWith(searchPrefix))
    .sort()
    .map(name => {
      const childNode = node.children![name];
      const isDir = childNode.type === 'directory';
      
      // Reconstruct the full suggestion
      let suggestion: string;
      if (isRelativeScript) {
        // For ./ prefix, we need to keep any directory path from searchPrefix
        const lastSlashInSearch = searchPrefix.lastIndexOf('/');
        const dirPart = lastSlashInSearch >= 0 ? searchPrefix.slice(0, lastSlashInSearch + 1) : '';
        suggestion = './' + dirPart + name;
      } else if (isAbsolute) {
        const lastSlash = partial.lastIndexOf('/');
        suggestion = partial.slice(0, lastSlash + 1) + name;
      } else if (isHome) {
        const withoutTilde = partial.slice(1);
        const lastSlash = withoutTilde.lastIndexOf('/');
        if (lastSlash === -1) {
          suggestion = '~/' + name;
        } else {
          suggestion = '~' + withoutTilde.slice(0, lastSlash + 1) + name;
        }
      } else {
        const lastSlash = partial.lastIndexOf('/');
        if (lastSlash === -1) {
          suggestion = name;
        } else {
          suggestion = partial.slice(0, lastSlash + 1) + name;
        }
      }
      
      // Add trailing slash for directories
      return isDir ? suggestion + '/' : suggestion;
    });
  
  return matches;
}

export function Terminal({ state, onStateChange, level, onHintRequest, disabled }: TerminalProps) {
  const [input, setInput] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tabSuggestions, setTabSuggestions] = useState<string[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [originalInput, setOriginalInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const prompt = `user@terminal-quest:${state.currentDirectory}$ `;

  // Constants
  const EDITOR_CLOSE_FOCUS_DELAY = 100; // ms delay to ensure editor unmounts before focusing terminal

  // Helper function to set cursor position at end of input
  const setCursorToEnd = useCallback((text: string) => {
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.selectionStart = text.length;
        inputRef.current.selectionEnd = text.length;
        setCursorPosition(text.length);
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.outputHistory]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus terminal when editor closes (editingFile becomes null)
  useEffect(() => {
    if (!state.editingFile && !disabled) {
      // Use a small delay to ensure the editor has unmounted
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, EDITOR_CLOSE_FOCUS_DELAY);
      return () => clearTimeout(timer);
    }
  }, [state.editingFile, disabled]);

  // Track cursor position changes
  useEffect(() => {
    const updateCursorPosition = () => {
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart || 0);
      }
    };

    const inputElement = inputRef.current;
    if (inputElement) {
      inputElement.addEventListener('click', updateCursorPosition);
      inputElement.addEventListener('keyup', updateCursorPosition);
      inputElement.addEventListener('select', updateCursorPosition);
    }

    return () => {
      if (inputElement) {
        inputElement.removeEventListener('click', updateCursorPosition);
        inputElement.removeEventListener('keyup', updateCursorPosition);
        inputElement.removeEventListener('select', updateCursorPosition);
      }
    };
  }, []);

  // Update cursor position when input changes
  useEffect(() => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || input.length);
    }
  }, [input]);

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
      setCursorPosition(0);
      setHistoryIndex(-1);
      setTabSuggestions([]);
      setTabIndex(0);
      setOriginalInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.min(historyIndex + 1, state.commandHistory.length - 1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        const historyCmd = state.commandHistory[state.commandHistory.length - 1 - newIndex] || '';
        setInput(historyCmd);
        setCursorToEnd(historyCmd);
      }
      setTabSuggestions([]);
      setTabIndex(0);
      setOriginalInput('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.max(historyIndex - 1, -1);
      setHistoryIndex(newIndex);
      if (newIndex >= 0) {
        const historyCmd = state.commandHistory[state.commandHistory.length - 1 - newIndex] || '';
        setInput(historyCmd);
        setCursorToEnd(historyCmd);
      } else {
        setInput('');
        setCursorPosition(0);
      }
      setTabSuggestions([]);
      setTabIndex(0);
      setOriginalInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabComplete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      onStateChange({ outputHistory: [] });
    } else {
      // Reset tab suggestions on any other key
      setTabSuggestions([]);
      setTabIndex(0);
      setOriginalInput('');
    }
  };

  const handleTabComplete = () => {
    // If we already have suggestions, cycle through them
    if (tabSuggestions.length > 0) {
      const nextIndex = (tabIndex + 1) % tabSuggestions.length;
      setTabIndex(nextIndex);
      applySuggestion(tabSuggestions[nextIndex], originalInput);
      return;
    }

    // Get new suggestions
    const suggestions = getAutocompleteSuggestions(input, state);
    if (suggestions.length === 0) {
      return;
    }

    setTabSuggestions(suggestions);
    setTabIndex(0);
    setOriginalInput(input);
    applySuggestion(suggestions[0], input);
  };

  const applySuggestion = (suggestion: string, baseInput: string) => {
    const parts = baseInput.split(/\s+/);
    
    // If completing the command (first word)
    if (parts.length === 1 && !baseInput.endsWith(' ')) {
      setInput(suggestion + ' ');
      return;
    }
    
    // If completing a path argument
    if (parts.length >= 1) {
      // Replace the last part with the suggestion
      parts[parts.length - 1] = suggestion;
      setInput(parts.join(' '));
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
              <span className="text-foreground">{input.slice(0, cursorPosition)}</span>
              <span className="inline-block w-2 h-4 bg-terminal-green cursor-blink" />
              <span className="text-foreground">{input.slice(cursorPosition)}</span>
            </div>
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
