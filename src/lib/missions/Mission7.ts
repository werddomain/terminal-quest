import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission7 extends BaseMission {
  readonly id = 7;
  readonly title = 'File Hunter';
  readonly description = 'Important files are scattered across the system. Use find to locate them.';
  readonly objective = 'Find all .conf files in the system and count them. Write the count to /tmp/count.txt';
  readonly hints = [
    'Use "find / -name \'*.conf\'" to search for .conf files',
    'Count the results and use echo to write to /tmp/count.txt',
    'There are 3 .conf files in the system'
  ];
  readonly maxHints = 3;
  readonly baseScore = 200;
  readonly timeBonus = 100;
  readonly timeLimitSeconds = 360;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.etc.children = {
      'app.conf': {
        type: 'file',
        name: 'app.conf',
        content: '# Application configuration\nserver=localhost\nport=8080'
      },
      'network.conf': {
        type: 'file',
        name: 'network.conf',
        content: '# Network settings\ndhcp=enabled'
      },
      config: {
        type: 'directory',
        name: 'config',
        children: {
          'system.conf': {
            type: 'file',
            name: 'system.conf',
            content: '# System configuration\ntimezone=UTC'
          }
        }
      }
    };

    fs.children!.home.children!.user.children = {
      'MISSION.txt': {
        type: 'file',
        name: 'MISSION.txt',
        content: 'Configuration files are scattered throughout the system.\n\nFind all .conf files and count them.\nWrite the count to /tmp/count.txt\n\nHint: Use the find command'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user found files using find command
    const usedFind = state.commandHistory.some(cmd => 
      cmd.includes('find') && cmd.includes('.conf')
    );
    
    // Check for count file
    const countFile = state.fileSystem.children?.tmp?.children?.['count.txt'];
    const hasCorrectCount = countFile?.content?.includes('3');
    
    return usedFind && hasCorrectCount;
  }
}
