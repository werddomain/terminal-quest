import type { TerminalState, OutputLine, FileSystemNode, Level } from './types';
import { getFileAtPath } from './levels';

type CommandResult = {
  output: OutputLine[];
  newState: Partial<TerminalState>;
};

const AVAILABLE_PACKAGES = ['nginx', 'apache2', 'mysql', 'postgresql', 'nodejs', 'python3', 'git', 'vim', 'curl', 'wget'];

export function executeCommand(
  input: string,
  state: TerminalState,
  level: Level
): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { output: [], newState: {} };
  }

  const parts = trimmed.split(/\s+/);
  const command = parts[0];
  const args = parts.slice(1);

  switch (command) {
    case 'ls':
      return handleLs(args, state);
    case 'cd':
      return handleCd(args, state);
    case 'cat':
      return handleCat(args, state);
    case 'pwd':
      return handlePwd(state);
    case 'echo':
      return handleEcho(args, state);
    case 'mkdir':
      return handleMkdir(args, state);
    case 'touch':
      return handleTouch(args, state);
    case 'rm':
      return handleRm(args, state);
    case 'chmod':
      return handleChmod(args, state);
    case 'grep':
      return handleGrep(args, state);
    case 'apt':
    case 'apt-get':
      return handleApt(args, state, level);
    case 'nano':
    case 'vim':
    case 'vi':
      return handleEditor(args, state, command);
    case 'clear':
      return { output: [], newState: { outputHistory: [] } };
    case 'help':
      return handleHelp(args);
    case 'whoami':
      return { output: [{ text: 'user', type: 'output' }], newState: {} };
    case 'date':
      return { output: [{ text: new Date().toString(), type: 'output' }], newState: {} };
    case 'uname':
      return handleUname(args);
    case 'man':
      return handleMan(args);
    case 'history':
      return handleHistory(state);
    case 'find':
      return handleFind(args, state);
    case 'du':
      return handleDu(args, state);
    case 'tar':
      return handleTar(args, state);
    case 'ifconfig':
      return handleIfconfig(args);
    case 'ping':
      return handlePing(args);
    case 'ps':
      return handlePs(args);
    case 'free':
      return handleFree(args);
    case 'df':
      return handleDf(args);
    case 'top':
    case 'htop':
      return handleTop();
    default:
      if (trimmed.startsWith('./')) {
        return handleExecuteScript(trimmed.slice(2), state);
      }
      // Check if it's a package version check command (e.g., nginx -v, apache2 -v)
      // Only for installed packages to avoid false positives
      if ((args.includes('-v') || args.includes('--version')) && state.installedPackages.includes(command)) {
        return handlePackageVersion(command, state);
      }
      return {
        output: [{
          text: `${command}: command not found. Type 'help' for available commands.`,
          type: 'error'
        }],
        newState: {}
      };
  }
}

function resolvePath(path: string, currentDir: string): string {
  if (path.startsWith('/')) {
    return normalizePath(path);
  }
  if (path === '~') {
    return '/home/user';
  }
  if (path.startsWith('~/')) {
    return normalizePath('/home/user/' + path.slice(2));
  }
  return normalizePath(currentDir + '/' + path);
}

function normalizePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const result: string[] = [];
  
  for (const part of parts) {
    if (part === '..') {
      result.pop();
    } else if (part !== '.') {
      result.push(part);
    }
  }
  
  return '/' + result.join('/');
}

function getNodeAtPath(fs: FileSystemNode, path: string): FileSystemNode | null {
  return getFileAtPath(fs, path);
}

export { resolvePath, normalizePath };

function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

function handleLs(args: string[], state: TerminalState): CommandResult {
  const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
  const showLong = args.includes('-l') || args.includes('-la') || args.includes('-al');
  const targetPath = args.find(a => !a.startsWith('-')) || state.currentDirectory;
  const resolvedPath = resolvePath(targetPath, state.currentDirectory);
  
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!node) {
    return {
      output: [{ text: `ls: cannot access '${targetPath}': No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  if (node.type === 'file') {
    if (showLong) {
      const perms = node.permissions || 'rw-r--r--';
      return {
        output: [{ text: `-${perms} 1 user user ${node.content?.length || 0} ${node.name}`, type: 'output' }],
        newState: {}
      };
    }
    return {
      output: [{ text: node.name, type: 'output' }],
      newState: {}
    };
  }
  
  const entries = Object.keys(node.children || {})
    .filter(name => showAll || !name.startsWith('.'))
    .sort();
  
  if (showAll) {
    entries.unshift('.', '..');
  }
  
  if (entries.length === 0) {
    return { output: [], newState: {} };
  }
  
  if (showLong) {
    const lines = entries.map(name => {
      if (name === '.' || name === '..') {
        return `drwxr-xr-x 2 user user 4096 ${name}`;
      }
      const child = node.children![name];
      const isDir = child.type === 'directory';
      const perms = child.permissions || (isDir ? 'rwxr-xr-x' : 'rw-r--r--');
      const prefix = isDir ? 'd' : '-';
      const size = child.content?.length || 4096;
      return `${prefix}${perms} 1 user user ${size} ${name}`;
    });
    return {
      output: lines.map(text => ({ text, type: 'output' as const })),
      newState: {}
    };
  }
  
  return {
    output: [{ text: entries.join('  '), type: 'output' }],
    newState: {}
  };
}

function handleCd(args: string[], state: TerminalState): CommandResult {
  const target = args[0] || '/home/user';
  const resolvedPath = resolvePath(target, state.currentDirectory);
  
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!node) {
    return {
      output: [{ text: `cd: ${target}: No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  if (node.type !== 'directory') {
    return {
      output: [{ text: `cd: ${target}: Not a directory`, type: 'error' }],
      newState: {}
    };
  }
  
  return {
    output: [],
    newState: { currentDirectory: resolvedPath || '/' }
  };
}

function handleCat(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: 'cat: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const outputs: OutputLine[] = [];
  
  for (const arg of args) {
    const resolvedPath = resolvePath(arg, state.currentDirectory);
    const node = getNodeAtPath(state.fileSystem, resolvedPath);
    
    if (!node) {
      outputs.push({ text: `cat: ${arg}: No such file or directory`, type: 'error' });
      continue;
    }
    
    if (node.type === 'directory') {
      outputs.push({ text: `cat: ${arg}: Is a directory`, type: 'error' });
      continue;
    }
    
    if (node.content) {
      node.content.split('\n').forEach(line => {
        outputs.push({ text: line, type: 'output' });
      });
    }
  }
  
  return { output: outputs, newState: {} };
}

function handlePwd(state: TerminalState): CommandResult {
  return {
    output: [{ text: state.currentDirectory || '/', type: 'output' }],
    newState: {}
  };
}

function handleEcho(args: string[], state: TerminalState): CommandResult {
  const redirectIndex = args.findIndex(a => a === '>' || a === '>>');
  
  if (redirectIndex === -1) {
    const text = args.join(' ').replace(/^["']|["']$/g, '');
    return {
      output: [{ text, type: 'output' }],
      newState: {}
    };
  }
  
  const isAppend = args[redirectIndex] === '>>';
  const content = args.slice(0, redirectIndex).join(' ').replace(/^["']|["']$/g, '');
  const targetFile = args[redirectIndex + 1];
  
  if (!targetFile) {
    return {
      output: [{ text: 'syntax error near unexpected token `newline\'', type: 'error' }],
      newState: {}
    };
  }
  
  const resolvedPath = resolvePath(targetFile, state.currentDirectory);
  const parentPath = getParentPath(resolvedPath);
  const fileName = resolvedPath.split('/').pop()!;
  
  const parentNode = getNodeAtPath(state.fileSystem, parentPath);
  
  if (!parentNode || parentNode.type !== 'directory') {
    return {
      output: [{ text: `cannot create '${targetFile}': No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  const newParent = getNodeAtPath(newFs, parentPath)!;
  
  if (newParent.children![fileName] && newParent.children![fileName].type === 'directory') {
    return {
      output: [{ text: `cannot overwrite directory '${targetFile}'`, type: 'error' }],
      newState: {}
    };
  }
  
  const existingContent = newParent.children![fileName]?.content || '';
  newParent.children![fileName] = {
    type: 'file',
    name: fileName,
    content: isAppend ? existingContent + content + '\n' : content + '\n'
  };
  
  return {
    output: [],
    newState: { fileSystem: newFs }
  };
}

function handleMkdir(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: 'mkdir: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  const outputs: OutputLine[] = [];
  
  for (const arg of args.filter(a => !a.startsWith('-'))) {
    const resolvedPath = resolvePath(arg, state.currentDirectory);
    const parentPath = getParentPath(resolvedPath);
    const dirName = resolvedPath.split('/').pop()!;
    
    const parentNode = getNodeAtPath(newFs, parentPath);
    
    if (!parentNode) {
      outputs.push({ text: `mkdir: cannot create directory '${arg}': No such file or directory`, type: 'error' });
      continue;
    }
    
    if (parentNode.children![dirName]) {
      outputs.push({ text: `mkdir: cannot create directory '${arg}': File exists`, type: 'error' });
      continue;
    }
    
    parentNode.children![dirName] = {
      type: 'directory',
      name: dirName,
      children: {}
    };
  }
  
  return { output: outputs, newState: { fileSystem: newFs } };
}

function handleTouch(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: 'touch: missing file operand', type: 'error' }],
      newState: {}
    };
  }
  
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  
  for (const arg of args) {
    const resolvedPath = resolvePath(arg, state.currentDirectory);
    const parentPath = getParentPath(resolvedPath);
    const fileName = resolvedPath.split('/').pop()!;
    
    const parentNode = getNodeAtPath(newFs, parentPath);
    
    if (!parentNode || parentNode.type !== 'directory') {
      return {
        output: [{ text: `touch: cannot touch '${arg}': No such file or directory`, type: 'error' }],
        newState: {}
      };
    }
    
    if (!parentNode.children![fileName]) {
      parentNode.children![fileName] = {
        type: 'file',
        name: fileName,
        content: ''
      };
    }
  }
  
  return { output: [], newState: { fileSystem: newFs } };
}

function handleRm(args: string[], state: TerminalState): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: 'rm: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  const outputs: OutputLine[] = [];
  
  for (const arg of args.filter(a => !a.startsWith('-'))) {
    const resolvedPath = resolvePath(arg, state.currentDirectory);
    const parentPath = getParentPath(resolvedPath);
    const name = resolvedPath.split('/').pop()!;
    
    const parentNode = getNodeAtPath(newFs, parentPath);
    const targetNode = getNodeAtPath(newFs, resolvedPath);
    
    if (!targetNode) {
      outputs.push({ text: `rm: cannot remove '${arg}': No such file or directory`, type: 'error' });
      continue;
    }
    
    if (targetNode.type === 'directory' && !recursive) {
      outputs.push({ text: `rm: cannot remove '${arg}': Is a directory`, type: 'error' });
      continue;
    }
    
    delete parentNode!.children![name];
  }
  
  return { output: outputs, newState: { fileSystem: newFs } };
}

function handleChmod(args: string[], state: TerminalState): CommandResult {
  if (args.length < 2) {
    return {
      output: [{ text: 'chmod: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const mode = args[0];
  const targetFile = args[1];
  const resolvedPath = resolvePath(targetFile, state.currentDirectory);
  
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!node) {
    return {
      output: [{ text: `chmod: cannot access '${targetFile}': No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  const targetNode = getNodeAtPath(newFs, resolvedPath)!;
  
  if (mode === '+x' || mode === '755' || mode === '777') {
    targetNode.executable = true;
    targetNode.permissions = 'rwxr-xr-x';
  } else if (mode === '-x' || mode === '644') {
    targetNode.executable = false;
    targetNode.permissions = 'rw-r--r--';
  }
  
  return { output: [], newState: { fileSystem: newFs } };
}

function handleGrep(args: string[], state: TerminalState): CommandResult {
  if (args.length < 2) {
    return {
      output: [{ text: 'grep: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const pattern = args[0].replace(/^["']|["']$/g, '');
  const files = args.slice(1);
  const outputs: OutputLine[] = [];
  
  for (const file of files) {
    const resolvedPath = resolvePath(file, state.currentDirectory);
    const node = getNodeAtPath(state.fileSystem, resolvedPath);
    
    if (!node) {
      outputs.push({ text: `grep: ${file}: No such file or directory`, type: 'error' });
      continue;
    }
    
    if (node.type === 'directory') {
      outputs.push({ text: `grep: ${file}: Is a directory`, type: 'error' });
      continue;
    }
    
    if (node.content) {
      const lines = node.content.split('\n');
      for (const line of lines) {
        if (line.toLowerCase().includes(pattern.toLowerCase())) {
          outputs.push({
            text: files.length > 1 ? `${file}:${line}` : line,
            type: 'output'
          });
        }
      }
    }
  }
  
  return { output: outputs, newState: {} };
}

function handleApt(args: string[], state: TerminalState, level: Level): CommandResult {
  const subCommand = args[0];
  
  switch (subCommand) {
    case 'install': {
      const packages = args.slice(1).filter(a => !a.startsWith('-'));
      if (packages.length === 0) {
        return {
          output: [{ text: 'apt: need at least one package name', type: 'error' }],
          newState: {}
        };
      }
      
      const availablePackages = level.packages || AVAILABLE_PACKAGES;
      const outputs: OutputLine[] = [];
      const newInstalled = [...state.installedPackages];
      
      for (const pkg of packages) {
        if (!availablePackages.includes(pkg)) {
          outputs.push({ text: `E: Unable to locate package ${pkg}`, type: 'error' });
          continue;
        }
        
        if (newInstalled.includes(pkg)) {
          outputs.push({ text: `${pkg} is already installed.`, type: 'info' });
          continue;
        }
        
        outputs.push({ text: `Reading package lists... Done`, type: 'output' });
        outputs.push({ text: `Setting up ${pkg}...`, type: 'output' });
        outputs.push({ text: `${pkg} has been successfully installed.`, type: 'success' });
        newInstalled.push(pkg);
      }
      
      return { output: outputs, newState: { installedPackages: newInstalled } };
    }
    
    case 'remove':
    case 'uninstall': {
      const packages = args.slice(1).filter(a => !a.startsWith('-'));
      const outputs: OutputLine[] = [];
      const newInstalled = state.installedPackages.filter(p => !packages.includes(p));
      
      for (const pkg of packages) {
        if (!state.installedPackages.includes(pkg)) {
          outputs.push({ text: `Package '${pkg}' is not installed.`, type: 'info' });
        } else {
          outputs.push({ text: `Removing ${pkg}...`, type: 'output' });
          outputs.push({ text: `${pkg} has been removed.`, type: 'success' });
        }
      }
      
      return { output: outputs, newState: { installedPackages: newInstalled } };
    }
    
    case 'list': {
      if (args.includes('--installed')) {
        if (state.installedPackages.length === 0) {
          return {
            output: [{ text: 'No packages installed.', type: 'info' }],
            newState: {}
          };
        }
        return {
          output: state.installedPackages.map(pkg => ({ text: `${pkg}/stable installed`, type: 'output' as const })),
          newState: {}
        };
      }
      const availablePackages = level.packages || AVAILABLE_PACKAGES;
      return {
        output: availablePackages.map(pkg => ({
          text: `${pkg}/stable ${state.installedPackages.includes(pkg) ? '[installed]' : ''}`,
          type: 'output' as const
        })),
        newState: {}
      };
    }
    
    case 'search': {
      const query = args[1]?.toLowerCase() || '';
      const availablePackages = level.packages || AVAILABLE_PACKAGES;
      const matches = availablePackages.filter(p => p.includes(query));
      
      if (matches.length === 0) {
        return {
          output: [{ text: 'No packages found.', type: 'info' }],
          newState: {}
        };
      }
      
      return {
        output: matches.map(pkg => ({ text: pkg, type: 'output' as const })),
        newState: {}
      };
    }
    
    case 'update':
      return {
        output: [
          { text: 'Hit:1 http://archive.ubuntu.com/ubuntu focal InRelease', type: 'output' },
          { text: 'Reading package lists... Done', type: 'output' }
        ],
        newState: {}
      };
    
    default:
      return {
        output: [{ text: `apt: unknown command '${subCommand}'`, type: 'error' }],
        newState: {}
      };
  }
}

function handleEditor(args: string[], state: TerminalState, editor: string): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: `${editor}: no file specified`, type: 'error' }],
      newState: {}
    };
  }
  
  const targetFile = args[0];
  const resolvedPath = resolvePath(targetFile, state.currentDirectory);
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  const content = node?.type === 'file' ? (node.content || '') : '';
  
  return {
    output: [{ text: `Opening ${targetFile} in editor...`, type: 'info' }],
    newState: {
      editingFile: resolvedPath,
      editingContent: content
    }
  };
}

function handleExecuteScript(scriptName: string, state: TerminalState): CommandResult {
  const resolvedPath = resolvePath(scriptName, state.currentDirectory);
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!node) {
    return {
      output: [{ text: `./${scriptName}: No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  if (node.type === 'directory') {
    return {
      output: [{ text: `./${scriptName}: Is a directory`, type: 'error' }],
      newState: {}
    };
  }
  
  if (!node.executable) {
    return {
      output: [{ text: `./${scriptName}: Permission denied`, type: 'error' }],
      newState: {}
    };
  }
  
  const outputs: OutputLine[] = [];
  const lines = (node.content || '').split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    
    if (trimmed.startsWith('echo ')) {
      const text = trimmed.slice(5).replace(/^["']|["']$/g, '');
      outputs.push({ text, type: 'output' });
    }
  }
  
  return { output: outputs, newState: {} };
}

function handleHelp(args: string[] = []): CommandResult {
  // If a specific command is requested, show detailed help
  if (args.length > 0) {
    const commandName = args[0];
    const detailedHelp = getDetailedHelp(commandName);
    
    if (detailedHelp) {
      return {
        output: detailedHelp.map(text => ({ text, type: 'output' as const })),
        newState: {}
      };
    } else {
      return {
        output: [{ text: `No help available for '${commandName}'. Type 'help' to see all available commands.`, type: 'error' }],
        newState: {}
      };
    }
  }
  
  // Show general help with all commands
  const commands = [
    'Available commands:',
    '',
    '  ls [options] [path]    - List directory contents (-a, -l)',
    '  cd <path>              - Change directory',
    '  pwd                    - Print working directory',
    '  cat <file>             - Display file contents',
    '  echo <text> [> file]   - Print text or write to file',
    '  mkdir <dir>            - Create directory',
    '  touch <file>           - Create empty file',
    '  rm [-r] <file>         - Remove file or directory',
    '  chmod <mode> <file>    - Change file permissions',
    '  grep <pattern> <file>  - Search for pattern in file',
    '  find <path> -name <pattern> - Find files by name',
    '  nano/vim <file>        - Edit file',
    '  apt <command>          - Package manager (install, remove, list, search)',
    '  tar -cf <archive> <files> - Create tar archive',
    '  du [-h] [path]         - Display disk usage',
    '  df [-h]                - Display disk space',
    '  ps [aux]               - Display running processes',
    '  top                    - Display system resource usage',
    '  free [-h]              - Display memory usage',
    '  ifconfig               - Display network interfaces',
    '  ping <host>            - Test network connectivity',
    '  ./<script>             - Execute script',
    '  clear                  - Clear terminal',
    '  whoami                 - Display current user',
    '  date                   - Display current date/time',
    '  history                - Show command history',
    '  hint                   - Get a hint (costs points)',
    '',
    'Type "help <command>" for detailed information about a specific command.',
    ''
  ];
  
  return {
    output: commands.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function getDetailedHelp(command: string): string[] | null {
  const helpPages: Record<string, string[]> = {
    ls: [
      'ls - List directory contents',
      '',
      'SYNOPSIS',
      '  ls [OPTIONS] [PATH]',
      '',
      'DESCRIPTION',
      '  List information about files and directories. By default, lists',
      '  the contents of the current directory.',
      '',
      'OPTIONS',
      '  -a      Show all files, including hidden files (starting with .)',
      '  -l      Use long listing format (shows permissions, size, etc.)',
      '  -la     Combine both -l and -a options',
      '',
      'EXAMPLES',
      '  ls              List files in current directory',
      '  ls -a           List all files including hidden ones',
      '  ls -l /home     List files in /home with detailed information',
      ''
    ],
    cd: [
      'cd - Change directory',
      '',
      'SYNOPSIS',
      '  cd [PATH]',
      '',
      'DESCRIPTION',
      '  Change the current working directory to PATH. If no PATH is',
      '  provided, changes to the home directory (/home/user).',
      '',
      'SPECIAL PATHS',
      '  ~       Home directory (/home/user)',
      '  ..      Parent directory',
      '  .       Current directory',
      '  /       Root directory',
      '',
      'EXAMPLES',
      '  cd              Go to home directory',
      '  cd /var/log     Go to /var/log directory',
      '  cd ..           Go to parent directory',
      ''
    ],
    pwd: [
      'pwd - Print working directory',
      '',
      'SYNOPSIS',
      '  pwd',
      '',
      'DESCRIPTION',
      '  Displays the full path of the current working directory.',
      '',
      'EXAMPLES',
      '  pwd             Display current directory path',
      ''
    ],
    cat: [
      'cat - Concatenate and display files',
      '',
      'SYNOPSIS',
      '  cat <FILE>...',
      '',
      'DESCRIPTION',
      '  Read files and print their contents to the terminal.',
      '  Can display multiple files in sequence.',
      '',
      'EXAMPLES',
      '  cat file.txt            Display contents of file.txt',
      '  cat file1.txt file2.txt Display multiple files',
      ''
    ],
    echo: [
      'echo - Display text or write to file',
      '',
      'SYNOPSIS',
      '  echo <TEXT>',
      '  echo <TEXT> > <FILE>',
      '  echo <TEXT> >> <FILE>',
      '',
      'DESCRIPTION',
      '  Display TEXT to the terminal or redirect it to a file.',
      '  Use > to overwrite a file, or >> to append to a file.',
      '',
      'EXAMPLES',
      '  echo Hello              Print "Hello" to terminal',
      '  echo "Test" > file.txt  Write "Test" to file.txt (overwrite)',
      '  echo "More" >> file.txt Append "More" to file.txt',
      ''
    ],
    mkdir: [
      'mkdir - Create directory',
      '',
      'SYNOPSIS',
      '  mkdir <DIRECTORY>...',
      '',
      'DESCRIPTION',
      '  Create new directories with the specified names.',
      '  Parent directories must already exist.',
      '',
      'EXAMPLES',
      '  mkdir mydir           Create directory named "mydir"',
      '  mkdir dir1 dir2 dir3  Create multiple directories',
      ''
    ],
    touch: [
      'touch - Create empty file',
      '',
      'SYNOPSIS',
      '  touch <FILE>...',
      '',
      'DESCRIPTION',
      '  Create new empty files with the specified names.',
      '  If the file already exists, it is not modified.',
      '',
      'EXAMPLES',
      '  touch file.txt        Create empty file.txt',
      '  touch a.txt b.txt     Create multiple files',
      ''
    ],
    rm: [
      'rm - Remove files or directories',
      '',
      'SYNOPSIS',
      '  rm [OPTIONS] <FILE>...',
      '',
      'DESCRIPTION',
      '  Remove (delete) files or directories. Use with caution as',
      '  deleted files cannot be recovered.',
      '',
      'OPTIONS',
      '  -r, -rf   Remove directories and their contents recursively',
      '',
      'EXAMPLES',
      '  rm file.txt     Delete file.txt',
      '  rm -r mydir     Delete directory mydir and all its contents',
      ''
    ],
    chmod: [
      'chmod - Change file permissions',
      '',
      'SYNOPSIS',
      '  chmod <MODE> <FILE>',
      '',
      'DESCRIPTION',
      '  Change the access permissions of a file or directory.',
      '  Permissions control who can read, write, or execute a file.',
      '',
      'MODES',
      '  +x          Add execute permission',
      '  -x          Remove execute permission',
      '  755         rwxr-xr-x (owner: all, group/others: read+execute)',
      '  777         rwxrwxrwx (all permissions for everyone)',
      '  644         rw-r--r-- (owner: read+write, others: read only)',
      '',
      'PERMISSION FORMAT',
      '  r  Read permission (view file contents)',
      '  w  Write permission (modify file)',
      '  x  Execute permission (run as script/program)',
      '',
      'EXAMPLES',
      '  chmod +x script.sh    Make script.sh executable',
      '  chmod 755 script.sh   Set permissions to rwxr-xr-x',
      '  chmod 644 file.txt    Set permissions to rw-r--r--',
      ''
    ],
    grep: [
      'grep - Search for patterns in files',
      '',
      'SYNOPSIS',
      '  grep <PATTERN> <FILE>...',
      '',
      'DESCRIPTION',
      '  Search for lines containing PATTERN in the specified files.',
      '  The search is case-insensitive.',
      '',
      'EXAMPLES',
      '  grep error log.txt      Find lines with "error" in log.txt',
      '  grep test *.txt         Search for "test" in all .txt files',
      ''
    ],
    nano: [
      'nano/vim/vi - Text editor',
      '',
      'SYNOPSIS',
      '  nano <FILE>',
      '  vim <FILE>',
      '  vi <FILE>',
      '',
      'DESCRIPTION',
      '  Open a text editor to create or modify files.',
      '  Use the editor interface to make changes.',
      '',
      'EXAMPLES',
      '  nano config.txt    Edit config.txt with nano',
      '  vim script.sh      Edit script.sh with vim',
      ''
    ],
    vim: [
      'vim/nano/vi - Text editor',
      '',
      'SYNOPSIS',
      '  vim <FILE>',
      '  nano <FILE>',
      '  vi <FILE>',
      '',
      'DESCRIPTION',
      '  Open a text editor to create or modify files.',
      '  Use the editor interface to make changes.',
      '',
      'EXAMPLES',
      '  vim script.sh      Edit script.sh with vim',
      '  nano config.txt    Edit config.txt with nano',
      ''
    ],
    vi: [
      'vi/vim/nano - Text editor',
      '',
      'SYNOPSIS',
      '  vi <FILE>',
      '  vim <FILE>',
      '  nano <FILE>',
      '',
      'DESCRIPTION',
      '  Open a text editor to create or modify files.',
      '  Use the editor interface to make changes.',
      '',
      'EXAMPLES',
      '  vi script.sh       Edit script.sh with vi',
      '  vim config.txt     Edit config.txt with vim',
      ''
    ],
    apt: [
      'apt - Package management system',
      '',
      'SYNOPSIS',
      '  apt <COMMAND> [OPTIONS] [PACKAGES]',
      '',
      'DESCRIPTION',
      '  APT (Advanced Package Tool) is used to install, remove, and',
      '  manage software packages on the system.',
      '',
      'COMMANDS',
      '  install <pkg>     Install one or more packages',
      '  remove <pkg>      Remove installed packages',
      '  list              List available packages',
      '  list --installed  List only installed packages',
      '  search <query>    Search for packages matching query',
      '  update            Update package list',
      '',
      'EXAMPLES',
      '  apt install nginx       Install nginx web server',
      '  apt remove apache2      Remove apache2',
      '  apt list --installed    Show installed packages',
      '  apt search python       Find packages with "python"',
      ''
    ],
    clear: [
      'clear - Clear the terminal screen',
      '',
      'SYNOPSIS',
      '  clear',
      '',
      'DESCRIPTION',
      '  Clears all previous output from the terminal screen,',
      '  providing a clean workspace.',
      '',
      'EXAMPLES',
      '  clear    Clear terminal screen',
      ''
    ],
    whoami: [
      'whoami - Display current user',
      '',
      'SYNOPSIS',
      '  whoami',
      '',
      'DESCRIPTION',
      '  Display the username of the current user.',
      '',
      'EXAMPLES',
      '  whoami    Show current username',
      ''
    ],
    date: [
      'date - Display current date and time',
      '',
      'SYNOPSIS',
      '  date',
      '',
      'DESCRIPTION',
      '  Display the current system date and time.',
      '',
      'EXAMPLES',
      '  date    Show current date and time',
      ''
    ],
    history: [
      'history - Show command history',
      '',
      'SYNOPSIS',
      '  history',
      '',
      'DESCRIPTION',
      '  Display a list of previously executed commands with',
      '  their sequence numbers.',
      '',
      'EXAMPLES',
      '  history    Show all previous commands',
      ''
    ],
    hint: [
      'hint - Get a hint for the current level',
      '',
      'SYNOPSIS',
      '  hint',
      '',
      'DESCRIPTION',
      '  Display a hint to help solve the current puzzle.',
      '  Using hints will reduce your score by 25 points.',
      '',
      'EXAMPLES',
      '  hint    Show next available hint',
      ''
    ],
    help: [
      'help - Display help information',
      '',
      'SYNOPSIS',
      '  help [COMMAND]',
      '',
      'DESCRIPTION',
      '  Without arguments, displays a list of all available commands.',
      '  With a command name, displays detailed help for that command.',
      '',
      'EXAMPLES',
      '  help           Show all available commands',
      '  help chmod     Show detailed help for chmod',
      '  help ls        Show detailed help for ls',
      ''
    ]
  };
  
  return helpPages[command] || null;
}

function handleUname(args: string[]): CommandResult {
  if (args.includes('-a')) {
    return {
      output: [{ text: 'Linux terminal-quest 5.15.0-generic #1 SMP x86_64 GNU/Linux', type: 'output' }],
      newState: {}
    };
  }
  return {
    output: [{ text: 'Linux', type: 'output' }],
    newState: {}
  };
}

function handleMan(args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      output: [{ text: 'What manual page do you want?', type: 'error' }],
      newState: {}
    };
  }
  
  const manPages: Record<string, string[]> = {
    ls: ['LS(1)', '', 'NAME', '       ls - list directory contents', '', 'SYNOPSIS', '       ls [OPTION]... [FILE]...', '', 'OPTIONS', '       -a     do not ignore entries starting with .', '       -l     use a long listing format'],
    cd: ['CD(1)', '', 'NAME', '       cd - change directory', '', 'SYNOPSIS', '       cd [DIR]', '', 'DESCRIPTION', '       Change the current directory to DIR.'],
    cat: ['CAT(1)', '', 'NAME', '       cat - concatenate files and print', '', 'SYNOPSIS', '       cat [FILE]...'],
  };
  
  const page = manPages[args[0]];
  if (page) {
    return {
      output: page.map(text => ({ text, type: 'output' as const })),
      newState: {}
    };
  }
  
  return {
    output: [{ text: `No manual entry for ${args[0]}`, type: 'error' }],
    newState: {}
  };
}

function handleHistory(state: TerminalState): CommandResult {
  return {
    output: state.commandHistory.map((cmd, i) => ({
      text: `  ${i + 1}  ${cmd}`,
      type: 'output' as const
    })),
    newState: {}
  };
}

function handlePackageVersion(packageName: string, state: TerminalState): CommandResult {
  // Check if the package is installed
  if (!state.installedPackages.includes(packageName)) {
    return {
      output: [{ text: `${packageName}: command not found`, type: 'error' }],
      newState: {}
    };
  }

  // Return a mock version for installed packages
  const versions: Record<string, string> = {
    nginx: 'nginx version: nginx/1.18.0',
    apache2: 'Server version: Apache/2.4.41 (Ubuntu)',
    mysql: 'mysql  Ver 8.0.27-0ubuntu0.20.04.1',
    postgresql: 'psql (PostgreSQL) 12.9',
    nodejs: 'v14.17.0',
    python3: 'Python 3.8.10',
    git: 'git version 2.25.1',
    vim: 'VIM - Vi IMproved 8.1',
    curl: 'curl 7.68.0',
    wget: 'GNU Wget 1.20.3'
  };

  const version = versions[packageName] || `${packageName} version 1.0.0`;
  
  return {
    output: [{ text: version, type: 'output' }],
    newState: {}
  };
}

function handleFind(args: string[], state: TerminalState): CommandResult {
  // Simple implementation: find <path> -name <pattern>
  const nameIndex = args.indexOf('-name');
  const path = args[0] || state.currentDirectory;
  
  if (nameIndex === -1 || !args[nameIndex + 1]) {
    return {
      output: [{ text: 'find: usage: find <path> -name <pattern>', type: 'error' }],
      newState: {}
    };
  }
  
  // Remove quotes and convert glob pattern to simple string matching
  const pattern = args[nameIndex + 1].replace(/^['"]|['"]$/g, '').replace(/\*/g, '');
  const results: string[] = [];
  
  function searchNode(node: FileSystemNode, currentPath: string) {
    // Match if pattern is found anywhere in the filename
    if (node.name.includes(pattern)) {
      const fullPath = currentPath === '/' ? '/' + node.name : currentPath + '/' + node.name;
      results.push(fullPath);
    }
    
    if (node.type === 'directory' && node.children) {
      for (const childName in node.children) {
        const child = node.children[childName];
        const newPath = currentPath === '/' ? '/' + node.name : currentPath + '/' + node.name;
        searchNode(child, newPath);
      }
    }
  }
  
  const resolvedPath = resolvePath(path, state.currentDirectory);
  const startNode = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!startNode) {
    return {
      output: [{ text: `find: '${path}': No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  if (startNode.type === 'directory' && startNode.children) {
    for (const childName in startNode.children) {
      const child = startNode.children[childName];
      searchNode(child, resolvedPath === '/' ? '' : resolvedPath);
    }
  }
  
  return {
    output: results.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handleDu(args: string[], state: TerminalState): CommandResult {
  const humanReadable = args.includes('-h');
  const summary = args.includes('-s');
  const path = args.find(a => !a.startsWith('-')) || state.currentDirectory;
  const resolvedPath = resolvePath(path, state.currentDirectory);
  
  const node = getNodeAtPath(state.fileSystem, resolvedPath);
  
  if (!node) {
    return {
      output: [{ text: `du: cannot access '${path}': No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  function getSize(n: FileSystemNode): number {
    if (n.type === 'file') {
      return n.content?.length || 0;
    }
    let total = 4096; // Base directory size
    if (n.children) {
      for (const child of Object.values(n.children)) {
        total += getSize(child);
      }
    }
    return total;
  }
  
  const outputs: OutputLine[] = [];
  
  if (node.type === 'directory' && node.children && !summary) {
    for (const [name, child] of Object.entries(node.children)) {
      const size = getSize(child);
      const displaySize = humanReadable ? formatSize(size) : Math.ceil(size / 1024).toString();
      outputs.push({ text: `${displaySize}\t${path}/${name}`, type: 'output' });
    }
  }
  
  const totalSize = getSize(node);
  const displaySize = humanReadable ? formatSize(totalSize) : Math.ceil(totalSize / 1024).toString();
  outputs.push({ text: `${displaySize}\t${path}`, type: 'output' });
  
  return { output: outputs, newState: {} };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'K';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + 'M';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + 'G';
}

function handleTar(args: string[], state: TerminalState): CommandResult {
  // Simple tar implementation: tar -cf archive.tar directory
  const createMode = args.includes('-cf') || (args.includes('-c') && args.includes('-f'));
  
  if (!createMode) {
    return {
      output: [{ text: 'tar: usage: tar -cf <archive> <files>', type: 'error' }],
      newState: {}
    };
  }
  
  const cfIndex = args.findIndex(a => a === '-cf');
  const archiveName = cfIndex !== -1 ? args[cfIndex + 1] : args.find((a, i) => i > 0 && !a.startsWith('-'));
  const sourcePath = cfIndex !== -1 ? args[cfIndex + 2] : args.find((a, i) => i > 1 && !a.startsWith('-'));
  
  if (!archiveName || !sourcePath) {
    return {
      output: [{ text: 'tar: missing operand', type: 'error' }],
      newState: {}
    };
  }
  
  const resolvedSource = resolvePath(sourcePath, state.currentDirectory);
  const sourceNode = getNodeAtPath(state.fileSystem, resolvedSource);
  
  if (!sourceNode) {
    return {
      output: [{ text: `tar: ${sourcePath}: Cannot stat: No such file or directory`, type: 'error' }],
      newState: {}
    };
  }
  
  // Create the archive file
  const resolvedArchive = resolvePath(archiveName, state.currentDirectory);
  const parentPath = getParentPath(resolvedArchive);
  const fileName = resolvedArchive.split('/').pop()!;
  
  const newFs = JSON.parse(JSON.stringify(state.fileSystem));
  const parentNode = getNodeAtPath(newFs, parentPath);
  
  if (!parentNode || parentNode.type !== 'directory') {
    return {
      output: [{ text: `tar: ${archiveName}: Cannot create archive`, type: 'error' }],
      newState: {}
    };
  }
  
  parentNode.children![fileName] = {
    type: 'file',
    name: fileName,
    content: `[TAR ARCHIVE of ${sourcePath}]`
  };
  
  return {
    output: [{ text: `Created archive ${archiveName}`, type: 'success' }],
    newState: { fileSystem: newFs }
  };
}

function handleIfconfig(args: string[]): CommandResult {
  const output = [
    'eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500',
    '        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255',
    '        inet6 fe80::a00:27ff:fe4e:66a1  prefixlen 64  scopeid 0x20<link>',
    '        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)',
    '',
    'lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536',
    '        inet 127.0.0.1  netmask 255.0.0.0',
    '        inet6 ::1  prefixlen 128  scopeid 0x10<host>',
    '        loop  txqueuelen 1000  (Local Loopback)'
  ];
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handlePing(args: string[]): CommandResult {
  const target = args[0] || 'localhost';
  const output = [
    `PING ${target} (127.0.0.1) 56(84) bytes of data.`,
    `64 bytes from ${target} (127.0.0.1): icmp_seq=1 ttl=64 time=0.045 ms`,
    `64 bytes from ${target} (127.0.0.1): icmp_seq=2 ttl=64 time=0.052 ms`,
    `64 bytes from ${target} (127.0.0.1): icmp_seq=3 ttl=64 time=0.048 ms`,
    ``,
    `--- ${target} ping statistics ---`,
    `3 packets transmitted, 3 received, 0% packet loss, time 2048ms`,
    `rtt min/avg/max/mdev = 0.045/0.048/0.052/0.006 ms`
  ];
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handlePs(args: string[]): CommandResult {
  const showAll = args.includes('aux') || args.includes('-aux');
  
  const processes = [
    'PID TTY          TIME CMD',
    '  1 ?        00:00:01 init',
    ' 42 ?        00:00:00 systemd',
    '156 ?        00:00:00 sshd',
    '234 ?        00:00:02 cron',
    '567 pts/0    00:00:00 bash',
    '890 pts/0    00:00:00 ps'
  ];
  
  const processesAux = [
    'USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND',
    'root         1  0.0  0.1 168536 11840 ?        Ss   Jan01   0:01 /sbin/init',
    'root        42  0.0  0.2  45232  3456 ?        Ss   Jan01   0:00 /lib/systemd/systemd',
    'root       156  0.0  0.1  72344  5760 ?        Ss   Jan01   0:00 /usr/sbin/sshd',
    'root       234  0.0  0.0  26920  2304 ?        Ss   Jan01   0:02 /usr/sbin/cron',
    'user       567  0.0  0.1  21520  4096 pts/0    Ss   10:30   0:00 -bash',
    'user       890  0.0  0.0  38392  3200 pts/0    R+   10:45   0:00 ps aux'
  ];
  
  const output = showAll ? processesAux : processes;
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handleFree(args: string[]): CommandResult {
  const humanReadable = args.includes('-h');
  
  const output = humanReadable ? [
    '              total        used        free      shared  buff/cache   available',
    'Mem:          7.7Gi       3.2Gi       1.5Gi       256Mi       3.0Gi       4.1Gi',
    'Swap:         2.0Gi       512Mi       1.5Gi'
  ] : [
    '              total        used        free      shared  buff/cache   available',
    'Mem:        8165432     3354876     1572864      262144     3145728     4294967',
    'Swap:       2097152      524288     1572864'
  ];
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handleDf(args: string[]): CommandResult {
  const humanReadable = args.includes('-h');
  
  const output = humanReadable ? [
    'Filesystem      Size  Used Avail Use% Mounted on',
    '/dev/sda1        50G   28G   20G  59% /',
    'tmpfs           3.9G  1.2M  3.9G   1% /dev/shm',
    '/dev/sda2       100G   45G   50G  48% /home'
  ] : [
    'Filesystem     1K-blocks     Used Available Use% Mounted on',
    '/dev/sda1       52428800 29360128  20971520  59% /',
    'tmpfs            4096000     1228   4094772   1% /dev/shm',
    '/dev/sda2      104857600 47185920  52428800  48% /home'
  ];
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}

function handleTop(): CommandResult {
  const output = [
    'top - 10:45:23 up 15 days,  3:14,  1 user,  load average: 0.52, 0.48, 0.45',
    'Tasks: 198 total,   1 running, 197 sleeping,   0 stopped,   0 zombie',
    '%Cpu(s):  8.3 us,  2.1 sy,  0.0 ni, 89.2 id,  0.3 wa,  0.0 hi,  0.1 si,  0.0 st',
    'MiB Mem :   7974.5 total,   1535.7 free,   3273.2 used,   3165.6 buff/cache',
    'MiB Swap:   2048.0 total,   1536.0 free,    512.0 used.   4194.3 avail Mem',
    '',
    '  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
    '    1 root      20   0  168536  11840   8960 S   0.0   0.1   0:01.34 init',
    '  567 user      20   0   21520   4096   3456 S   0.0   0.1   0:00.12 bash',
    '  890 user      20   0   38392   3200   2688 R   0.3   0.0   0:00.01 top'
  ];
  
  return {
    output: output.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
}
