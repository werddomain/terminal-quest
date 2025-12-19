import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission3 extends BaseMission {
  readonly id = 3;
  readonly title = 'Permission Denied';
  readonly description = 'A critical script needs to be executed, but it lacks the right permissions.';
  readonly objective = 'Make the backup script executable and run it successfully.';
  readonly hints = [
    'Check current permissions with "ls -la"',
    'Use "chmod +x <filename>" to add execute permission',
    'Run scripts with "./<scriptname>"'
  ];
  readonly maxHints = 3;
  readonly baseScore = 200;
  readonly timeBonus = 100;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user/scripts';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific directories and files
    fs.children!.home.children!.user.children = {
      scripts: {
        type: 'directory',
        name: 'scripts',
        children: {
          'backup.sh': {
            type: 'file',
            name: 'backup.sh',
            content: '#!/bin/bash\necho "Backup completed successfully!"\necho "BACKUP_TOKEN: LEVEL3COMPLETE"',
            permissions: 'rw-r--r--',
            executable: false
          },
          'README.md': {
            type: 'file',
            name: 'README.md',
            content: '# Backup Scripts\n\nThe backup.sh script needs to be run daily.\nMake sure it has execute permissions!'
          }
        }
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    return state.outputHistory.some(line => 
      line.text.includes('LEVEL3COMPLETE')
    );
  }
}
