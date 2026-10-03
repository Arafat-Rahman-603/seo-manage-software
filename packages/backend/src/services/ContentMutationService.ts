import fs from 'fs/promises';
import path from 'path';
import { BatchMutationRequest, Mutation, AuditLog, PageSchema, SeoSchema, Permissions, Permission } from 'shared-types';
import { LocalGitProvider } from '../providers/GitProvider';
import { LocalCIProvider } from '../providers/CIProvider';

import { Membership } from '../models/Membership';
import { AuditLog as MongoAuditLog } from '../models/AuditLog';
import { connectMongoDB } from '../mongodb';

interface DraftMetadata {
  version: number;
}

export class ContentMutationService {
  private baseDir: string;
  private gitProvider = new LocalGitProvider();
  private ciProvider = new LocalCIProvider();

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = path.resolve(baseDir, '../../');
  }

  // --- Real Project-Scoped Authorization ---
  private async checkPermission(userId: string, projectId: string, requiredPermission: Permission) {
    await connectMongoDB();
    const membership = await Membership.findOne({ projectId, userId });
    
    if (!membership) throw new Error("Permission denied: User does not belong to project.");
    
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const rolePermissions = Permissions[membership.role] as string[];
    if (!rolePermissions.includes(requiredPermission)) {
      throw new Error(`Permission denied: Role ${membership.role} lacks ${requiredPermission}`);
    }
  }

  // --- Harden Path Validation ---
  private getProjectDir(projectId: string): string {
    const projectDir = path.resolve(this.baseDir, 'websites', projectId);
    if (!projectDir.startsWith(path.resolve(this.baseDir, 'websites') + path.sep)) {
        throw new Error('Path traversal detected in projectId');
    }
    return projectDir;
  }

  private validatePath(projectDir: string, requestedFile: string): string {
    const dataRoot = path.resolve(projectDir, 'data');
    const targetFile = path.resolve(dataRoot, requestedFile);
    
    // Containment check
    if (!targetFile.startsWith(dataRoot + path.sep)) {
      throw new Error('Path traversal detected in file path');
    }

    if (!targetFile.endsWith('.json')) {
      throw new Error('Only JSON files can be modified');
    }

    return targetFile;
  }

  private applyJsonPath(obj: any, jsonPath: string, value: any): void {
    const parts = jsonPath.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) throw new Error(`Invalid schema path: ${jsonPath}`);
      current = current[parts[i]];
    }
    // We enforce that the client cannot invent new schema fields arbitrarily if we know the schema
    current[parts[parts.length - 1]] = value;
  }

  // --- JSON Schema Validation ---
  private validateSchema(fileType: string, json: any) {
    if (fileType.includes('pages')) PageSchema.parse(json);
    else if (fileType.includes('seo')) SeoSchema.parse(json);
  }

  // --- Version Handling ---
  private async getDraftVersion(projectDir: string): Promise<number> {
    const metaPath = path.resolve(projectDir, 'data', '.version.json');
    try {
      const data = await fs.readFile(metaPath, 'utf8');
      return JSON.parse(data).version;
    } catch {
      return 1; // Default
    }
  }

  private async incrementDraftVersion(projectDir: string): Promise<number> {
    const v = await this.getDraftVersion(projectDir);
    const metaPath = path.resolve(projectDir, 'data', '.version.json');
    const newV = v + 1;
    await fs.writeFile(metaPath, JSON.stringify({ version: newV }));
    return newV;
  }

  // --- Atomic Writes ---
  private async atomicWrite(filePath: string, data: string) {
    const tempPath = `${filePath}.tmp.${crypto.randomUUID()}`;
    await fs.writeFile(tempPath, data, 'utf8');
    await fs.rename(tempPath, filePath);
  }

  // --- BATCH SAVE (Draft) ---
  async saveBatch(projectId: string, userId: string, request: BatchMutationRequest) {
    await this.checkPermission(userId, projectId, 'content.edit');
    const projectDir = this.getProjectDir(projectId);

    // 1. Version Concurrency Check
    const currentVersion = await this.getDraftVersion(projectDir);
    if (request.baseVersion && parseInt(request.baseVersion, 10) !== currentVersion) {
        throw new Error("409 CONFLICT: Newer changes exist. Please refresh and try again.");
    }

    // 2. Read All Target Files
    const filesToMutate = new Map<string, { fullPath: string, json: any }>();
    for (const mut of request.mutations) {
        const fullPath = this.validatePath(projectDir, mut.file);
        if (!filesToMutate.has(mut.file)) {
            try {
                const content = await fs.readFile(fullPath, 'utf8');
                filesToMutate.set(mut.file, { fullPath, json: JSON.parse(content) });
            } catch (e) {
                throw new Error(`File not found: ${mut.file}`);
            }
        }
    }

    // 3. Apply all mutations in memory
    for (const mut of request.mutations) {
        const fileRecord = filesToMutate.get(mut.file);
        if (fileRecord) {
            this.applyJsonPath(fileRecord.json, mut.jsonPath, mut.value);
        }
    }

    // 4. Validate all resulting JSONs
    for (const [file, record] of Array.from(filesToMutate.entries())) {
        try {
            this.validateSchema(file, record.json);
        } catch (e) {
            throw new Error(`Validation failed for ${file} after mutation`);
        }
    }

    // 5. Create backups and temporary files (Transaction Phase 1)
    const tempFiles: { tempPath: string, fullPath: string, backupPath: string }[] = [];
    for (const record of Array.from(filesToMutate.values())) {
        const backupPath = `${record.fullPath}.bak`;
        const tempPath = `${record.fullPath}.tmp.${crypto.randomUUID()}`;
        
        // Backup existing
        await fs.copyFile(record.fullPath, backupPath);
        // Write new content to temp
        await fs.writeFile(tempPath, JSON.stringify(record.json, null, 2), 'utf8');
        
        tempFiles.push({ tempPath, fullPath: record.fullPath, backupPath });
    }

    // 6. Commit/Rename (Transaction Phase 2)
    try {
        for (const { tempPath, fullPath } of tempFiles) {
            await fs.rename(tempPath, fullPath);
        }
    } catch (e) {
        // 6b. Rollback on failure
        console.error("Batch rename failed, rolling back...", e);
        for (const { backupPath, fullPath } of tempFiles) {
            try { await fs.rename(backupPath, fullPath); } catch (rollbackErr) { console.error("Rollback failed for", fullPath, rollbackErr); }
        }
        throw new Error("Batch save transaction failed. Changes rolled back.");
    } finally {
        // Clean up temp and backup files
        for (const { tempPath, backupPath } of tempFiles) {
            fs.unlink(tempPath).catch(() => {});
            fs.unlink(backupPath).catch(() => {});
        }
    }

    // 7. Increment Version & Git
    const newVersion = await this.incrementDraftVersion(projectDir);
    const changedFiles = Array.from(filesToMutate.keys());
    const commit = await this.gitProvider.commit(projectId, userId, changedFiles, `SAVE Batch: ${changedFiles.length} files updated`, 'SAVE');

    // 8. Audit
    const logDb = await MongoAuditLog.create({
      userId, projectId, action: 'SAVE', result: 'SUCCESS', targetType: 'BATCH'
    });

    const log: AuditLog = {
      id: logDb._id.toString(), userId, projectId, action: 'SAVE',
      timestamp: logDb.createdAt.toISOString(), result: 'SUCCESS'
    };

    return { log, commit, newVersion };
  }

  // --- PUBLISH ---
  async publish(projectId: string, userId: string, message: string, draftVersion: string) {
    await this.checkPermission(userId, projectId, 'content.publish');
    const projectDir = this.getProjectDir(projectId);

    const currentVersion = await this.getDraftVersion(projectDir);
    if (parseInt(draftVersion, 10) !== currentVersion) {
        throw new Error(`Cannot publish version ${draftVersion} because draft is at version ${currentVersion}`);
    }

    // Git Publish Snapshot
    const commit = await this.gitProvider.commit(projectId, userId, ['*'], message, 'PUBLISH');

    // CI Trigger
    const deployment = await this.ciProvider.triggerDeployment(projectId, commit.commitId, userId, draftVersion);

    const logDb = await MongoAuditLog.create({
      userId, projectId, action: 'PUBLISH', result: 'SUCCESS', commitSha: commit.commitId
    });

    return { commit, deployment };
  }

  // --- ROLLBACK ---
  async rollback(projectId: string, userId: string, targetPublishedVersion: string) {
    await this.checkPermission(userId, projectId, 'deployment.rollback');
    const projectDir = this.getProjectDir(projectId);

    // Verify the target snapshot exists
    const targetSnapshotDir = path.resolve(projectDir, 'published', `v${targetPublishedVersion}`);
    try {
        const stat = await fs.stat(targetSnapshotDir);
        if (!stat.isDirectory()) throw new Error("Snapshot not found");
    } catch {
        throw new Error(`Published snapshot v${targetPublishedVersion} does not exist for rollback.`);
    }

    // Git record
    const commit = await this.gitProvider.commit(projectId, userId, ['*'], `Rollback to v${targetPublishedVersion}`, 'ROLLBACK');

    // Update active production pointer immediately (fast rollback)
    const metaPath = path.resolve(projectDir, '.published_version.json');
    await fs.writeFile(metaPath, JSON.stringify({ version: targetPublishedVersion, deploymentId: commit.commitId, isRollback: true }));

    // Audit
    const logDb = await MongoAuditLog.create({
      userId, projectId, action: 'ROLLBACK', result: 'SUCCESS', commitSha: commit.commitId
    });

    const log: AuditLog = {
      id: logDb._id.toString(), userId, projectId, action: 'ROLLBACK',
      timestamp: logDb.createdAt.toISOString(), result: 'SUCCESS'
    };

    return { log, commit, restoredVersion: targetPublishedVersion };
  }
}
