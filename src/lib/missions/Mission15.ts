import { BaseMission } from './BaseMission';
import { createBaseFileSystem } from './fileSystemUtils';
import type { FileSystemNode, TerminalState } from '../types';

export class Mission15 extends BaseMission {
  readonly id = 15;
  readonly title = 'System Monitor';
  readonly description = 'Master system monitoring and performance analysis.';
  readonly objective = 'Check system resources and write a status report to /tmp/system_status.txt with "ALL_SYSTEMS_NOMINAL"';
  readonly hints = [
    'Use "top" or "htop" command to view system resources (simulated)',
    'Check memory with "free" command',
    'Write final status: echo "ALL_SYSTEMS_NOMINAL" > /tmp/system_status.txt'
  ];
  readonly maxHints = 3;
  readonly baseScore = 350;
  readonly timeBonus = 175;
  readonly timeLimitSeconds = 420;
  readonly initialDirectory = '/home/user';

  buildFileSystem(): FileSystemNode {
    const fs = createBaseFileSystem();
    
    fs.children!.home.children!.user.children = {
      'MONITORING.txt': {
        type: 'file',
        name: 'MONITORING.txt',
        content: `System Monitoring Task

You are now a system administrator. Your final test is to
perform a complete system health check.

Tasks:
1. Check running processes (top, ps)
2. Check memory usage (free)
3. Verify disk space (df)
4. Write status report: echo "ALL_SYSTEMS_NOMINAL" > /tmp/system_status.txt

This demonstrates your readiness for advanced system administration.`
      }
    };

    return fs;
  }

  checkWinCondition(state: TerminalState): boolean {
    // Check if user used monitoring commands
    const usedMonitorCmd = state.commandHistory.some(cmd => {
      const lower = cmd.toLowerCase();
      return lower.includes('top') || lower.includes('ps') || 
             lower.includes('free') || lower.includes('df');
    });
    
    // Check for status file
    const statusFile = state.fileSystem.children?.tmp?.children?.['system_status.txt'];
    const hasStatus = statusFile?.content?.includes('ALL_SYSTEMS_NOMINAL');
    
    return usedMonitorCmd && hasStatus;
  }
}
