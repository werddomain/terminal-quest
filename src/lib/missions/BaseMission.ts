import type { Level, FileSystemNode, TerminalState } from '../types';

/**
 * Base class for all missions in Terminal Quest.
 * Each mission should extend this class and implement the required methods.
 */
export abstract class BaseMission {
  abstract readonly id: number;
  abstract readonly title: string;
  abstract readonly description: string;
  abstract readonly objective: string;
  abstract readonly hints: string[];
  abstract readonly maxHints: number;
  abstract readonly baseScore: number;
  abstract readonly timeBonus: number;
  abstract readonly timeLimitSeconds: number;
  abstract readonly initialDirectory: string;
  
  /**
   * Packages available for this mission (optional)
   */
  readonly packages?: string[];
  
  /**
   * Packages initially installed (optional)
   */
  readonly installedPackages?: string[];

  /**
   * Build the file system for this mission
   */
  abstract buildFileSystem(): FileSystemNode;

  /**
   * Check if the win condition for this mission has been met
   */
  abstract checkWinCondition(state: TerminalState): boolean;

  /**
   * Convert this mission to a Level object that can be used by the game engine
   */
  toLevel(): Level {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      objective: this.objective,
      hints: this.hints,
      maxHints: this.maxHints,
      baseScore: this.baseScore,
      timeBonus: this.timeBonus,
      timeLimitSeconds: this.timeLimitSeconds,
      initialDirectory: this.initialDirectory,
      fileSystem: this.buildFileSystem(),
      checkWinCondition: (state: TerminalState) => this.checkWinCondition(state),
      packages: this.packages,
      installedPackages: this.installedPackages,
    };
  }
}
