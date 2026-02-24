import React from 'react';
import { FileCode, FileJson, Cpu } from 'lucide-react';

interface Props {
  files: { name: string; content: string; language: string; icon: React.ReactNode }[];
}

export default function CodeViewer({ files }: Props) {
  const [activeFile, setActiveFile] = React.useState(files[0].name);

  const activeContent = files.find(f => f.name === activeFile)?.content || '';

  return (
    <div className="flex h-[calc(100vh-120px)] bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Вихідні файли</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {files.map(file => (
            <button
              key={file.name}
              onClick={() => setActiveFile(file.name)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeFile === file.name 
                  ? 'bg-emerald-500/10 text-emerald-400 font-medium' 
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
              }`}
            >
              {file.icon}
              <span className="truncate">{file.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <div className="flex items-center px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <span className="text-sm font-mono text-zinc-400">{activeFile}</span>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-sm font-mono text-zinc-300 leading-relaxed">
            <code>{activeContent}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
