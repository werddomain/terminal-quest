import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission12 extends BaseMission {
  readonly id = 12;
  readonly title = 'Network Navigator';
  readonly description = 'Understand network configuration and connectivity.';
  readonly objective = 'Check network interfaces with ifconfig and test connectivity. Write "NETWORK_OK" to /tmp/network.txt';
  readonly hints = [
    'Use "ifconfig" to view network interfaces',
    'Use "ping localhost" to test local connectivity',
    'After checks, write: echo "NETWORK_OK" > /tmp/network.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 240;
  readonly timeBonus = 120;
  readonly timeLimitSeconds = 300;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.home.children!.user.children = {
      'NETWORK_TASK.txt': {
        type: 'file',
        name: 'NETWORK_TASK.txt',
        content: `Network Diagnostics Required

Tasks:
1. Check network interface configuration (ifconfig)
2. Test local connectivity (ping)
3. Document findings by writing "NETWORK_OK" to /tmp/network.txt

This helps ensure network is functioning properly.`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user used network commands
    const usedIfconfig = state.commandHistory.some(cmd => cmd.includes('ifconfig'));
    const usedPing = state.commandHistory.some(cmd => cmd.includes('ping'));
    
    // Check for network status file
    const networkFile = state.fileSystem.children?.tmp?.children?.['network.txt'];
    const hasStatus = networkFile?.content?.includes('NETWORK_OK');
    
    return usedIfconfig && usedPing && hasStatus;
  }
}
