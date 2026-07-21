import mongoose, { Schema } from 'mongoose'

/**
 * The secondary store: exactly one document per company, never a version log.
 *
 * Each document holds two copies of the same company:
 *
 *   `pending`   — mirrors what the primary store (`userdatas`) holds right now.
 *   `committed` — the copy a restore brings back: the company as it stood
 *                 before the current run of edits.
 *
 * `pending` becomes the new `committed` once it has sat untouched for the
 * commit window (see COMMIT_WINDOW_MS). So an edit is undoable for half an
 * hour, and after that the two stores agree and there is nothing to undo — no
 * accumulating history, no pruning, no growth per keystroke.
 *
 * Both copies are `Mixed` and unvalidated on purpose. A typed schema strips any
 * path it doesn't declare, which is the exact failure this store exists to
 * insure against; whatever the client held is kept verbatim, including fields
 * this build has never heard of.
 */
const PlacementCompanyBackupSchema = new Schema(
  {
    username: { type: String, required: true },
    /** Mixed, mirroring PlacementCompanySchema: legacy records carry string ids. */
    companyId: { type: Schema.Types.Mixed, required: true },
    /** Denormalised so the restore list renders without parsing every snapshot. */
    name: { type: String, default: '' },

    committed: { type: Schema.Types.Mixed, required: true },
    committedAt: { type: Date, required: true },

    pending: { type: Schema.Types.Mixed, required: true },
    pendingAt: { type: Date, required: true },
  },
  { collection: 'placement_companies_backup' },
)

// One row per company — the upsert relies on this being unique.
PlacementCompanyBackupSchema.index({ username: 1, companyId: 1 }, { unique: true })

// Reuse the compiled model across hot reloads and warm serverless containers;
// re-registering the same name throws OverwriteModelError.
export const PlacementCompanyBackup =
  mongoose.models.PlacementCompanyBackup ??
  mongoose.model('PlacementCompanyBackup', PlacementCompanyBackupSchema)

export default PlacementCompanyBackup
