import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission6 extends BaseMission {
  readonly id = 6;
  readonly title = 'Script Master';
  readonly description = 'Write a simple script to automate a task. Optional: use code to solve it elegantly.';
  readonly objective = 'Create a script that outputs "Hello, Terminal Quest!" and run it.';
  readonly hints = [
    'Create a file with: echo \'#!/bin/bash\' > script.sh',
    'Add the echo command: echo \'echo "Hello, Terminal Quest!"\' >> script.sh',
    'Make it executable with chmod +x and run with ./script.sh'
  ];
  readonly maxHints = 3;
  readonly baseScore = 350;
  readonly timeBonus = 175;
  readonly timeLimitSeconds = 480;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific files
    fs.children!.home.children!.user.children = {
      'CHALLENGE.txt': {
        type: 'file',
        name: 'CHALLENGE.txt',
        content: 'SCRIPTING CHALLENGE\n\nCreate and run a bash script that outputs:\n"Hello, Terminal Quest!"\n\nYou can use:\n- echo command with redirection (>)\n- nano editor\n- Or get creative with your own approach!'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    return state.outputHistory.some(line => 
      line.text.includes('Hello, Terminal Quest!')
    );
  }
}
