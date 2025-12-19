import type { Ticket, TerminalState, FileSystemNode } from './types';
import { createBaseFileSystem } from './missions/fileSystemUtils';
import { getFileAtPath } from './levels';

// Helper function to create tickets
function createTicket(
  id: string,
  title: string,
  description: string,
  difficulty: 1 | 2 | 3,
  xpReward: number,
  timeLimit: number,
  canFail: boolean,
  buildFileSystem: () => FileSystemNode,
  checkWinCondition: (state: TerminalState) => boolean,
  hints: string[],
  sshHost: string,
  tags: string[] = []
): Ticket {
  const xpPenalty = Math.floor(xpReward * 0.3); // 30% penalty
  
  return {
    id,
    title,
    description,
    difficulty,
    xpReward,
    xpPenalty,
    timeLimit,
    canFail,
    fileSystem: buildFileSystem(),
    initialDirectory: '/home/user',
    checkWinCondition,
    hints,
    sshHost,
    tags
  };
}

// Level 3 Technician Tickets (Junior/Beginner - 15 tickets)
export const level3Tickets: Ticket[] = [
  createTicket(
    'T3-001',
    'Clear Temporary Files',
    'The /tmp directory is full. Delete all files ending with .tmp to free up space.',
    3,
    50,
    300,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.tmp.children = {
        'cache.tmp': { type: 'file', name: 'cache.tmp', content: 'x'.repeat(1000) },
        'data.tmp': { type: 'file', name: 'data.tmp', content: 'y'.repeat(500) },
        'session.tmp': { type: 'file', name: 'session.tmp', content: 'z'.repeat(300) },
        'important.txt': { type: 'file', name: 'important.txt', content: 'Keep this file!' }
      };
      return fs;
    },
    (state) => {
      const tmp = state.fileSystem.children?.tmp;
      if (!tmp || !tmp.children) return false;
      const hasTmpFiles = Object.keys(tmp.children).some(name => name.endsWith('.tmp'));
      const hasImportant = tmp.children['important.txt'] !== undefined;
      return !hasTmpFiles && hasImportant;
    },
    [
      'Use ls /tmp to see files',
      'Remove files with: rm /tmp/*.tmp',
      'Make sure to keep important.txt'
    ],
    'server-01.company.local',
    ['cleanup', 'files']
  ),

  createTicket(
    'T3-002',
    'Update System Packages',
    'Run system updates on the server. Update package list and verify update is complete.',
    3,
    40,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      return state.commandHistory.some(cmd => 
        cmd.includes('apt') && cmd.includes('update')
      );
    },
    [
      'Use apt update to refresh package lists',
      'Wait for the update to complete'
    ],
    'server-02.company.local',
    ['maintenance', 'packages']
  ),

  createTicket(
    'T3-003',
    'Check Disk Space',
    'Server is running low on disk. Check disk usage and report findings to /tmp/disk_report.txt',
    3,
    45,
    300,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children = {
        'huge.log': { type: 'file', name: 'huge.log', content: 'x'.repeat(5000) }
      };
      return fs;
    },
    (state) => {
      const usedDf = state.commandHistory.some(cmd => cmd.includes('df'));
      const report = state.fileSystem.children?.tmp?.children?.['disk_report.txt'];
      return usedDf && report !== undefined;
    },
    [
      'Use df -h to check disk space',
      'Write findings with: echo "checked" > /tmp/disk_report.txt'
    ],
    'server-03.company.local',
    ['diagnostics', 'disk']
  ),

  createTicket(
    'T3-004',
    'Restart Web Service',
    'The nginx service needs to be checked. Verify nginx is installed.',
    3,
    35,
    180,
    false,
    () => createBaseFileSystem(),
    (state) => {
      return state.commandHistory.some(cmd => 
        cmd.includes('nginx') && (cmd.includes('-v') || cmd.includes('--version'))
      ) || state.installedPackages.includes('nginx');
    },
    [
      'Check if nginx is installed',
      'Use nginx -v to check version'
    ],
    'web-01.company.local',
    ['services', 'web']
  ),

  createTicket(
    'T3-005',
    'Create Backup Directory',
    'Set up a new backup directory structure at /var/backups/daily',
    3,
    30,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const backups = getFileAtPath(state.fileSystem, '/var/backups');
      return backups?.children?.['daily'] !== undefined;
    },
    [
      'Create directory with: mkdir -p /var/backups/daily',
      'Verify with: ls /var/backups'
    ],
    'backup-01.company.local',
    ['backup', 'setup']
  ),

  createTicket(
    'T3-006',
    'Find Configuration File',
    'Locate the main.conf file somewhere in /etc and display its contents.',
    3,
    55,
    300,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['config'] = {
        type: 'directory',
        name: 'config',
        children: {
          'main.conf': {
            type: 'file',
            name: 'main.conf',
            content: 'port=8080\nmode=production'
          }
        }
      };
      return fs;
    },
    (state) => {
      return state.outputHistory.some(line => 
        line.text.includes('port=8080') && line.text.includes('mode=production')
      );
    },
    [
      'Use find /etc -name main.conf',
      'Display with cat once found'
    ],
    'server-04.company.local',
    ['configuration', 'search']
  ),

  createTicket(
    'T3-007',
    'List Active Processes',
    'Document running processes. Write process count to /tmp/process_count.txt',
    3,
    40,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedPs = state.commandHistory.some(cmd => cmd.includes('ps'));
      const countFile = state.fileSystem.children?.tmp?.children?.['process_count.txt'];
      return usedPs && countFile !== undefined;
    },
    [
      'Use ps command to list processes',
      'Count and write to file with echo'
    ],
    'server-05.company.local',
    ['monitoring', 'processes']
  ),

  createTicket(
    'T3-008',
    'Check Network Interface',
    'Verify network configuration. Document network status in /tmp/network_status.txt',
    3,
    45,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedIfconfig = state.commandHistory.some(cmd => cmd.includes('ifconfig'));
      const statusFile = state.fileSystem.children?.tmp?.children?.['network_status.txt'];
      return usedIfconfig && statusFile !== undefined;
    },
    [
      'Use ifconfig to check network',
      'Write status with echo command'
    ],
    'server-06.company.local',
    ['network', 'diagnostics']
  ),

  createTicket(
    'T3-009',
    'View System Logs',
    'Check /var/log/system.log for errors. Count ERROR lines and report count.',
    3,
    50,
    300,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children = {
        'system.log': {
          type: 'file',
          name: 'system.log',
          content: '[INFO] Started\n[ERROR] Failed connection\n[ERROR] Timeout\n[INFO] Retry successful'
        }
      };
      return fs;
    },
    (state) => {
      const usedGrep = state.commandHistory.some(cmd => 
        cmd.includes('grep') && cmd.includes('ERROR')
      );
      const countFile = state.fileSystem.children?.tmp?.children?.['error_count.txt'];
      return usedGrep && countFile?.content?.includes('2');
    },
    [
      'Use grep ERROR /var/log/system.log',
      'Count the lines (there are 2)',
      'Write count to /tmp/error_count.txt'
    ],
    'server-07.company.local',
    ['logs', 'troubleshooting']
  ),

  createTicket(
    'T3-010',
    'Create User Documentation',
    'Create a README.txt in /home/user/docs explaining the backup procedure.',
    3,
    35,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const readme = getFileAtPath(state.fileSystem, '/home/user/docs/README.txt');
      return readme !== null && (readme.content?.length || 0) > 10;
    },
    [
      'Create directory: mkdir /home/user/docs',
      'Use echo or nano to create README.txt'
    ],
    'docs-01.company.local',
    ['documentation', 'files']
  ),

  createTicket(
    'T3-011',
    'Check Memory Usage',
    'System may have memory issues. Check memory with free and document.',
    3,
    40,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedFree = state.commandHistory.some(cmd => cmd.includes('free'));
      const report = state.fileSystem.children?.tmp?.children?.['memory_check.txt'];
      return usedFree && report !== undefined;
    },
    [
      'Use free -h to check memory',
      'Document findings in /tmp/memory_check.txt'
    ],
    'server-08.company.local',
    ['memory', 'diagnostics']
  ),

  createTicket(
    'T3-012',
    'Test Connectivity',
    'Verify localhost connectivity using ping. Create /tmp/ping_ok.txt when done.',
    3,
    30,
    180,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedPing = state.commandHistory.some(cmd => cmd.includes('ping'));
      const okFile = state.fileSystem.children?.tmp?.children?.['ping_ok.txt'];
      return usedPing && okFile !== undefined;
    },
    [
      'Use ping localhost',
      'Confirm with: echo "OK" > /tmp/ping_ok.txt'
    ],
    'server-09.company.local',
    ['network', 'connectivity']
  ),

  createTicket(
    'T3-013',
    'List Installed Software',
    'Generate a list of installed packages. Write list to /tmp/packages.txt',
    3,
    40,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedApt = state.commandHistory.some(cmd => 
        cmd.includes('apt') && cmd.includes('list')
      );
      const pkgFile = state.fileSystem.children?.tmp?.children?.['packages.txt'];
      return usedApt && pkgFile !== undefined;
    },
    [
      'Use apt list --installed',
      'Redirect or manually create /tmp/packages.txt'
    ],
    'server-10.company.local',
    ['packages', 'inventory']
  ),

  createTicket(
    'T3-014',
    'Create Empty Log File',
    'Initialize a new log file at /var/log/app.log for a new application.',
    3,
    25,
    180,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const logFile = getFileAtPath(state.fileSystem, '/var/log/app.log');
      return logFile !== null;
    },
    [
      'Use touch /var/log/app.log'
    ],
    'app-01.company.local',
    ['setup', 'logs']
  ),

  createTicket(
    'T3-015',
    'Display System Info',
    'Gather system information. Check hostname and system type, write to /tmp/sysinfo.txt',
    3,
    35,
    240,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedUname = state.commandHistory.some(cmd => cmd.includes('uname'));
      const usedWhoami = state.commandHistory.some(cmd => cmd.includes('whoami'));
      const infoFile = state.fileSystem.children?.tmp?.children?.['sysinfo.txt'];
      return (usedUname || usedWhoami) && infoFile !== undefined;
    },
    [
      'Use uname -a for system info',
      'Use whoami for current user',
      'Write findings to /tmp/sysinfo.txt'
    ],
    'server-11.company.local',
    ['system', 'information']
  )
];

// Level 2 Technician Tickets (Intermediate - 15 tickets)
export const level2Tickets: Ticket[] = [
  createTicket(
    'T2-001',
    'Configure Application Port',
    'Update /etc/app/config.json to change port from 8080 to 3000 and add ssl: true',
    2,
    100,
    420,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['app'] = {
        type: 'directory',
        name: 'app',
        children: {
          'config.json': {
            type: 'file',
            name: 'config.json',
            content: '{"port": 8080, "ssl": false, "debug": true}'
          }
        }
      };
      return fs;
    },
    (state) => {
      const config = getFileAtPath(state.fileSystem, '/etc/app/config.json');
      return config?.content?.includes('"port": 3000') && 
             config?.content?.includes('"ssl": true') || false;
    },
    [
      'Edit /etc/app/config.json with nano',
      'Change port to 3000',
      'Set ssl to true'
    ],
    'app-server-01.company.local',
    ['configuration', 'application']
  ),

  createTicket(
    'T2-002',
    'Install Development Tools',
    'Set up development environment: install git, nodejs, and python3',
    2,
    120,
    360,
    true,
    () => createBaseFileSystem(),
    (state) => {
      const hasGit = state.installedPackages.includes('git');
      const hasNode = state.installedPackages.includes('nodejs');
      const hasPython = state.installedPackages.includes('python3');
      return hasGit && hasNode && hasPython;
    },
    [
      'Install packages: apt install git nodejs python3',
      'Verify with: apt list --installed'
    ],
    'dev-server-01.company.local',
    ['setup', 'development']
  ),

  createTicket(
    'T2-003',
    'Fix File Permissions Issue',
    'A critical script at /opt/scripts/deploy.sh cannot execute. Fix permissions and run it.',
    2,
    110,
    360,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!['opt'] = {
        type: 'directory',
        name: 'opt',
        children: {
          scripts: {
            type: 'directory',
            name: 'scripts',
            children: {
              'deploy.sh': {
                type: 'file',
                name: 'deploy.sh',
                content: '#!/bin/bash\necho "Deployment successful!"\necho "DEPLOY_COMPLETE"',
                permissions: 'rw-r--r--',
                executable: false
              }
            }
          }
        }
      };
      return fs;
    },
    (state) => {
      return state.outputHistory.some(line => line.text.includes('DEPLOY_COMPLETE'));
    },
    [
      'Check permissions with ls -l',
      'Add execute: chmod +x /opt/scripts/deploy.sh',
      'Run with: ./deploy.sh from the scripts directory'
    ],
    'deploy-server-01.company.local',
    ['permissions', 'scripts']
  ),

  createTicket(
    'T2-004',
    'Archive Old Logs',
    'Create a tar archive of all logs in /var/log and move to /var/backups/logs.tar',
    2,
    90,
    420,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children = {
        'app.log': { type: 'file', name: 'app.log', content: 'log data' },
        'system.log': { type: 'file', name: 'system.log', content: 'system data' },
        'error.log': { type: 'file', name: 'error.log', content: 'error data' }
      };
      fs.children!.var.children!['backups'] = {
        type: 'directory',
        name: 'backups',
        children: {}
      };
      return fs;
    },
    (state) => {
      const archive = getFileAtPath(state.fileSystem, '/var/backups/logs.tar');
      return archive !== null;
    },
    [
      'Create archive: tar -cf /var/backups/logs.tar /var/log',
      'Verify with ls /var/backups'
    ],
    'backup-server-02.company.local',
    ['backup', 'archiving']
  ),

  createTicket(
    'T2-005',
    'Database Connection Test',
    'Check if postgresql is installed, install if missing, verify installation.',
    2,
    95,
    360,
    true,
    () => createBaseFileSystem(),
    (state) => {
      const hasPostgres = state.installedPackages.includes('postgresql');
      const verified = state.commandHistory.some(cmd => 
        cmd.includes('postgresql') && (cmd.includes('-v') || cmd.includes('--version') || cmd.includes('list'))
      );
      return hasPostgres && verified;
    },
    [
      'Check if installed: apt list --installed | grep postgres',
      'Install if needed: apt install postgresql',
      'Verify with: postgresql -v or apt list --installed'
    ],
    'db-server-01.company.local',
    ['database', 'setup']
  ),

  createTicket(
    'T2-006',
    'Clean Up User Directories',
    'Remove all .cache directories from /home/user. Do not delete other files.',
    2,
    85,
    300,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.home.children!.user.children = {
        '.cache': {
          type: 'directory',
          name: '.cache',
          children: {
            'data.tmp': { type: 'file', name: 'data.tmp', content: 'cache' }
          }
        },
        'documents': {
          type: 'directory',
          name: 'documents',
          children: {
            'important.txt': { type: 'file', name: 'important.txt', content: 'Keep this' }
          }
        }
      };
      return fs;
    },
    (state) => {
      const noCache = !state.fileSystem.children?.home?.children?.user?.children?.['.cache'];
      const hasDocuments = state.fileSystem.children?.home?.children?.user?.children?.['documents'];
      return noCache && hasDocuments !== undefined;
    },
    [
      'List hidden files: ls -a /home/user',
      'Remove .cache: rm -rf /home/user/.cache',
      'Verify documents remain intact'
    ],
    'cleanup-server-01.company.local',
    ['cleanup', 'maintenance']
  ),

  createTicket(
    'T2-007',
    'Monitor System Resources',
    'Check system load, memory, and disk. Write full report to /tmp/system_health.txt',
    2,
    100,
    420,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedTop = state.commandHistory.some(cmd => cmd.includes('top') || cmd.includes('ps'));
      const usedFree = state.commandHistory.some(cmd => cmd.includes('free'));
      const usedDf = state.commandHistory.some(cmd => cmd.includes('df'));
      const report = state.fileSystem.children?.tmp?.children?.['system_health.txt'];
      return usedTop && usedFree && usedDf && report !== undefined;
    },
    [
      'Check processes: top or ps',
      'Check memory: free -h',
      'Check disk: df -h',
      'Write comprehensive report to /tmp/system_health.txt'
    ],
    'monitor-server-01.company.local',
    ['monitoring', 'health-check']
  ),

  createTicket(
    'T2-008',
    'Extract and Analyze Data',
    'Find all email addresses in /var/data/users.csv and save to /tmp/emails.txt',
    2,
    105,
    420,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!['data'] = {
        type: 'directory',
        name: 'data',
        children: {
          'users.csv': {
            type: 'file',
            name: 'users.csv',
            content: 'John,Smith,john@company.com,Sales\nJane,Doe,jane@company.com,IT\nBob,Johnson,555-1234,HR\nAlice,Wilson,alice@company.com,Marketing'
          }
        }
      };
      return fs;
    },
    (state) => {
      const emails = getFileAtPath(state.fileSystem, '/tmp/emails.txt');
      if (!emails?.content) return false;
      return emails.content.includes('john@company.com') &&
             emails.content.includes('jane@company.com') &&
             emails.content.includes('alice@company.com');
    },
    [
      'Use grep to find emails: grep @ /var/data/users.csv',
      'Redirect output: grep @ /var/data/users.csv > /tmp/emails.txt'
    ],
    'data-server-01.company.local',
    ['data', 'extraction']
  ),

  createTicket(
    'T2-009',
    'Set Up Cron Job',
    'Schedule a backup script to run daily at 3 AM. Edit /etc/crontab',
    2,
    130,
    480,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['crontab'] = {
        type: 'file',
        name: 'crontab',
        content: '# Cron jobs\nSHELL=/bin/bash\nPATH=/usr/local/bin:/usr/bin:/bin\n\n'
      };
      return fs;
    },
    (state) => {
      const cron = getFileAtPath(state.fileSystem, '/etc/crontab');
      return (cron?.content?.includes('0 3 * * *') ?? false);
    },
    [
      'Edit /etc/crontab with nano',
      'Add: 0 3 * * * /path/to/backup.sh',
      'Format: minute hour day month weekday command'
    ],
    'schedule-server-01.company.local',
    ['scheduling', 'automation']
  ),

  createTicket(
    'T2-010',
    'Network Diagnostics',
    'Check network interfaces and test connectivity. Document all findings.',
    2,
    90,
    360,
    false,
    () => createBaseFileSystem(),
    (state) => {
      const usedIfconfig = state.commandHistory.some(cmd => cmd.includes('ifconfig'));
      const usedPing = state.commandHistory.some(cmd => cmd.includes('ping'));
      const report = state.fileSystem.children?.tmp?.children?.['network_diag.txt'];
      return usedIfconfig && usedPing && report !== undefined;
    },
    [
      'Check interfaces: ifconfig',
      'Test connectivity: ping localhost',
      'Document in /tmp/network_diag.txt'
    ],
    'network-server-01.company.local',
    ['network', 'diagnostics']
  ),

  createTicket(
    'T2-011',
    'User Account Audit',
    'Review /etc/passwd and list all user accounts in /tmp/users.txt (one per line)',
    2,
    85,
    300,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['passwd'] = {
        type: 'file',
        name: 'passwd',
        content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\nadmin:x:1001:1001:Admin:/home/admin:/bin/bash'
      };
      return fs;
    },
    (state) => {
      const users = getFileAtPath(state.fileSystem, '/tmp/users.txt');
      return users?.content?.includes('root') && 
             users?.content?.includes('user') &&
             users?.content?.includes('admin') || false;
    },
    [
      'Read /etc/passwd',
      'Extract usernames (first field before :)',
      'Write to /tmp/users.txt'
    ],
    'auth-server-01.company.local',
    ['security', 'audit']
  ),

  createTicket(
    'T2-012',
    'Application Troubleshooting',
    'Find error code in /var/log/app.log and create fix script at /tmp/fix.sh',
    2,
    115,
    420,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children!['app.log'] = {
        type: 'file',
        name: 'app.log',
        content: '[INFO] Starting\n[ERROR] Connection failed - Code: ERR_CONN_TIMEOUT\n[WARN] Retrying\n[ERROR] Auth failed - Code: ERR_AUTH_INVALID'
      };
      return fs;
    },
    (state) => {
      const usedGrep = state.commandHistory.some(cmd => 
        cmd.includes('grep') && cmd.toLowerCase().includes('error')
      );
      const fixScript = getFileAtPath(state.fileSystem, '/tmp/fix.sh');
      return usedGrep && fixScript !== null;
    },
    [
      'Search logs: grep ERROR /var/log/app.log',
      'Create fix script: echo "#!/bin/bash" > /tmp/fix.sh',
      'Add your fix commands to the script'
    ],
    'troubleshoot-server-01.company.local',
    ['troubleshooting', 'logs']
  ),

  createTicket(
    'T2-013',
    'Disk Space Analysis',
    'Identify which directories use most space in /var. Report top 3 to /tmp/disk_usage.txt',
    2,
    95,
    360,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children = {
        log: {
          type: 'directory',
          name: 'log',
          children: {
            'huge.log': { type: 'file', name: 'huge.log', content: 'x'.repeat(10000) }
          }
        },
        cache: {
          type: 'directory',
          name: 'cache',
          children: {
            'data.cache': { type: 'file', name: 'data.cache', content: 'y'.repeat(5000) }
          }
        },
        www: {
          type: 'directory',
          name: 'www',
          children: {
            'index.html': { type: 'file', name: 'index.html', content: 'small' }
          }
        }
      };
      return fs;
    },
    (state) => {
      const usedDu = state.commandHistory.some(cmd => cmd.includes('du') && cmd.includes('/var'));
      const report = state.fileSystem.children?.tmp?.children?.['disk_usage.txt'];
      return usedDu && report !== undefined;
    },
    [
      'Check usage: du -h /var/*',
      'Sort by size if needed',
      'Document top 3 in /tmp/disk_usage.txt'
    ],
    'storage-server-01.company.local',
    ['storage', 'analysis']
  ),

  createTicket(
    'T2-014',
    'Service Configuration',
    'Configure nginx: install, create config at /etc/nginx/site.conf with port 8080',
    2,
    125,
    480,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['nginx'] = {
        type: 'directory',
        name: 'nginx',
        children: {}
      };
      return fs;
    },
    (state) => {
      const hasNginx = state.installedPackages.includes('nginx');
      const config = getFileAtPath(state.fileSystem, '/etc/nginx/site.conf');
      return hasNginx && config?.content?.includes('8080') || false;
    },
    [
      'Install: apt install nginx',
      'Create config: echo "server { listen 8080; }" > /etc/nginx/site.conf'
    ],
    'web-server-02.company.local',
    ['web', 'configuration']
  ),

  createTicket(
    'T2-015',
    'Log Rotation Setup',
    'Create log rotation script at /usr/local/bin/rotate_logs.sh that archives old logs',
    2,
    110,
    420,
    true,
    () => {
      const fs = createBaseFileSystem();
      return fs;
    },
    (state) => {
      const script = getFileAtPath(state.fileSystem, '/usr/local/bin/rotate_logs.sh');
      return script !== null && script.content?.includes('#!/bin/bash') || false;
    },
    [
      'Create script: echo "#!/bin/bash" > /usr/local/bin/rotate_logs.sh',
      'Add archive commands',
      'Make executable: chmod +x /usr/local/bin/rotate_logs.sh'
    ],
    'logging-server-01.company.local',
    ['maintenance', 'automation']
  )
];

// Level 1 Technician Tickets (Advanced/Senior - 15 tickets)
export const level1Tickets: Ticket[] = [
  createTicket(
    'T1-001',
    'Multi-Service Setup',
    'Deploy full stack: install nginx, postgresql, nodejs. Configure nginx on port 80.',
    1,
    200,
    600,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['nginx'] = {
        type: 'directory',
        name: 'nginx',
        children: {}
      };
      return fs;
    },
    (state) => {
      const hasAll = state.installedPackages.includes('nginx') &&
                     state.installedPackages.includes('postgresql') &&
                     state.installedPackages.includes('nodejs');
      const config = getFileAtPath(state.fileSystem, '/etc/nginx/nginx.conf');
      return hasAll && config?.content?.includes('80') || false;
    },
    [
      'Install all: apt install nginx postgresql nodejs',
      'Create nginx config with port 80',
      'Verify all services'
    ],
    'production-server-01.company.local',
    ['setup', 'full-stack']
  ),

  createTicket(
    'T1-002',
    'Critical Security Patch',
    'Apply security fix: update all packages, check for specific CVE in logs, document.',
    1,
    180,
    600,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children!['security.log'] = {
        type: 'file',
        name: 'security.log',
        content: '[CRITICAL] CVE-2024-1234: Memory leak in SSL library\n[WARNING] Update required immediately'
      };
      return fs;
    },
    (state) => {
      const updated = state.commandHistory.some(cmd => cmd.includes('apt update'));
      const checked = state.commandHistory.some(cmd => cmd.includes('grep') && cmd.includes('CVE'));
      const report = getFileAtPath(state.fileSystem, '/tmp/security_report.txt');
      return updated && checked && report !== null;
    },
    [
      'Update packages: apt update',
      'Search for CVE: grep CVE /var/log/security.log',
      'Document findings and actions taken'
    ],
    'secure-server-01.company.local',
    ['security', 'critical']
  ),

  createTicket(
    'T1-003',
    'Performance Optimization',
    'Analyze system performance. Find resource hogs. Create optimization report.',
    1,
    190,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children!['performance.log'] = {
        type: 'file',
        name: 'performance.log',
        content: '[WARN] High CPU usage on process 1234\n[WARN] Memory 95% utilized\n[INFO] Disk I/O normal'
      };
      return fs;
    },
    (state) => {
      const usedTop = state.commandHistory.some(cmd => cmd.includes('top') || cmd.includes('ps'));
      const usedFree = state.commandHistory.some(cmd => cmd.includes('free'));
      const usedDu = state.commandHistory.some(cmd => cmd.includes('du') || cmd.includes('df'));
      const report = getFileAtPath(state.fileSystem, '/tmp/optimization_report.txt');
      return usedTop && usedFree && usedDu && report !== null && (report.content?.length || 0) > 50;
    },
    [
      'Check all resources: top, free, df, du',
      'Analyze logs in /var/log/performance.log',
      'Create detailed optimization report'
    ],
    'optimize-server-01.company.local',
    ['performance', 'optimization']
  ),

  createTicket(
    'T1-004',
    'Disaster Recovery Setup',
    'Configure automated backup system with cron. Create backup script and schedule.',
    1,
    210,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['crontab'] = {
        type: 'file',
        name: 'crontab',
        content: '# System cron jobs\n'
      };
      fs.children!.opt = {
        type: 'directory',
        name: 'opt',
        children: {
          scripts: {
            type: 'directory',
            name: 'scripts',
            children: {}
          }
        }
      };
      return fs;
    },
    (state) => {
      const script = getFileAtPath(state.fileSystem, '/opt/scripts/backup.sh');
      const cron = getFileAtPath(state.fileSystem, '/etc/crontab');
      const hasScript = script !== null && script.content?.includes('#!/bin/bash');
      const hasCron = cron?.content?.includes('backup.sh');
      const isExecutable = script?.executable === true;
      return hasScript && hasCron && isExecutable || false;
    },
    [
      'Create backup script at /opt/scripts/backup.sh',
      'Make it executable: chmod +x',
      'Schedule in /etc/crontab (e.g., 0 2 * * *)'
    ],
    'backup-critical-01.company.local',
    ['backup', 'automation', 'critical']
  ),

  createTicket(
    'T1-005',
    'Complex Log Analysis',
    'Parse multiple logs, correlate errors, identify root cause, generate report.',
    1,
    195,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children = {
        'app.log': {
          type: 'file',
          name: 'app.log',
          content: '[ERROR] Database connection failed at 10:30:45\n[ERROR] Retry failed at 10:31:00'
        },
        'system.log': {
          type: 'file',
          name: 'system.log',
          content: '[WARN] Network latency spike at 10:30:40\n[ERROR] Connection timeout at 10:30:45'
        },
        'database.log': {
          type: 'file',
          name: 'database.log',
          content: '[ERROR] Too many connections at 10:30:44\n[CRITICAL] Max connections reached'
        }
      };
      return fs;
    },
    (state) => {
      const searchedMultiple = state.commandHistory.filter(cmd => 
        cmd.includes('grep') || cmd.includes('cat')
      ).length >= 3;
      const report = getFileAtPath(state.fileSystem, '/tmp/analysis_report.txt');
      return searchedMultiple && report !== null && (report.content?.length || 0) > 100;
    },
    [
      'Examine all logs in /var/log',
      'Look for time correlations',
      'Identify root cause (database connection limit)',
      'Write detailed analysis to /tmp/analysis_report.txt'
    ],
    'analysis-server-01.company.local',
    ['analysis', 'troubleshooting', 'advanced']
  ),

  createTicket(
    'T1-006',
    'Multi-Server Configuration',
    'Configure load balancer setup. Create configs for 3 backend servers.',
    1,
    220,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['loadbalancer'] = {
        type: 'directory',
        name: 'loadbalancer',
        children: {}
      };
      return fs;
    },
    (state) => {
      const config = getFileAtPath(state.fileSystem, '/etc/loadbalancer/backends.conf');
      return config !== null && 
             config.content?.includes('server1') &&
             config.content?.includes('server2') &&
             config.content?.includes('server3') || false;
    },
    [
      'Create config file: /etc/loadbalancer/backends.conf',
      'Define 3 backend servers',
      'Include ports and health checks'
    ],
    'lb-server-01.company.local',
    ['networking', 'load-balancing']
  ),

  createTicket(
    'T1-007',
    'Database Migration',
    'Prepare database backup, install new version, document migration steps.',
    1,
    205,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!['database'] = {
        type: 'directory',
        name: 'database',
        children: {
          'data.db': {
            type: 'file',
            name: 'data.db',
            content: 'DATABASE_DATA'
          }
        }
      };
      return fs;
    },
    (state) => {
      const backup = getFileAtPath(state.fileSystem, '/var/backups/database_backup.tar');
      const hasPostgres = state.installedPackages.includes('postgresql');
      const docs = getFileAtPath(state.fileSystem, '/tmp/migration_steps.txt');
      return backup !== null && hasPostgres && docs !== null;
    },
    [
      'Backup: tar -cf /var/backups/database_backup.tar /var/database',
      'Install: apt install postgresql',
      'Document steps in /tmp/migration_steps.txt'
    ],
    'database-migration-01.company.local',
    ['database', 'migration', 'critical']
  ),

  createTicket(
    'T1-008',
    'Security Hardening',
    'Implement security measures: configure firewall rules, audit users, document.',
    1,
    215,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['passwd'] = {
        type: 'file',
        name: 'passwd',
        content: 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000:User:/home/user:/bin/bash\nsuspicious:x:1002:1002::/home/suspicious:/bin/bash'
      };
      fs.children!.etc.children!['firewall'] = {
        type: 'directory',
        name: 'firewall',
        children: {}
      };
      return fs;
    },
    (state) => {
      const auditedUsers = state.commandHistory.some(cmd => cmd.includes('passwd'));
      const firewallConfig = getFileAtPath(state.fileSystem, '/etc/firewall/rules.conf');
      const securityReport = getFileAtPath(state.fileSystem, '/tmp/security_hardening.txt');
      return auditedUsers && firewallConfig !== null && securityReport !== null;
    },
    [
      'Audit users in /etc/passwd',
      'Create firewall rules in /etc/firewall/rules.conf',
      'Document all changes in /tmp/security_hardening.txt'
    ],
    'security-harden-01.company.local',
    ['security', 'hardening']
  ),

  createTicket(
    'T1-009',
    'Application Deployment',
    'Deploy web application: set up directory structure, install dependencies, configure.',
    1,
    200,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!['www'] = {
        type: 'directory',
        name: 'www',
        children: {}
      };
      return fs;
    },
    (state) => {
      const appDir = getFileAtPath(state.fileSystem, '/var/www/app');
      const hasNginx = state.installedPackages.includes('nginx');
      const hasNode = state.installedPackages.includes('nodejs');
      const config = getFileAtPath(state.fileSystem, '/var/www/app/config.json');
      return appDir !== null && hasNginx && hasNode && config !== null;
    },
    [
      'Create app directory: mkdir -p /var/www/app',
      'Install: apt install nginx nodejs',
      'Create config: /var/www/app/config.json'
    ],
    'deploy-app-01.company.local',
    ['deployment', 'application']
  ),

  createTicket(
    'T1-010',
    'Monitoring System Setup',
    'Configure comprehensive monitoring: system metrics, logs, alerts.',
    1,
    210,
    720,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.etc.children!['monitoring'] = {
        type: 'directory',
        name: 'monitoring',
        children: {}
      };
      return fs;
    },
    (state) => {
      const metricsConfig = getFileAtPath(state.fileSystem, '/etc/monitoring/metrics.conf');
      const alertsConfig = getFileAtPath(state.fileSystem, '/etc/monitoring/alerts.conf');
      const script = getFileAtPath(state.fileSystem, '/opt/scripts/monitor.sh');
      return metricsConfig !== null && alertsConfig !== null && script !== null;
    },
    [
      'Create metrics config: /etc/monitoring/metrics.conf',
      'Create alerts config: /etc/monitoring/alerts.conf',
      'Create monitoring script: /opt/scripts/monitor.sh'
    ],
    'monitoring-setup-01.company.local',
    ['monitoring', 'setup']
  ),

  createTicket(
    'T1-011',
    'Network Troubleshooting',
    'Diagnose complex network issue: check routes, DNS, connectivity, document solution.',
    1,
    185,
    600,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children!['network.log'] = {
        type: 'file',
        name: 'network.log',
        content: '[ERROR] DNS resolution failed for api.service.local\n[ERROR] Route to 10.0.0.0/24 unreachable'
      };
      fs.children!.etc.children!['resolv.conf'] = {
        type: 'file',
        name: 'resolv.conf',
        content: 'nameserver 8.8.8.8'
      };
      return fs;
    },
    (state) => {
      const usedNetworkCommands = state.commandHistory.some(cmd => 
        cmd.includes('ifconfig') || cmd.includes('ping')
      );
      const checkedLogs = state.commandHistory.some(cmd => 
        cmd.includes('cat') && cmd.includes('network.log')
      );
      const solution = getFileAtPath(state.fileSystem, '/tmp/network_solution.txt');
      return usedNetworkCommands && checkedLogs && solution !== null && (solution.content?.length || 0) > 80;
    },
    [
      'Check network config: ifconfig',
      'Test connectivity: ping',
      'Review logs: /var/log/network.log',
      'Document solution with root cause'
    ],
    'network-trouble-01.company.local',
    ['network', 'troubleshooting', 'advanced']
  ),

  createTicket(
    'T1-012',
    'Capacity Planning',
    'Analyze current usage, project growth, recommend infrastructure upgrades.',
    1,
    195,
    720,
    false,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!.log.children!['metrics.log'] = {
        type: 'file',
        name: 'metrics.log',
        content: 'CPU: 75% avg\nMemory: 82% used\nDisk: 67% used\nNetwork: 450 Mbps avg'
      };
      return fs;
    },
    (state) => {
      const analyzedSystem = state.commandHistory.filter(cmd => 
        cmd.includes('top') || cmd.includes('free') || cmd.includes('df') || cmd.includes('du')
      ).length >= 3;
      const reviewedMetrics = state.commandHistory.some(cmd => 
        cmd.includes('metrics.log')
      );
      const report = getFileAtPath(state.fileSystem, '/tmp/capacity_plan.txt');
      return analyzedSystem && reviewedMetrics && report !== null && (report.content?.length || 0) > 150;
    },
    [
      'Gather current metrics: top, free, df',
      'Review historical data in /var/log/metrics.log',
      'Project future needs',
      'Create detailed capacity plan in /tmp/capacity_plan.txt'
    ],
    'capacity-plan-01.company.local',
    ['planning', 'analysis', 'capacity']
  ),

  createTicket(
    'T1-013',
    'Disaster Recovery Test',
    'Simulate failure, execute recovery procedures, verify data integrity, document.',
    1,
    225,
    780,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.var.children!['backups'] = {
        type: 'directory',
        name: 'backups',
        children: {
          'backup.tar': {
            type: 'file',
            name: 'backup.tar',
            content: '[BACKUP DATA]'
          }
        }
      };
      fs.children!.opt.children!['recovery'] = {
        type: 'directory',
        name: 'recovery',
        children: {}
      };
      return fs;
    },
    (state) => {
      const recoveryScript = getFileAtPath(state.fileSystem, '/opt/recovery/restore.sh');
      const testResults = getFileAtPath(state.fileSystem, '/tmp/dr_test_results.txt');
      const verified = state.commandHistory.some(cmd => 
        cmd.includes('tar') || cmd.includes('backup')
      );
      return recoveryScript !== null && testResults !== null && verified;
    },
    [
      'Create recovery script: /opt/recovery/restore.sh',
      'Test restore from /var/backups/backup.tar',
      'Verify data integrity',
      'Document complete test in /tmp/dr_test_results.txt'
    ],
    'dr-test-01.company.local',
    ['disaster-recovery', 'critical', 'testing']
  ),

  createTicket(
    'T1-014',
    'Automation Pipeline',
    'Create CI/CD pipeline: build, test, and deploy scripts with error handling.',
    1,
    230,
    780,
    true,
    () => {
      const fs = createBaseFileSystem();
      fs.children!.opt.children!['cicd'] = {
        type: 'directory',
        name: 'cicd',
        children: {}
      };
      return fs;
    },
    (state) => {
      const build = getFileAtPath(state.fileSystem, '/opt/cicd/build.sh');
      const test = getFileAtPath(state.fileSystem, '/opt/cicd/test.sh');
      const deploy = getFileAtPath(state.fileSystem, '/opt/cicd/deploy.sh');
      const allExecutable = build?.executable && test?.executable && deploy?.executable;
      return build !== null && test !== null && deploy !== null && allExecutable;
    },
    [
      'Create /opt/cicd/build.sh with build steps',
      'Create /opt/cicd/test.sh with tests',
      'Create /opt/cicd/deploy.sh with deployment',
      'Make all scripts executable: chmod +x'
    ],
    'cicd-setup-01.company.local',
    ['automation', 'ci-cd', 'devops']
  ),

  createTicket(
    'T1-015',
    'System Architecture Documentation',
    'Document complete system architecture: services, dependencies, configurations.',
    1,
    190,
    720,
    false,
    () => {
      const fs = createBaseFileSystem();
      // Pre-populate with various services and configs
      fs.children!.etc.children = {
        'nginx': {
          type: 'directory',
          name: 'nginx',
          children: {
            'nginx.conf': { type: 'file', name: 'nginx.conf', content: 'server { listen 80; }' }
          }
        },
        'postgresql': {
          type: 'directory',
          name: 'postgresql',
          children: {
            'pg_hba.conf': { type: 'file', name: 'pg_hba.conf', content: 'local all all trust' }
          }
        }
      };
      return fs;
    },
    (state) => {
      const explored = state.commandHistory.filter(cmd => 
        cmd.includes('ls') || cmd.includes('cat') || cmd.includes('find')
      ).length >= 5;
      const architecture = getFileAtPath(state.fileSystem, '/tmp/system_architecture.txt');
      return explored && architecture !== null && (architecture.content?.length || 0) > 200;
    },
    [
      'Explore all services in /etc',
      'Document each service configuration',
      'Map dependencies between services',
      'Create comprehensive architecture doc in /tmp/system_architecture.txt'
    ],
    'documentation-01.company.local',
    ['documentation', 'architecture', 'analysis']
  )
];

// Export all tickets combined
export const allTickets: Ticket[] = [
  ...level3Tickets,
  ...level2Tickets,
  ...level1Tickets
];

// Helper to get available tickets for a technician level
export function getAvailableTickets(technicianLevel: 1 | 2 | 3, count: number = 5): Ticket[] {
  let pool: Ticket[] = [];
  
  // Level 3 techs can only do level 3 tickets
  // Level 2 techs can do level 2 and 3 tickets  
  // Level 1 techs can do all tickets
  if (technicianLevel === 3) {
    pool = [...level3Tickets];
  } else if (technicianLevel === 2) {
    pool = [...level2Tickets, ...level3Tickets];
  } else {
    pool = [...level1Tickets, ...level2Tickets, ...level3Tickets];
  }
  
  // Fisher-Yates shuffle algorithm for unbiased randomization
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
