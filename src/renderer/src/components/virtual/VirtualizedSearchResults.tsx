import React from 'react';
import { FixedSizeList, ListChildComponentProps } from 'react-window';

interface SearchResult {
  title: string;
  url: string;
  highlights?: string[];
}

interface VirtualizedSearchResultsProps {
  results: SearchResult[];
  themeColor: string;
  onSelect?: (result: SearchResult) => void;
}

export const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  results,
  themeColor,
  onSelect,
}) => {
  const Row = ({ index, style }: ListChildComponentProps) => {
    const result = results[index];
    const handleClick = () => {
      if (onSelect) onSelect(result);
    };
    return (
      <div
        style={style}
        className="glass-panel p-4 rounded-xl border border-hud-cyan/5 bg-slate-950/40 hover:border-hud-cyan/20 transition-all duration-300"
        onClick={handleClick}
        role="listitem"
        tabIndex={-1}
      >
        <a
          href={result.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-hud text-hud-cyan hover:underline font-semibold block leading-tight mb-1"
          style={{ color: themeColor }}
        >
          {result.title}
        </a>
        <span className="text-[8px] font-mono text-slate-400 block mb-2 break-all">
          {result.url}
        </span>
        {result.highlights && result.highlights.length > 0 && (
          <div
            className="mt-2 text-xs border-l-2 border-hud-cyan/35 pl-3 text-slate-300 italic leading-relaxed"
            style={{ borderColor: themeColor }}
          >
            ...{result.highlights[0]}...
          </div>
        )}
      </div>
    );
  };

  const itemHeight = 120; // Approx height per result

  return (
    <FixedSizeList
      height={400}
      itemCount={results.length}
      itemSize={itemHeight}
      width="100%"
      role="list"
    >
      {Row}
    </FixedSizeList>
  );
};
