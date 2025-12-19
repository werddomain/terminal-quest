import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission10 extends BaseMission {
  readonly id = 10;
  readonly title = 'Disk Space Detective';
  readonly description = 'The server is running out of space. Find what is taking up disk space.';
  readonly objective = 'Use du command to check disk usage in /var and write "DISK_ANALYZED" to /tmp/report.txt';
  readonly hints = [
    'Use "du -h /var" to see disk usage in human-readable format',
    'Use "du -sh /var/*" to see size of each subdirectory',
    'After analyzing, echo "DISK_ANALYZED" > /tmp/report.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 230;
  readonly timeBonus = 115;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.var.children = {
      log: {
        type: 'directory',
        name: 'log',
        children: {
          'system.log': {
            type: 'file',
            name: 'system.log',
            content: '[INFO] ' + 'x'.repeat(1000) + '\n'.repeat(50)
          },
          'app.log': {
            type: 'file',
            name: 'app.log',
            content: '[DEBUG] ' + 'y'.repeat(500)
          }
        }
      },
      cache: {
        type: 'directory',
        name: 'cache',
        children: {
          'data.cache': {
            type: 'file',
            name: 'data.cache',
            content: 'cached_data'.repeat(200)
          }
        }
      },
      www: {
        type: 'directory',
        name: 'www',
        children: {
          'index.html': {
            type: 'file',
            name: 'index.html',
            content: '<html><body>Website</body></html>'
          }
        }
      }
    };

    fs.children!.home.children!.user.children = {
      'ALERT.txt': {
        type: 'file',
        name: 'ALERT.txt',
        content: `WARNING: Disk space running low!

Task:
1. Check disk usage in /var directory
2. Identify which folders are using space
3. Write "DISK_ANALYZED" to /tmp/report.txt

Use du command to analyze disk usage.`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user used du command
    const usedDu = state.commandHistory.some(cmd => cmd.includes('du') && cmd.includes('/var'));
    
    // Check for report file
    const reportFile = state.fileSystem.children?.tmp?.children?.['report.txt'];
    const hasReport = reportFile?.content?.includes('DISK_ANALYZED');
    
    return usedDu && hasReport;
  }
}
