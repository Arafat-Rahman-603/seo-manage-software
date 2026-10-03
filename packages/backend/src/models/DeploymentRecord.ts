import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeploymentRecord extends Document {
  projectId: string;
  draftVersion: number;
  publishedVersion?: number;
  commitSha: string;
  trigger: string;
  status: 'QUEUED' | 'VALIDATING' | 'BUILDING' | 'DEPLOYING' | 'SUCCESS' | 'FAILED';
  startedAt: Date;
  completedAt?: Date;
  error?: string;
  createdAt: Date;
}

const DeploymentRecordSchema = new Schema<IDeploymentRecord>(
  {
    projectId: { type: String, required: true },
    draftVersion: { type: Number, required: true },
    publishedVersion: { type: Number },
    commitSha: { type: String, required: true },
    trigger: { type: String, required: true },
    status: {
      type: String,
      enum: ['QUEUED', 'VALIDATING', 'BUILDING', 'DEPLOYING', 'SUCCESS', 'FAILED'],
      required: true,
    },
    startedAt: { type: Date, required: true },
    completedAt: { type: Date },
    error: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

DeploymentRecordSchema.index({ projectId: 1, createdAt: -1 });

export const DeploymentRecord: Model<IDeploymentRecord> =
  mongoose.models.DeploymentRecord || mongoose.model<IDeploymentRecord>('DeploymentRecord', DeploymentRecordSchema);
