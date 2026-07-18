'use client';

import type { PlacementCompany } from '@/lib/utils/storage';
import { STATE_LABEL, stateColorVar } from '@/lib/constants/placement';

/** '2026-07-26' → '26 Jul 2026' */
function formatDate(iso: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="text-xs text-foreground">{children}</div>
    </div>
  );
}

export function CompanyDetailPanel({ company }: { company: PlacementCompany }) {
  // Most recent first — the log is stored oldest-first.
  const timeline = [...(company.history ?? [])].reverse();
  const skills = company.skills ?? [];

  return (
    <div className="grid gap-6 px-6 py-5 md:grid-cols-2">
      {/* ── Stage history ───────────────────────────────────────────────── */}
      <div>
        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Stage History
        </h4>

        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground">No stage history yet</p>
        ) : (
          <ol className="relative flex flex-col gap-3">
            {/* Connecting line, inset to sit behind the dots */}
            <span
              aria-hidden
              className="absolute left-[3.5px] top-1.5 bottom-1.5 w-px bg-border"
            />
            {timeline.map((entry, i) => {
              const color = `var(${stateColorVar(entry.stage, entry.status)})`;
              return (
                <li key={`${entry.stage}-${entry.date}-${i}`} className="relative flex gap-3">
                  <span
                    className="relative z-10 mt-1 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {entry.stage}
                      <span className="text-muted-foreground"> — </span>
                      <span style={{ color }}>{STATE_LABEL[entry.status]}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* ── Details ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Details
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Location">{company.location?.trim() || '—'}</Field>

          <Field label="Registered">
            {!company.optedIn ? '—' : company.registered ? 'Yes' : 'Not yet'}
          </Field>

          <div className="col-span-2">
            <Field label="Skills Required">
              {skills.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="pill-soft bg-secondary/60 px-2 py-0.5 font-mono text-[10px] text-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                '—'
              )}
            </Field>
          </div>

          {/* Only meaningful when the company was skipped. */}
          {!company.optedIn && (
            <div className="col-span-2">
              <Field label="Reason for not opting in">
                {company.reason?.trim() ? (
                  <span className="italic text-muted-foreground">{company.reason}</span>
                ) : (
                  '—'
                )}
              </Field>
            </div>
          )}

          <div className="col-span-2">
            <Field label="Notes">
              <p className="card-soft whitespace-pre-wrap bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                {company.notes?.trim() || 'No notes yet.'}
              </p>
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}
