export interface FileSystemNode {
  type: 'file' | 'directory';
  name: string;
  content?: string;
  children?: Record<string, FileSystemNode>;
  permissions?: string;
  owner?: string;
  executable?: boolean;
}

export interface Level {
  id: number;
  title: string;
  description: string;
  objective: string;
  hints: string[];
  maxHints: number;
  baseScore: number;
  timeBonus: number;
  timeLimitSeconds: number;
  fileSystem: FileSystemNode;
  initialDirectory: string;
  checkWinCondition: (state: TerminalState) => boolean;
  packages?: string[];
  installedPackages?: string[];
}

export interface TerminalState {
  currentDirectory: string;
  fileSystem: FileSystemNode;
  commandHistory: string[];
  outputHistory: OutputLine[];
  installedPackages: string[];
  env: Record<string, string>;
  editingFile: string | null;
  editingContent: string;
}

export interface OutputLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export interface GameProgress {
  currentLevel: number;
  completedLevels: number[];
  scores: Record<number, LevelScore>;
  totalScore: number;
}

export interface LevelScore {
  score: number;
  time: number;
  hintsUsed: number;
  attempts: number;
  completed: boolean;
}

export interface LevelState {
  startTime: number;
  hintsUsed: number;
  hintsRevealed: string[];
  attempts: number;
  completed: boolean;
}
