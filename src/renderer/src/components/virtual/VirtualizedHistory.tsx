import React, { useRef } from 'react';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import { TranscriptEntry } from '../../store/useAppStore'; // adjust if needed

interface VirtualizedHistoryProps {
  transcript: TranscriptEntry[];
  themeColor: string;
}

export const VirtualizedHistory: React.FC<VirtualizedHistoryProps> = ({ transcript, themeColor }) => {
  const listRef = useRef<VariableSizeList>(null);

  const getItemSize = (index: number) => {
    // Approximate height based on content length; you can improve with measurement.
    const text = transcript[index].text;
    const base = 60; // base height
    const extra = Math.min(Math.ceil(text.length / 80) * 20, 200);
    return base + extra;
  };

  const Row = ({ index, style }: ListChildComponentProps) => {
    const entry = transcript[index];
    return (
      <div style={style} className={`flex flex-col max-w-[85%] rounded-lg p-2.5 border ${
        entry.role === 'user'
          ? 'self-end bg-hud-blue/5 border-hud-blue/20 text-slate-200'
          : 'self-start bg-slate-950/50 border-hud-cyan/15 text-slate-300'
      }`}
        role="listitem"
      >
        <span className="text-[9px] font-hud font-bold tracking-wider mb-1 uppercase" style={{ color: entry.role === 'user' ? '#0070ff' : themeColor }}>
          {entry.role === 'user' ? 'Shawon' : 'A.I. Companion'}
        </span>
        <p className="font-sans leading-relaxed">{entry.text}</p>
      </div>
    );
  };

  return (
    <VariableSizeList
      height={400}
      width="100%"
      itemCount={transcript.length}
      itemSize={getItemSize}
      ref={listRef}
      role="list"
    >
      {Row}
    </VariableSizeList>
  );
};
