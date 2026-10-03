import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMembership extends Document {
  userId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  role: 'SUPER_ADMIN' | 'PROJECT_ADMIN' | 'EDITOR' | 'VIEWER';
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'PROJECT_ADMIN', 'EDITOR', 'VIEWER'],
      required: true,
    },
  },
  { timestamps: true }
);

// Indexes for fast querying
MembershipSchema.index({ userId: 1, projectId: 1 });
MembershipSchema.index({ organizationId: 1, userId: 1 });
// Ensure a user has only one specific membership role per project (or org if projectId is null)
MembershipSchema.index({ userId: 1, organizationId: 1, projectId: 1 }, { unique: true });

export const Membership: Model<IMembership> =
  mongoose.models.Membership || mongoose.model<IMembership>('Membership', MembershipSchema);
