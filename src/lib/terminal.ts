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
      return handleHelp();
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
    default:
      if (trimmed.startsWith('./')) {
        return handleExecuteScript(trimmed.slice(2), state);
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

function handleHelp(): CommandResult {
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
    '  nano/vim <file>        - Edit file',
    '  apt <command>          - Package manager (install, remove, list, search)',
    '  ./<script>             - Execute script',
    '  clear                  - Clear terminal',
    '  whoami                 - Display current user',
    '  date                   - Display current date/time',
    '  history                - Show command history',
    '  hint                   - Get a hint (costs points)',
    ''
  ];
  
  return {
    output: commands.map(text => ({ text, type: 'output' as const })),
    newState: {}
  };
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
