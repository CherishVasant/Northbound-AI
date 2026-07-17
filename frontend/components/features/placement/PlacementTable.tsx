'use client';

import { Building2 } from 'lucide-react';
import { PlacementCompany, PlacementCustomOptions } from '@/lib/utils/storage';
import { PlacementCell } from './PlacementCell';
import { PlacementRow } from './PlacementRow';

const COLUMN_HEADERS = [
  { label: '#',                  sticky: true,  left: 0,  zIndex: 22, minWidth: 48  },
  { label: 'Company',            sticky: true,  left: 48, zIndex: 21, minWidth: 160 },
  { label: 'Job Role',           sticky: false, minWidth: 148 },
  { label: 'Skills Required',    sticky: false, minWidth: 200 },
  { label: 'Package (LPA)',      sticky: false, minWidth: 100 },
  { label: 'Opted In',           sticky: false, minWidth: 72  },
  { label: 'Registered',         sticky: false, minWidth: 80  },
  { label: 'App. Deadline',      sticky: false, minWidth: 160 },
  { label: 'Current Stage',      sticky: false, minWidth: 160 },
  { label: 'Stage Status',       sticky: false, minWidth: 140 },
  { label: 'Next Event',         sticky: false, minWidth: 164 },
  { label: 'Next Event Date',    sticky: false, minWidth: 160 },
  { label: 'Priority',           sticky: false, minWidth: 96  },
  { label: 'Prep Status',        sticky: false, minWidth: 160 },
  { label: 'Final Result',       sticky: false, minWidth: 120 },
  { label: 'Reason',             sticky: false, minWidth: 160 },
  { label: 'Notes',              sticky: false, minWidth: 80  },
  { label: 'Location',           sticky: false, minWidth: 128 },
  { label: '',                   sticky: false, minWidth: 72  }, // Actions
];

interface PlacementTableProps {
  companies: PlacementCompany[];
  customOptions: PlacementCustomOptions;
  onUpdate: (updated: PlacementCompany) => void;
  onDelete: (id: string) => void;
  onOpenNotes: (company: PlacementCompany) => void;
  onAddCustomOption: (type: 'jobRoles' | 'locations' | 'skills', val: string) => void;
}

export function PlacementTable({
  companies,
  customOptions,
  onUpdate,
  onDelete,
  onOpenNotes,
  onAddCustomOption,
}: PlacementTableProps) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">No companies yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs">
          Click <strong>Add Company</strong> to start tracking your placement journey.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full border-collapse" style={{ minWidth: 2200 }}>
        {/* Sticky header */}
        <thead className="sticky top-0 z-20">
          <tr>
            {COLUMN_HEADERS.map(({ label, sticky, left, zIndex, minWidth }) => (
              <PlacementCell
                key={label || 'actions'}
                isHeader
                sticky={sticky}
                left={left}
                zIndex={zIndex ?? 20}
                minWidth={minWidth}
              >
                {label}
              </PlacementCell>
            ))}
          </tr>
        </thead>

        <tbody>
          {companies.map((company, idx) => (
            <PlacementRow
              key={company.id}
              company={company}
              serialNumber={idx + 1}
              customOptions={customOptions}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onOpenNotes={onOpenNotes}
              onAddCustomOption={onAddCustomOption}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
