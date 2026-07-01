'use client'

import React, { useMemo } from 'react'
import { FixedSizeList as Grid } from 'react-window'
import { useAppStore } from '../store/useAppStore'

interface GalleryItem {
  id: string
  url: string
  prompt: string
  isFavorite: boolean
  timestamp: Date
  filter?: 'normal' | 'cinematic' | 'grayscale' | 'sepia'
  textOverlay?: string
  path?: string
}

interface VirtualizedGalleryProps {
  editingImage: any | null
  setEditingImage: (img: any | null) => void
  setOverlayText: (text: string) => void
  setSelectedFilter: (filter: 'normal' | 'cinematic' | 'grayscale' | 'sepia') => void
  updateGalleryItem: (id: string, updates: Partial<GalleryItem>) => void
  deleteGalleryItem: (id: string) => void
  duplicateGalleryItem: (id: string) => void
  addToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  themeColor: string
}

const COLUMN_COUNT = 3
const COLUMN_WIDTH = 160 // w-40*4 (base w-40 = 10rem) → 160px
const ROW_HEIGHT = 200 // Approximately the height of each gallery item

export const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  editingImage,
  setEditingImage,
  setOverlayText,
  setSelectedFilter,
  updateGalleryItem,
  deleteGalleryItem,
  duplicateGalleryItem,
  addToast,
  themeColor
}) => {
  const gallery = useAppStore((state) => state.gallery)
  const visibleData = useMemo(() => gallery, [gallery])

  const cellRenderer = ({ columnIndex, rowIndex, style }: any) => {
    const index = rowIndex * COLUMN_COUNT + columnIndex
    if (index >= visibleData.length) return null

    const item = visibleData[index]
    let filterClass = ''
    if (item.filter === 'grayscale') filterClass = 'grayscale'
    else if (item.filter === 'sepia') filterClass = 'sepia'
    else if (item.filter === 'cinematic')
      filterClass = 'contrast-125 saturate-150 brightness-95 hue-rotate-15'

    return (
      <div style={{ ...style, padding: '8px' }}>
        <div
          key={item.id}
          className="glass-panel p-2.5 rounded-xl border border-hud-cyan/5 bg-slate-950/40 flex flex-col gap-2 relative group hover:border-hud-cyan/20 transition-all duration-300"
        >
          <span className="absolute top-2 left-2 z-10 bg-slate-950/80 border border-hud-cyan/20 text-hud-cyan font-mono text-[9px] px-1.5 py-0.5 rounded shadow">
            #{index + 1}
          </span>

          <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-900 border border-slate-950">
            <img
              src={item.url}
              alt={item.prompt}
              className={`w-full h-full object-cover transition-all duration-350 ${filterClass}`}
            />

            {item.textOverlay && (
              <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-2 px-1 text-center border-t border-hud-cyan/10">
                <span className="text-[10px] font-hud text-hud-cyan tracking-wider font-bold block uppercase drop-shadow">
                  {item.textOverlay}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 mt-1">
            <p className="text-[9px] font-sans text-slate-400 line-clamp-2 italic leading-tight">
              "{item.prompt}"
            </p>
            <div className="flex justify-between items-center border-t border-slate-800/40 pt-1.5 mt-1">
              <button
                onClick={() => updateGalleryItem(item.id, { isFavorite: !item.isFavorite })}
                className={`text-[9px] font-hud tracking-wider cursor-pointer ${
                  item.isFavorite ? 'text-hud-gold' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {item.isFavorite ? '★ FAVORITED' : '☆ FAVORITE'}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingImage(item)
                    setOverlayText(item.textOverlay || '')
                    setSelectedFilter(item.filter || 'normal')
                  }}
                  className="text-[9px] font-hud text-hud-cyan hover:underline cursor-pointer"
                >
                  EDIT
                </button>
                {item.path && (
                  <button
                    onClick={async () => {
                      const res = await window.api.revealFileInExplorer(item.path!)
                      if (res && res.success) {
                        addToast('Revealed file in explorer', 'success')
                      } else {
                        addToast('Could not find file', 'error')
                      }
                    }}
                    className="text-[9px] font-hud text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                    title="Reveal in Explorer"
                  >
                    REVEAL
                  </button>
                )}
                <button
                  onClick={() => {
                    duplicateGalleryItem(item.id)
                    addToast('Asset duplicated', 'success')
                  }}
                  className="text-[9px] font-hud text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                  title="Duplicate asset"
                >
                  DUP
                </button>
                <button
                  onClick={() => {
                    deleteGalleryItem(item.id)
                    addToast('Asset deleted', 'info')
                  }}
                  className="text-[9px] font-hud text-hud-red hover:underline cursor-pointer"
                >
                  DELETE
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full overflow-auto">
      <Grid
        columnCount={COLUMN_COUNT}
        columnWidth={COLUMN_WIDTH}
        height={600}
        rowCount={Math.ceil(visibleData.length / COLUMN_COUNT)}
        rowHeight={ROW_HEIGHT}
        width="100%"
      >
        {cellRenderer}
      </Grid>
    </div>
  )
}
