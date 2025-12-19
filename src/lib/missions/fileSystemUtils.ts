import type { FileSystemNode } from '../types';

/**
 * Creates the base file system structure that all missions start with
 */
export function createBaseFileSystem(): FileSystemNode {
  return {
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
  };
}
