import { NextResponse } from 'next/server';
import { requireAuth } from 'backend';
import { connectMongoDB } from 'backend';
import { Invitation } from 'backend';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    await connectMongoDB();

    const body = await request.json();
    const { email, role, organizationId, projectId } = body;

    if (!email || !role || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invitation = await Invitation.create({
      email,
      tokenHash: token,
      role,
      organizationId,
      projectId,
      expiresAt,
      createdBy: session.userId
    });

    // In a real app, send email here.
    return NextResponse.json({ 
      success: true, 
      invitationUrl: `http://localhost:3000/accept-invite?token=${token}` 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
