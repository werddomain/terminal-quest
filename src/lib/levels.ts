import type { Level, FileSystemNode } from './types';
import {
  Mission1,
  Mission2,
  Mission3,
  Mission4,
  Mission5,
  Mission6,
} from './missions';

// Convert mission classes to level objects
export const levels: Level[] = [
  new Mission1().toLevel(),
  new Mission2().toLevel(),
  new Mission3().toLevel(),
  new Mission4().toLevel(),
  new Mission5().toLevel(),
  new Mission6().toLevel(),
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
