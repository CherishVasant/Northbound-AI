'use client';

import { ReactNode } from 'react';

interface PlacementCellProps {
  children: ReactNode;
  sticky?: boolean;
  left?: number;
  zIndex?: number;
  className?: string;
  isHeader?: boolean;
  minWidth?: number;
}

/**
 * Generic <td> / <th> wrapper.
 * Handles sticky positioning boilerplate so PlacementRow and PlacementTable
 * stay clean. All table cells should be rendered through this component.
 */
export function PlacementCell({
  children,
  sticky = false,
  left,
  zIndex = 10,
  className = '',
  isHeader = false,
  minWidth,
}: PlacementCellProps) {
  const Tag = isHeader ? 'th' : 'td';

  const stickyStyle: React.CSSProperties = sticky
    ? {
        position: 'sticky',
        left: left !== undefined ? left : 0,
        zIndex,
        ...(minWidth !== undefined ? { minWidth } : {}),
      }
    : minWidth !== undefined
    ? { minWidth }
    : {};

  return (
    <Tag
      style={stickyStyle}
      className={`
        px-3 py-2
        ${isHeader
          ? 'bg-muted/60 border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap'
          : 'border-b border-border/60 align-middle text-xs'
        }
        ${sticky ? 'bg-[inherit] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)] dark:shadow-[2px_0_4px_-2px_rgba(0,0,0,0.25)]' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </Tag>
  );
}
