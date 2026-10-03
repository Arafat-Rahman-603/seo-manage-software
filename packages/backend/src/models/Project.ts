import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  projectKey: string; // Used to map to filesystem
  websiteType: string;
  previewUrl?: string;
  productionUrl?: string;
  status: 'ACTIVE' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    projectKey: { type: String, required: true, unique: true }, // Add unique index
    websiteType: { type: String, default: 'custom' },
    previewUrl: { type: String },
    productionUrl: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

// Indexes
ProjectSchema.index({ organizationId: 1 });
ProjectSchema.index({ slug: 1 });

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
