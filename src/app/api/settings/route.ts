import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import '../../../lib/auth-types';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'updateProfile') {
      return updateProfile(session.user.id, body);
    } else if (action === 'changePassword') {
      return changePassword(session.user.id, body);
    } else if (action === 'uploadAvatar') {
      return uploadAvatar(session.user.id, body);
    } else if (action === 'deleteAvatar') {
      return deleteAvatar(session.user.id);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

async function updateProfile(userId: string, body: { name: string; email: string }) {
  const parsed = profileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { name, email } = parsed.data;

  // Check if email is already taken by another user
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      id: { not: userId },
    },
  });

  if (existingUser) {
    return NextResponse.json(
      { errors: { email: ['This email is already in use'] } },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, email },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ user, message: 'Profile updated successfully' });
}

async function changePassword(userId: string, body: { currentPassword: string; newPassword: string }) {
  const parsed = passwordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);

  if (!isPasswordValid) {
    return NextResponse.json(
      { errors: { currentPassword: ['Current password is incorrect'] } },
      { status: 400 }
    );
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  return NextResponse.json({ message: 'Password changed successfully' });
}

async function uploadAvatar(userId: string, body: { avatarData: string }) {
  const { avatarData } = body;

  if (!avatarData) {
    return NextResponse.json(
      { errors: { avatar: ['No avatar data provided'] } },
      { status: 400 }
    );
  }

  // Create avatars directory if it doesn't exist
  const avatarsDir = path.join(process.cwd(), 'public', 'avatars');
  if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
  }

  // Generate unique filename
  const filename = `${userId}-${uuidv4()}.jpg`;
  const filepath = path.join(avatarsDir, filename);

  // Decode base64 and save file
  const buffer = Buffer.from(avatarData.split(',')[1], 'base64');
  fs.writeFileSync(filepath, buffer);

  const avatarUrl = `/avatars/${filename}`;

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  return NextResponse.json({
    avatarUrl,
    message: 'Avatar uploaded successfully',
  });
}

async function deleteAvatar(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Delete file if exists
  if (user.avatarUrl) {
    const filepath = path.join(process.cwd(), 'public', user.avatarUrl.replace(/^\//, ''));
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ message: 'Avatar deleted successfully' });
}
