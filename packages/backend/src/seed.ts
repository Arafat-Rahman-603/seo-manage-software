import 'dotenv/config';
import { connectMongoDB } from './mongodb';
import { User } from './models/User';
import { Organization } from './models/Organization';
import { Project } from './models/Project';
import { Membership } from './models/Membership';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

async function main() {
  await connectMongoDB();
  
  console.log("Clearing DB...");
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Project.deleteMany({});
  await Membership.deleteMany({});

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Super Admin User
  const superAdmin = await User.create({
    name: 'System Admin',
    email: 'admin@platform.com',
    passwordHash,
  });

  // 2. Create Organizations
  const org1 = await Organization.create({ name: 'Acme Corp', slug: 'acme-corp' });
  const org2 = await Organization.create({ name: 'Beta Inc', slug: 'beta-inc' });

  // 3. Create Projects
  const project1 = await Project.create({
    organizationId: org1._id,
    name: 'Northstar Digital',
    slug: 'northstar-digital',
    projectKey: 'northstar-digital',
  });

  const project2 = await Project.create({
    organizationId: org2._id,
    name: 'Peakline Studio',
    slug: 'peakline-studio',
    projectKey: 'peakline-studio',
  });

  // 4. Create Users
  const editorUser = await User.create({
    name: 'Editor One',
    email: 'editor@acme.com',
    passwordHash,
  });

  const viewerUser = await User.create({
    name: 'Viewer One',
    email: 'viewer@acme.com',
    passwordHash,
  });

  // 5. Create Memberships
  await Membership.create([
    {
      userId: superAdmin._id,
      organizationId: org1._id,
      role: 'SUPER_ADMIN',
    },
    {
      userId: superAdmin._id,
      organizationId: org2._id,
      role: 'SUPER_ADMIN',
    },
    {
      userId: editorUser._id,
      organizationId: org1._id,
      projectId: project1._id,
      role: 'EDITOR',
    },
    {
      userId: viewerUser._id,
      organizationId: org1._id,
      projectId: project1._id,
      role: 'VIEWER',
    }
  ]);

  console.log('Seeding finished.');
  process.exit(0);
}

main().catch(console.error);
