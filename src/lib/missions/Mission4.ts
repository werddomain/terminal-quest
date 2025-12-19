import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import { getFileAtPath } from '../levels';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission4 extends BaseMission {
  readonly id = 4;
  readonly title = 'Config Detective';
  readonly description = 'The application is misconfigured. Find and fix the configuration file.';
  readonly objective = 'Edit the config file to change the port from 8080 to 3000.';
  readonly hints = [
    'Look for configuration files in /etc/app/',
    'Use "nano <filename>" to edit files',
    'Change PORT=8080 to PORT=3000 and save with Ctrl+S, exit with Ctrl+X'
  ];
  readonly maxHints = 3;
  readonly baseScore = 250;
  readonly timeBonus = 125;
  readonly timeLimitSeconds = 360;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific directories and files
    fs.children!.etc.children = {
      app: {
        type: 'directory',
        name: 'app',
        children: {
          'config.env': {
            type: 'file',
            name: 'config.env',
            content: '# Application Configuration\nPORT=8080\nDEBUG=false\nLOG_LEVEL=info'
          },
          'config.example': {
            type: 'file',
            name: 'config.example',
            content: '# Example configuration\n# PORT should be set to 3000 for production'
          }
        }
      }
    };

    fs.children!.home.children!.user.children = {
      'TASK.txt': {
        type: 'file',
        name: 'TASK.txt',
        content: 'The application is running on the wrong port!\n\nFind the configuration file and change the port to 3000.\nConfig files are usually in /etc/'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    const configFile = getFileAtPath(state.fileSystem, '/etc/app/config.env');
    return configFile?.content?.includes('PORT=3000') ?? false;
  }
}
