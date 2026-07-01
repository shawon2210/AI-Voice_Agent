import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { Note } from '../../store/useAppStore'; // Adjust path if needed

interface VirtualizedNotesProps {
  notes: Note[];
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  setNoteTitle: (title: string) => void;
  setNoteContent: (content: string) => void;
  setIsEditingNote: (edit: boolean) => void;
  themeColor: string;
}

export const VirtualizedNotes: React.FC<VirtualizedNotesProps> = ({
  notes,
  activeNoteId,
  setActiveNoteId,
  setNoteTitle,
  setNoteContent,
  setIsEditingNote,
  themeColor,
}) => {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const note = notes[index];
    const isSelected = activeNoteId === note.id;
    const handleSelect = () => {
      setActiveNoteId(note.id);
      setNoteTitle(note.title);
      setNoteContent(note.content);
      setIsEditingNote(false);
    };
    return (
      <button
        onClick={handleSelect}
        style={style}
        className={`w-full text-left p-2.5 rounded-lg border transition-all duration-300 flex flex-col gap-1 cursor-pointer ${
          isSelected
            ? 'bg-slate-900 border-hud-cyan/30 text-hud-cyan'
            : 'bg-slate-950/20 border-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-800'
        }`}
        style={isSelected ? { borderColor: `${themeColor}40`, color: themeColor } : {}}
      >
        <span className="text-[10px] font-hud uppercase tracking-wider font-semibold truncate block">
          {note.title}
        </span>
        <span className="text-[8px] font-mono text-slate-500">
          {new Date(note.timestamp).toLocaleDateString()}
        </span>
      </button>
    );
  };

  const itemHeight = 58; // Approx height of each row

  return (
    <FixedSizeList
      height={300}
      itemCount={notes.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
};
