export interface GitCommitRecord {
  projectId: string;
  author: string;
  changedFiles: string[];
  commitId: string;
  message: string;
  timestamp: string;
  operation: 'SAVE' | 'PUBLISH' | 'ROLLBACK';
}

export interface GitProvider {
  commit(projectId: string, author: string, files: string[], message: string, operation: 'SAVE' | 'PUBLISH' | 'ROLLBACK'): Promise<GitCommitRecord>;
  history(projectId: string): Promise<GitCommitRecord[]>;
  rollback(projectId: string, commitId: string, author: string): Promise<GitCommitRecord>;
}

import { GitRecord } from '../models/GitRecord';
import { connectMongoDB } from '../mongodb';

export class LocalGitProvider implements GitProvider {

  async commit(projectId: string, author: string, files: string[], message: string, operation: 'SAVE' | 'PUBLISH' | 'ROLLBACK'): Promise<GitCommitRecord> {
    await connectMongoDB();
    const commitId = crypto.randomUUID();
    
    await GitRecord.create({
      projectId,
      userId: author,
      operation,
      commitSha: commitId,
      message,
      changedFiles: files
    });

    const record: GitCommitRecord = {
      projectId,
      author,
      changedFiles: files,
      commitId,
      message,
      timestamp: new Date().toISOString(),
      operation,
    };
    
    console.log(`[GitProvider] Commit created: ${record.commitId} for project ${projectId}`);
    return record;
  }

  async history(projectId: string): Promise<GitCommitRecord[]> {
    await connectMongoDB();
    const records = await GitRecord.find({ projectId }).sort({ createdAt: -1 });
    return records.map(r => ({
      projectId: r.projectId,
      author: r.userId,
      changedFiles: r.changedFiles,
      commitId: r.commitSha,
      message: r.message,
      timestamp: r.createdAt.toISOString(),
      operation: r.operation as any
    }));
  }

  async rollback(projectId: string, commitId: string, author: string): Promise<GitCommitRecord> {
    await connectMongoDB();
    const record = await GitRecord.findOne({ commitSha: commitId, projectId });
    if (!record) throw new Error("Commit not found");
    return this.commit(projectId, author, record.changedFiles, `Revert to ${commitId}`, 'ROLLBACK');
  }
}
