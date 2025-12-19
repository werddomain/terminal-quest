import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission13 extends BaseMission {
  readonly id = 13;
  readonly title = 'User Administrator';
  readonly description = 'Learn about user management and permissions in Linux.';
  readonly objective = 'Review the user list and document admin users by writing their count to /tmp/admin_count.txt';
  readonly hints = [
    'User information is stored in /etc/passwd',
    'Use "cat /etc/passwd" to view users',
    'Count admin/root entries and echo the number to /tmp/admin_count.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 260;
  readonly timeBonus = 130;
  readonly timeLimitSeconds = 360;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.etc.children = {
      'passwd': {
        type: 'file',
        name: 'passwd',
        content: `root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
user:x:1000:1000:User:/home/user:/bin/bash
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
admin:x:1001:1001:Admin:/home/admin:/bin/bash`
      },
      'group': {
        type: 'file',
        name: 'group',
        content: 'root:x:0:\nusers:x:100:user\nadmin:x:1001:admin'
      }
    };

    fs.children!.home.children!.user.children = {
      'USER_AUDIT.txt': {
        type: 'file',
        name: 'USER_AUDIT.txt',
        content: `User Audit Task

Security audit requires documenting all admin users.

Tasks:
1. Review /etc/passwd file
2. Count users with admin privileges (root, admin)
3. Write the count to /tmp/admin_count.txt

Hint: There are 2 admin users (root and admin).`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user viewed passwd file
    const viewedPasswd = state.commandHistory.some(cmd => 
      cmd.includes('cat') && cmd.includes('passwd')
    );
    
    // Check for admin count file
    const countFile = state.fileSystem.children?.tmp?.children?.['admin_count.txt'];
    const hasCorrectCount = countFile?.content?.includes('2');
    
    return viewedPasswd && hasCorrectCount;
  }
}
