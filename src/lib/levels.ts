import type { Level, FileSystemNode } from './types';

const createBaseFileSystem = (): FileSystemNode => ({
  type: 'directory',
  name: '/',
  children: {
    home: {
      type: 'directory',
      name: 'home',
      children: {
        user: {
          type: 'directory',
          name: 'user',
          children: {}
        }
      }
    },
    etc: {
      type: 'directory',
      name: 'etc',
      children: {}
    },
    var: {
      type: 'directory',
      name: 'var',
      children: {
        log: {
          type: 'directory',
          name: 'log',
          children: {}
        }
      }
    },
    tmp: {
      type: 'directory',
      name: 'tmp',
      children: {}
    },
    bin: {
      type: 'directory',
      name: 'bin',
      children: {}
    },
    usr: {
      type: 'directory',
      name: 'usr',
      children: {
        bin: {
          type: 'directory',
          name: 'bin',
          children: {}
        }
      }
    }
  }
});

export const levels: Level[] = [
  {
    id: 1,
    title: 'First Steps',
    description: 'Welcome to Terminal Quest! Learn the basics of navigating the Linux filesystem.',
    objective: 'Find and read the secret message hidden in the system. Use ls to list files and cat to read them.',
    hints: [
      'Try using "ls" to see what files are in the current directory',
      'Navigate directories with "cd <dirname>"',
      'The secret is in /home/user/documents/secret.txt - use "cat" to read it'
    ],
    maxHints: 3,
    baseScore: 100,
    timeBonus: 50,
    timeLimitSeconds: 300,
    initialDirectory: '/home/user',
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                documents: {
                  type: 'directory',
                  name: 'documents',
                  children: {
                    'secret.txt': {
                      type: 'file',
                      name: 'secret.txt',
                      content: 'CONGRATULATIONS! You found the secret message!\nThe password is: LEVEL1COMPLETE'
                    },
                    'readme.txt': {
                      type: 'file',
                      name: 'readme.txt',
                      content: 'Welcome to your documents folder.\nThere might be something interesting here...'
                    }
                  }
                },
                '.bashrc': {
                  type: 'file',
                  name: '.bashrc',
                  content: '# Bash configuration\nexport PATH=$PATH:/usr/local/bin'
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      return state.outputHistory.some(line => 
        line.text.includes('LEVEL1COMPLETE')
      );
    }
  },
  {
    id: 2,
    title: 'Package Manager',
    description: 'The web server is down! You need to install and start it.',
    objective: 'Install the "nginx" package using apt and verify it\'s installed.',
    hints: [
      'Use "apt search <package>" to find available packages',
      'Install packages with "apt install <package>"',
      'After installing nginx, use "apt list --installed" to verify'
    ],
    maxHints: 3,
    baseScore: 150,
    timeBonus: 75,
    timeLimitSeconds: 240,
    initialDirectory: '/home/user',
    packages: ['nginx', 'apache2', 'mysql', 'postgresql', 'nodejs', 'python3'],
    installedPackages: [],
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                'MISSION.txt': {
                  type: 'file',
                  name: 'MISSION.txt',
                  content: 'URGENT: The web server is offline!\n\nYour mission:\n1. Install the nginx web server\n2. Verify the installation\n\nUse apt commands to manage packages.'
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      return state.installedPackages.includes('nginx');
    }
  },
  {
    id: 3,
    title: 'Permission Denied',
    description: 'A critical script needs to be executed, but it lacks the right permissions.',
    objective: 'Make the backup script executable and run it successfully.',
    hints: [
      'Check current permissions with "ls -la"',
      'Use "chmod +x <filename>" to add execute permission',
      'Run scripts with "./<scriptname>"'
    ],
    maxHints: 3,
    baseScore: 200,
    timeBonus: 100,
    timeLimitSeconds: 300,
    initialDirectory: '/home/user/scripts',
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                scripts: {
                  type: 'directory',
                  name: 'scripts',
                  children: {
                    'backup.sh': {
                      type: 'file',
                      name: 'backup.sh',
                      content: '#!/bin/bash\necho "Backup completed successfully!"\necho "BACKUP_TOKEN: LEVEL3COMPLETE"',
                      permissions: 'rw-r--r--',
                      executable: false
                    },
                    'README.md': {
                      type: 'file',
                      name: 'README.md',
                      content: '# Backup Scripts\n\nThe backup.sh script needs to be run daily.\nMake sure it has execute permissions!'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      return state.outputHistory.some(line => 
        line.text.includes('LEVEL3COMPLETE')
      );
    }
  },
  {
    id: 4,
    title: 'Config Detective',
    description: 'The application is misconfigured. Find and fix the configuration file.',
    objective: 'Edit the config file to change the port from 8080 to 3000.',
    hints: [
      'Look for configuration files in /etc/app/',
      'Use "nano <filename>" to edit files',
      'Change PORT=8080 to PORT=3000 and save with Ctrl+S, exit with Ctrl+X'
    ],
    maxHints: 3,
    baseScore: 250,
    timeBonus: 125,
    timeLimitSeconds: 360,
    initialDirectory: '/home/user',
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        etc: {
          type: 'directory',
          name: 'etc',
          children: {
            app: {
              type: 'directory',
              name: 'app',
              children: {
                'config.env': {
                  type: 'file',
                  name: 'config.env',
                  content: '# Application Configuration\nPORT=8080\nDEBUG=false\nLOG_LEVEL=info'
                },
                'config.example': {
                  type: 'file',
                  name: 'config.example',
                  content: '# Example configuration\n# PORT should be set to 3000 for production'
                }
              }
            }
          }
        },
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                'TASK.txt': {
                  type: 'file',
                  name: 'TASK.txt',
                  content: 'The application is running on the wrong port!\n\nFind the configuration file and change the port to 3000.\nConfig files are usually in /etc/'
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      const configFile = getFileAtPath(state.fileSystem, '/etc/app/config.env');
      return configFile?.content?.includes('PORT=3000') ?? false;
    }
  },
  {
    id: 5,
    title: 'Log Analysis',
    description: 'Something is causing errors in the system. Analyze the logs to find the culprit.',
    objective: 'Find the error code in the log files and write it to /tmp/solution.txt',
    hints: [
      'Check logs in /var/log/',
      'Use "grep" to search for "ERROR" in log files',
      'Create the solution file with: echo "ERROR_CODE" > /tmp/solution.txt'
    ],
    maxHints: 3,
    baseScore: 300,
    timeBonus: 150,
    timeLimitSeconds: 420,
    initialDirectory: '/home/user',
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        var: {
          type: 'directory',
          name: 'var',
          children: {
            log: {
              type: 'directory',
              name: 'log',
              children: {
                'system.log': {
                  type: 'file',
                  name: 'system.log',
                  content: '[INFO] System started\n[INFO] Loading modules\n[WARN] Memory usage high\n[INFO] Services ready\n[ERROR] Critical failure - Code: ERR_5X7K9\n[INFO] Attempting recovery\n[INFO] Recovery successful'
                },
                'app.log': {
                  type: 'file',
                  name: 'app.log',
                  content: '[DEBUG] App initialized\n[INFO] Connected to database\n[INFO] Listening on port 3000'
                },
                'access.log': {
                  type: 'file',
                  name: 'access.log',
                  content: '192.168.1.1 - GET /index.html 200\n192.168.1.2 - POST /api/data 201\n192.168.1.1 - GET /style.css 200'
                }
              }
            }
          }
        },
        tmp: {
          type: 'directory',
          name: 'tmp',
          children: {}
        },
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                'INVESTIGATE.txt': {
                  type: 'file',
                  name: 'INVESTIGATE.txt',
                  content: 'System alerts have been triggered!\n\nYour task:\n1. Find the error code in the logs\n2. Write it to /tmp/solution.txt\n\nHint: Logs are typically in /var/log/'
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      const solutionFile = getFileAtPath(state.fileSystem, '/tmp/solution.txt');
      return solutionFile?.content?.includes('ERR_5X7K9') ?? false;
    }
  },
  {
    id: 6,
    title: 'Script Master',
    description: 'Write a simple script to automate a task. Optional: use code to solve it elegantly.',
    objective: 'Create a script that outputs "Hello, Terminal Quest!" and run it.',
    hints: [
      'Create a file with: echo \'#!/bin/bash\' > script.sh',
      'Add the echo command: echo \'echo "Hello, Terminal Quest!"\' >> script.sh',
      'Make it executable with chmod +x and run with ./script.sh'
    ],
    maxHints: 3,
    baseScore: 350,
    timeBonus: 175,
    timeLimitSeconds: 480,
    initialDirectory: '/home/user',
    fileSystem: {
      ...createBaseFileSystem(),
      children: {
        ...createBaseFileSystem().children,
        home: {
          type: 'directory',
          name: 'home',
          children: {
            user: {
              type: 'directory',
              name: 'user',
              children: {
                'CHALLENGE.txt': {
                  type: 'file',
                  name: 'CHALLENGE.txt',
                  content: 'SCRIPTING CHALLENGE\n\nCreate and run a bash script that outputs:\n"Hello, Terminal Quest!"\n\nYou can use:\n- echo command with redirection (>)\n- nano editor\n- Or get creative with your own approach!'
                }
              }
            }
          }
        }
      }
    },
    checkWinCondition: (state) => {
      return state.outputHistory.some(line => 
        line.text.includes('Hello, Terminal Quest!')
      );
    }
  }
];

function getFileAtPath(fs: FileSystemNode, path: string): FileSystemNode | null {
  const parts = path.split('/').filter(Boolean);
  let current = fs;
  
  for (const part of parts) {
    if (current.type !== 'directory' || !current.children?.[part]) {
      return null;
    }
    current = current.children[part];
  }
  
  return current;
}

export { getFileAtPath };
