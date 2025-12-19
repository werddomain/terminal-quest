import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission1 extends BaseMission {
  readonly id = 1;
  readonly title = 'First Steps';
  readonly description = 'Welcome to Terminal Quest! Learn the basics of navigating the Linux filesystem.';
  readonly objective = 'Find and read the secret message hidden in the system. Use ls to list files and cat to read them.';
  readonly hints = [
    'Try using "ls" to see what files are in the current directory',
    'Navigate directories with "cd <dirname>"',
    'The secret is in /home/user/documents/secret.txt - use "cat" to read it'
  ];
  readonly maxHints = 3;
  readonly baseScore = 100;
  readonly timeBonus = 50;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific files and directories
    fs.children!.home.children!.user.children = {
      documents: {
        type: 'directory',
        name: 'documents',
        children: {
          'secret.txt': {
            type: 'file',
            name: 'secret.txt',
            content: 'CONGRATULATIONS! You found the secret message!\nThe password is: LEVEL1COMPLETE'
          },
          'readme.txt': {
            type: 'file',
            name: 'readme.txt',
            content: 'Welcome to your documents folder.\nThere might be something interesting here...'
          }
        }
      },
      '.bashrc': {
        type: 'file',
        name: '.bashrc',
        content: '# Bash configuration\nexport PATH=$PATH:/usr/local/bin'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    return state.outputHistory.some(line => 
      line.text.includes('LEVEL1COMPLETE')
    );
  }
}
