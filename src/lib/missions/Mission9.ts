import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission9 extends BaseMission {
  readonly id = 9;
  readonly title = 'Process Manager';
  readonly description = 'Learn to monitor and understand system processes.';
  readonly objective = 'View running processes and identify the process info. Write "PROCESSES_CHECKED" to /tmp/status.txt';
  readonly hints = [
    'Use "ps" command to see processes',
    'Try "ps aux" for detailed process information',
    'Once you understand processes, write status with: echo "PROCESSES_CHECKED" > /tmp/status.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 220;
  readonly timeBonus = 110;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.home.children!.user.children = {
      'TASK.txt': {
        type: 'file',
        name: 'TASK.txt',
        content: `System Administration Task: Process Monitoring

1. Learn about running processes using ps command
2. Understand process states and PIDs
3. Once familiar, write "PROCESSES_CHECKED" to /tmp/status.txt

This helps you understand what's running on the system.`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user ran ps command
    const usedPs = state.commandHistory.some(cmd => cmd.trim().startsWith('ps'));
    
    // Check for status file
    const statusFile = state.fileSystem.children?.tmp?.children?.['status.txt'];
    const hasStatus = statusFile?.content?.includes('PROCESSES_CHECKED');
    
    return usedPs && hasStatus;
  }
}
