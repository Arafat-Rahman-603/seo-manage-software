import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGitRecord extends Document {
  projectId: string;
  userId: string;
  operation: 'SAVE' | 'PUBLISH' | 'ROLLBACK';
  commitSha: string;
  message: string;
  changedFiles: string[];
  createdAt: Date;
}

const GitRecordSchema = new Schema<IGitRecord>(
  {
    projectId: { type: String, required: true },
    userId: { type: String, required: true },
    operation: { type: String, enum: ['SAVE', 'PUBLISH', 'ROLLBACK'], required: true },
    commitSha: { type: String, required: true },
    message: { type: String, required: true },
    changedFiles: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

GitRecordSchema.index({ projectId: 1, createdAt: -1 });

export const GitRecord: Model<IGitRecord> =
  mongoose.models.GitRecord || mongoose.model<IGitRecord>('GitRecord', GitRecordSchema);
