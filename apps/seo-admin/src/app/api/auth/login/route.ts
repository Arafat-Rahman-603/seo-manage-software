import { NextResponse } from 'next/server';
import { User, connectMongoDB, encrypt } from 'backend';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    await connectMongoDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const sessionData = { userId: user.id, email: user.email };
    const encryptedSession = await encrypt(sessionData);

    const response = NextResponse.json({ success: true });
    response.cookies.set('session', encryptedSession, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
