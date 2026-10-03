import mongoose, { Schema, Document, Model } from 'mongoose';
import { Role, RoleEnum } from 'shared-types';

export interface IInvitation extends Document {
  organizationId: mongoose.Types.ObjectId;
  projectId: string; // the string ID like 'northstar-digital'
  email: string;
  role: Role;
  tokenHash: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
  organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, enum: Object.keys(RoleEnum.Values), required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  acceptedAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
  timestamps: true,
});

export const Invitation: Model<IInvitation> = mongoose.models.Invitation || mongoose.model<IInvitation>('Invitation', InvitationSchema);
