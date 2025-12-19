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

// Stage types
export type GameStage = 'hobbyist' | 'technician';

export interface TechnicianLevel {
  level: 1 | 2 | 3; // 1 = senior, 2 = intermediate, 3 = junior
  xp: number;
  xpToNextLevel?: number;
}

// Ticket system for technician stages
export interface Ticket {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3; // Required technician level (3 = easiest, 1 = hardest)
  xpReward: number;
  xpPenalty: number;
  timeLimit: number; // seconds
  canFail: boolean; // Some tickets cannot fail, only be abandoned
  fileSystem: FileSystemNode;
  initialDirectory: string;
  checkWinCondition: (state: TerminalState) => boolean;
  hints: string[];
  sshHost: string; // Remote server to connect to
  tags?: string[]; // For categorizing tickets
}

export interface ActiveTicket {
  ticket: Ticket;
  startTime: number;
  hintsUsed: number;
  attempts: number;
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
  sshConnected?: boolean;
  sshHost?: string;
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
  stage: GameStage;
  technicianLevel?: TechnicianLevel;
  completedTickets?: string[]; // IDs of completed tickets
  sshCertificates?: string[]; // Installed SSH certificates for different levels
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
