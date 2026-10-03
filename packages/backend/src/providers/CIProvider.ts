import fs from 'fs/promises';
import path from 'path';
import { DeploymentRecord as SharedDeploymentRecord, DeploymentStatusEnum } from "shared-types";
import { DeploymentRecord } from '../models/DeploymentRecord';
import { connectMongoDB } from '../mongodb';

export interface CIProvider {
  triggerDeployment(projectId: string, commitSha: string, userId: string, draftVersion: string): Promise<SharedDeploymentRecord>;
}

export class LocalCIProvider implements CIProvider {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = path.resolve(baseDir, '../../');
  }

  async triggerDeployment(projectId: string, commitSha: string, userId: string, draftVersion: string): Promise<SharedDeploymentRecord> {
    await connectMongoDB();
    
    const dbRecord = await DeploymentRecord.create({
      projectId,
      commitSha,
      draftVersion: parseInt(draftVersion, 10),
      trigger: 'MANUAL',
      status: 'QUEUED',
      startedAt: new Date(),
    });

    const record: SharedDeploymentRecord = {
      id: dbRecord._id.toString(),
      projectId,
      commitSha,
      triggeredByUserId: userId,
      startedAt: dbRecord.startedAt.toISOString(),
      status: "QUEUED",
    };

    const projectDir = path.resolve(this.baseDir, 'websites', projectId);
    const draftDataDir = path.resolve(projectDir, 'data');
    const publishTargetDir = path.resolve(projectDir, 'published', `v${draftVersion}`);
    const metaPath = path.resolve(projectDir, '.published_version.json');

    // Simulate async CI/CD Pipeline
    setTimeout(async () => {
      try {
        console.log(`[CIProvider] VALIDATING for ${record.id}`);
        await connectMongoDB();
        await DeploymentRecord.findByIdAndUpdate(dbRecord._id, { status: 'VALIDATING' });
        
        // (Fake delay)
        await new Promise(r => setTimeout(r, 500));
        
        console.log(`[CIProvider] BUILDING for ${record.id}`);
        await DeploymentRecord.findByIdAndUpdate(dbRecord._id, { status: 'BUILDING' });
        
        // Recursive copy fallback for Node < 16.7 or simple use
        await fs.cp(draftDataDir, publishTargetDir, { recursive: true, force: true });
        
        console.log(`[CIProvider] DEPLOYING for ${record.id}`);
        await DeploymentRecord.findByIdAndUpdate(dbRecord._id, { status: 'DEPLOYING' });
        
        // Mark this version as the active production version
        await fs.writeFile(metaPath, JSON.stringify({ version: draftVersion, deploymentId: record.id }));

        await DeploymentRecord.findByIdAndUpdate(dbRecord._id, { 
            status: 'SUCCESS',
            publishedVersion: parseInt(draftVersion, 10),
            completedAt: new Date()
        });
        console.log(`[CIProvider] Deployment ${record.id} finished with status SUCCESS (Published v${draftVersion})`);
      } catch (e: any) {
        console.error(`[CIProvider] Deployment failed`, e);
        await connectMongoDB();
        await DeploymentRecord.findByIdAndUpdate(dbRecord._id, { 
            status: 'FAILED',
            error: e.message,
            completedAt: new Date()
        });
      }
    }, 1000);

    return record;
  }
}
