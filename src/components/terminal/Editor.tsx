import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X } from '@phosphor-icons/react';
import type { TerminalState, FileSystemNode } from '@/lib/types';
import { getFileAtPath } from '@/lib/levels';

interface EditorProps {
  state: TerminalState;
  onStateChange: (newState: Partial<TerminalState>) => void;
  onClose: () => void;
}

function getParentPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  parts.pop();
  return '/' + parts.join('/');
}

function getNodeAtPath(fs: FileSystemNode, path: string): FileSystemNode | null {
  return getFileAtPath(fs, path);
}

export function Editor({ state, onStateChange, onClose }: EditorProps) {
  const [content, setContent] = useState(state.editingContent);
  const fileName = state.editingFile?.split('/').pop() || 'untitled';

  useEffect(() => {
    setContent(state.editingContent);
  }, [state.editingContent]);

  const handleSave = useCallback(() => {
    if (!state.editingFile) return;

    const newFs = JSON.parse(JSON.stringify(state.fileSystem));
    const parentPath = getParentPath(state.editingFile);
    const fileName = state.editingFile.split('/').pop()!;
    
    const parentNode = getNodeAtPath(newFs, parentPath);
    
    if (parentNode && parentNode.type === 'directory') {
      parentNode.children![fileName] = {
        type: 'file',
        name: fileName,
        content: content,
        permissions: parentNode.children![fileName]?.permissions,
        executable: parentNode.children![fileName]?.executable
      };
      
      onStateChange({
        fileSystem: newFs,
        outputHistory: [...state.outputHistory, { text: `File saved: ${state.editingFile}`, type: 'success' }]
      });
    }
  }, [content, state, onStateChange]);

  const handleClose = useCallback(() => {
    onStateChange({
      editingFile: null,
      editingContent: ''
    });
    onClose();
  }, [onStateChange, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.ctrlKey && e.key === 'x') {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleClose]);

  return (
    <div className="absolute inset-0 bg-card z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-secondary border-b border-border">
        <div className="flex items-center gap-4">
          <span className="text-terminal-green font-mono text-sm">nano</span>
          <span className="text-muted-foreground font-mono text-sm">{fileName}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full resize-none bg-transparent border-none font-mono text-sm text-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
          autoFocus
        />
      </div>
      
      <div className="flex items-center justify-between px-4 py-2 bg-secondary border-t border-border text-xs font-mono text-muted-foreground">
        <div className="flex gap-6">
          <span>^S Save</span>
          <span>^X Exit</span>
        </div>
        <span className="text-terminal-dim">
          {content.split('\n').length} lines
        </span>
      </div>
    </div>
  );
}
