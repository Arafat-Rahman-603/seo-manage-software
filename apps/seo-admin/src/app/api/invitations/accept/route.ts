import { NextResponse } from 'next/server';
import { connectMongoDB, Invitation, User, Membership } from 'backend';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { token, name, password } = body;

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Usually you'd hash the token and query by tokenHash, but for simplicity here we query tokenHash: token.
    const invitation = await Invitation.findOne({ tokenHash: token, acceptedAt: { $exists: false } });
    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    let user = await User.findOne({ email: invitation.email });
    if (!user) {
      user = await User.create({
        email: invitation.email,
        name,
        passwordHash: hashedPassword,
        status: 'ACTIVE'
      });
    }

    // Create membership
    await Membership.create({
      userId: user.id,
      organizationId: invitation.organizationId,
      projectId: invitation.projectId,
      role: invitation.role
    });

    // Mark invitation accepted
    invitation.acceptedAt = new Date();
    await invitation.save();

    // Auto-login? We can just send them to /login
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
