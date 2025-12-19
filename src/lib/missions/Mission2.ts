import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission2 extends BaseMission {
  readonly id = 2;
  readonly title = 'Package Manager';
  readonly description = 'The web server is down! You need to install and start it.';
  readonly objective = 'Install the "nginx" package using apt and verify it\'s installed.';
  readonly hints = [
    'Use "apt search <package>" to find available packages',
    'Install packages with "apt install <package>"',
    'After installing nginx, use "apt list --installed" to verify'
  ];
  readonly maxHints = 3;
  readonly baseScore = 150;
  readonly timeBonus = 75;
  readonly timeLimitSeconds = 240;
  readonly initialDirectory = '/home/user';
  readonly packages = ['nginx', 'apache2', 'mysql', 'postgresql', 'nodejs', 'python3'];
  readonly installedPackages: string[] = [];

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific files
    fs.children!.home.children!.user.children = {
      'MISSION.txt': {
        type: 'file',
        name: 'MISSION.txt',
        content: 'URGENT: The web server is offline!\n\nYour mission:\n1. Install the nginx web server\n2. Verify the installation\n\nUse apt commands to manage packages.'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check that nginx is installed
    const nginxInstalled = state.installedPackages.includes('nginx');
    
    // Check that the user has verified the installation using one of these commands:
    // - apt list --installed
    // - nginx -v (or any command with nginx and -v)
    const hasVerified = state.commandHistory.some(cmd => {
      const trimmed = cmd.trim().toLowerCase();
      return (
        trimmed.includes('apt list --installed') ||
        trimmed.includes('apt list') && trimmed.includes('installed') ||
        (trimmed.includes('nginx') && trimmed.includes('-v'))
      );
    });

    return nginxInstalled && hasVerified;
  }
}
