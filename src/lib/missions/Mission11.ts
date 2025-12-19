import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission11 extends BaseMission {
  readonly id = 11;
  readonly title = 'Archive Master';
  readonly description = 'Create a backup archive of important project files.';
  readonly objective = 'Create a tar archive of the /home/user/project directory and save it as backup.tar in /tmp';
  readonly hints = [
    'Use "tar -cf backup.tar directory" to create an archive',
    'Full command: tar -cf /tmp/backup.tar /home/user/project',
    'Verify with "ls /tmp" to see the backup.tar file'
  ];
  readonly maxHints = 3;
  readonly baseScore = 270;
  readonly timeBonus = 135;
  readonly timeLimitSeconds = 360;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.home.children!.user.children = {
      project: {
        type: 'directory',
        name: 'project',
        children: {
          'main.js': {
            type: 'file',
            name: 'main.js',
            content: 'console.log("Hello World");'
          },
          'config.json': {
            type: 'file',
            name: 'config.json',
            content: '{"version": "1.0.0"}'
          },
          'README.md': {
            type: 'file',
            name: 'README.md',
            content: '# My Project\n\nA sample project'
          }
        }
      },
      'BACKUP_TASK.txt': {
        type: 'file',
        name: 'BACKUP_TASK.txt',
        content: `Backup Required!

The project directory needs to be archived for backup.

Task:
Create a tar archive named 'backup.tar' in /tmp containing
all files from /home/user/project

Use the tar command to create archives.`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user used tar command
    const usedTar = state.commandHistory.some(cmd => 
      cmd.includes('tar') && cmd.includes('backup.tar') && cmd.includes('project')
    );
    
    // Check for backup file in tmp
    const backupFile = state.fileSystem.children?.tmp?.children?.['backup.tar'];
    
    return usedTar && backupFile !== undefined;
  }
}
