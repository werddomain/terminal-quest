import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import { getFileAtPath } from '../levels';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission5 extends BaseMission {
  readonly id = 5;
  readonly title = 'Log Analysis';
  readonly description = 'Something is causing errors in the system. Analyze the logs to find the culprit.';
  readonly objective = 'Find the error code in the log files and write it to /tmp/solution.txt';
  readonly hints = [
    'Check logs in /var/log/',
    'Use "grep" to search for "ERROR" in log files',
    'Create the solution file with: echo "ERROR_CODE" > /tmp/solution.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 300;
  readonly timeBonus = 150;
  readonly timeLimitSeconds = 420;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    // Add mission-specific files
    fs.children!.var.children!.log.children = {
      'system.log': {
        type: 'file',
        name: 'system.log',
        content: '[INFO] System started\n[INFO] Loading modules\n[WARN] Memory usage high\n[INFO] Services ready\n[ERROR] Critical failure - Code: ERR_5X7K9\n[INFO] Attempting recovery\n[INFO] Recovery successful'
      },
      'app.log': {
        type: 'file',
        name: 'app.log',
        content: '[DEBUG] App initialized\n[INFO] Connected to database\n[INFO] Listening on port 3000'
      },
      'access.log': {
        type: 'file',
        name: 'access.log',
        content: '192.168.1.1 - GET /index.html 200\n192.168.1.2 - POST /api/data 201\n192.168.1.1 - GET /style.css 200'
      }
    };

    fs.children!.home.children!.user.children = {
      'INVESTIGATE.txt': {
        type: 'file',
        name: 'INVESTIGATE.txt',
        content: 'System alerts have been triggered!\n\nYour task:\n1. Find the error code in the logs\n2. Write it to /tmp/solution.txt\n\nHint: Logs are typically in /var/log/'
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    const solutionFile = getFileAtPath(state.fileSystem, '/tmp/solution.txt');
    return solutionFile?.content?.includes('ERR_5X7K9') ?? false;
  }
}
