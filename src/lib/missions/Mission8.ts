import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import { getFileAtPath } from '../levels';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission8 extends BaseMission {
  readonly id = 8;
  readonly title = 'Text Wrangler';
  readonly description = 'A data file needs cleaning. Use text processing to extract specific information.';
  readonly objective = 'Extract all email addresses from users.txt and save them to /tmp/emails.txt';
  readonly hints = [
    'Use "grep" to search for patterns in files',
    'Email pattern: grep "@" users.txt',
    'Redirect output with: grep "@" users.txt > /tmp/emails.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 250;
  readonly timeBonus = 125;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user/data';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.home.children!.user.children = {
      data: {
        type: 'directory',
        name: 'data',
        children: {
          'users.txt': {
            type: 'file',
            name: 'users.txt',
            content: `John Doe - john@example.com - Active
Jane Smith - jane@example.com - Active
Bob Wilson - Phone: 555-1234 - Inactive
Alice Brown - alice@example.com - Active
Charlie - No contact info
David Lee - david@company.org - Active`
          },
          'README.txt': {
            type: 'file',
            name: 'README.txt',
            content: 'User database - mixed format\nNeeds cleaning and email extraction'
          }
        }
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    const emailFile = getFileAtPath(state.fileSystem, '/tmp/emails.txt');
    if (!emailFile?.content) return false;
    
    // Check if all 4 emails are present
    const requiredEmails = ['john@example.com', 'jane@example.com', 'alice@example.com', 'david@company.org'];
    return requiredEmails.every(email => emailFile.content?.includes(email));
  }
}
