import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import { getFileAtPath } from '../levels';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission14 extends BaseMission {
  readonly id = 14;
  readonly title = 'Cron Scheduler';
  readonly description = 'Set up automated tasks using cron scheduling.';
  readonly objective = 'Create a cron job entry in /etc/crontab that runs a backup script daily at 2am';
  readonly hints = [
    'Cron format: minute hour day month weekday command',
    'For 2am daily: 0 2 * * * /path/to/script',
    'Edit /etc/crontab and add: 0 2 * * * /usr/local/bin/backup.sh'
  ];
  readonly maxHints = 3;
  readonly baseScore = 320;
  readonly timeBonus = 160;
  readonly timeLimitSeconds = 420;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.etc.children = {
      'crontab': {
        type: 'file',
        name: 'crontab',
        content: `# /etc/crontab: system-wide crontab
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# m h dom mon dow user  command
17 *    * * *   root    cd / && run-parts --report /etc/cron.hourly
`
      }
    };

    fs.children!.usr.children!.bin.children = {
      'backup.sh': {
        type: 'file',
        name: 'backup.sh',
        content: '#!/bin/bash\necho "Backup running..."\n# Backup logic here',
        executable: true
      }
    };

    fs.children!.home.children!.user.children = {
      'AUTOMATION.txt': {
        type: 'file',
        name: 'AUTOMATION.txt',
        content: `Automation Task: Schedule Backups

The backup script at /usr/local/bin/backup.sh needs to run
automatically every day at 2:00 AM.

Task:
Edit /etc/crontab and add a cron job entry.

Cron format: minute hour day month weekday command
For 2am daily: 0 2 * * * /usr/local/bin/backup.sh

Use nano to edit the crontab file.`
      }
    };

    // Add /usr/local/bin directory for the backup script path reference
    if (!fs.children!.usr.children!['local']) {
      fs.children!.usr.children!['local'] = {
        type: 'directory',
        name: 'local',
        children: {
          bin: {
            type: 'directory',
            name: 'bin',
            children: {
              'backup.sh': {
                type: 'file',
                name: 'backup.sh',
                content: '#!/bin/bash\necho "Running backup..."',
                executable: true
              }
            }
          }
        }
      };
    }

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    const crontabFile = getFileAtPath(state.fileSystem, '/etc/crontab');
    if (!crontabFile?.content) return false;
    
    // Check if the cron entry is present
    const hasCronEntry = crontabFile.content.includes('0 2 * * *') && 
                         crontabFile.content.includes('/usr/local/bin/backup.sh');
    
    return hasCronEntry;
  }
}
