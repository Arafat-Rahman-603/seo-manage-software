import { z } from "zod";

export const RoleEnum = z.enum(["SUPER_ADMIN", "PROJECT_ADMIN", "EDITOR", "VIEWER"]);
export type Role = z.infer<typeof RoleEnum>;

export const Permissions = {
  SUPER_ADMIN: ["project.view", "project.manage", "content.view", "content.edit", "content.publish", "deployment.view", "deployment.rollback", "project.manage_members"],
  PROJECT_ADMIN: ["project.view", "content.view", "content.edit", "content.publish", "deployment.view", "deployment.rollback", "project.manage_members"],
  EDITOR: ["project.view", "content.view", "content.edit", "deployment.view"],
  VIEWER: ["project.view", "content.view"]
} as const;

export type Permission = typeof Permissions[Role][number];

export const ProjectMembershipSchema = z.object({
  projectId: z.string(),
  userId: z.string(),
  role: RoleEnum,
});
export type ProjectMembership = z.infer<typeof ProjectMembershipSchema>;

export const DeploymentStatusEnum = z.enum(["QUEUED", "VALIDATING", "BUILDING", "DEPLOYING", "SUCCESS", "FAILED"]);
export type DeploymentStatus = z.infer<typeof DeploymentStatusEnum>;

export const DeploymentRecordSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  commitSha: z.string(),
  triggeredByUserId: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),
  status: DeploymentStatusEnum,
});
export type DeploymentRecord = z.infer<typeof DeploymentRecordSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string(),
  action: z.enum(["SAVE", "PUBLISH", "ROLLBACK", "FAILED_MUTATION", "FAILED_DEPLOYMENT", "PERMISSION_DENIED"]),
  file: z.string().optional(),
  jsonPath: z.string().optional(),
  timestamp: z.string().datetime(),
  result: z.enum(["SUCCESS", "FAILURE"]).optional(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

// Shared schemas for JSON validation
export const SeoSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  canonical: z.string().url().optional(),
  robots: z.string().optional(), // e.g., "index, follow"
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),
  twitterCard: z.string().optional(), // e.g., "summary_large_image"
  twitterTitle: z.string().optional(),
  twitterDescription: z.string().optional(),
  twitterImage: z.string().optional(),
  keywords: z.string().optional(), // comma separated
  locale: z.string().optional(),
  alternateLanguages: z.record(z.string().url()).optional(), // { "fr": "https://example.com/fr" }
  jsonLd: z.any().optional(), // Allow structured data
});
export type Seo = z.infer<typeof SeoSchema>;

export const BaseSectionSchema = z.object({
  id: z.string(),
  type: z.string(),
  enabled: z.boolean(),
  order: z.number(),
  data: z.any(),
});
export type BaseSection = z.infer<typeof BaseSectionSchema>;

export const PageSchema = z.object({
  page: z.string(),
  sections: z.array(BaseSectionSchema),
});
export type Page = z.infer<typeof PageSchema>;

// API Payloads
export const MutationSchema = z.object({
  file: z.string(),
  jsonPath: z.string(),
  value: z.any(),
});
export type Mutation = z.infer<typeof MutationSchema>;

export const BatchMutationRequestSchema = z.object({
  projectId: z.string(),
  baseVersion: z.string().optional(),
  mutations: z.array(MutationSchema).min(1),
});
export type BatchMutationRequest = z.infer<typeof BatchMutationRequestSchema>;

export const PublishRequestSchema = z.object({
  message: z.string().optional(),
  draftVersion: z.string(), // Must specify which draft version is being published
});
export type PublishRequest = z.infer<typeof PublishRequestSchema>;

export * from "./seo-validator";
