import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditLog extends Document {
  userId: string;
  organizationId?: string;
  projectId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  result: 'SUCCESS' | 'FAILED';
  commitSha?: string;
  metadata?: any;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: String, required: true },
    organizationId: { type: String },
    projectId: { type: String },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    result: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    commitSha: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AuditLogSchema.index({ projectId: 1, createdAt: -1 });
AuditLogSchema.index({ organizationId: 1, createdAt: -1 });

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
