# Authentication: NextAuth.js with Signup, Login, Sessions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete user authentication system with signup, login, session management, and protected routes using NextAuth.js with credentials provider and JWT strategy.

**Architecture:** NextAuth.js with credentials provider for email/password auth, bcrypt for password hashing, Prisma for database access with SQLite (default for Next.js apps), and middleware for route protection. Session data flows through NextAuth's useSession hook and server-side getSession.

**Tech Stack:** Next.js 14, NextAuth.js v4, Prisma ORM, bcryptjs, TypeScript

---

## File Structure

**Files to Create:**
- `prisma/schema.prisma` - Database schema with User and Session models
- `src/lib/prisma.ts` - Prisma client singleton
- `src/lib/auth.ts` - NextAuth configuration and auth options
- `src/lib/auth-types.ts` - Auth-related TypeScript types
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API route handler
- `src/app/api/auth/register/route.ts` - User registration API
- `src/app/(auth)/login/page.tsx` - Login page component
- `src/app/(auth)/signup/page.tsx` - Signup page component
- `src/middleware.ts` - Route protection middleware
- `src/components/auth/session-provider.tsx` - Session context provider

**Files to Modify:**
- `src/app/layout.tsx` - Wrap with SessionProvider
- `package.json` - Add dependencies

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies to package.json**

Edit `package.json` to add:
```json
"dependencies": {
  "next-auth": "^4.24.0",
  "bcryptjs": "^2.4.3",
  "@prisma/client": "^5.14.0"
},
"devDependencies": {
  "prisma": "^5.14.0",
  "@types/bcryptjs": "^2.4.6"
}
```

- [ ] **Step 2: Install dependencies**

Run: `cd ~/coding/family-site && npm install`
Expected: All packages installed successfully

---

### Task 2: Setup Prisma Schema

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Create Prisma schema with User and Session models**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String
  avatarUrl     String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  sessions      Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Create Prisma client singleton**

Create `src/lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Run Prisma migration**

Run: `cd ~/coding/family-site && npx prisma migrate dev --name init_auth`
Expected: Database created and migrations applied

- [ ] **Step 4: Generate Prisma client**

Run: `cd ~/coding/family-site && npx prisma generate`
Expected: Prisma client generated successfully

- [ ] **Step 5: Commit**

Run:
```bash
cd ~/coding/family-site
git add prisma/schema.prisma src/lib/prisma.ts
git commit -m "feat: add Prisma schema with User and Session models"
```

---

### Task 3: Create NextAuth Configuration

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/auth-types.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create auth types**

Create `src/lib/auth-types.ts`:
```typescript
import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
  }
}
```

- [ ] **Step 2: Create NextAuth options**

Create `src/lib/auth.ts`:
```typescript
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const handler = NextAuth(authOptions);
```

- [ ] **Step 3: Create NextAuth API route**

Create `src/app/api/auth/[...nextauth]/route.ts`:
```typescript
import { handler } from '@/lib/auth';

export { handler as GET, handler as POST };
```

- [ ] **Step 4: Commit**

Run:
```bash
cd ~/coding/family-site
git add src/lib/auth.ts src/lib/auth-types.ts src/app/api/auth/\[...nextauth\]/route.ts
git commit -m "feat: configure NextAuth with credentials provider"
```

---

### Task 4: Create Registration API

**Files:**
- Create: `src/app/api/auth/register/route.ts`

- [ ] **Step 1: Write the registration API handler**

Create `src/app/api/auth/register/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name || null,
      },
    });

    return NextResponse.json(
      { 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name 
        } 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/coding/family-site
git add src/app/api/auth/register/route.ts
git commit -m "feat: add user registration API endpoint"
```

---

### Task 5: Create Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 1: Create the login page component**

Create `src/app/(auth)/login/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/signup"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Don't have an account? Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/coding/family-site
git add "src/app/(auth)/login/page.tsx"
git commit -m "feat: add login page"
```

---

### Task 6: Create Signup Page

**Files:**
- Create: `src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create the signup page component**

Create `src/app/(auth)/signup/page.tsx`:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
      } else {
        router.push('/login?registered=1');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="name" className="sr-only">
                Name (optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/coding/family-site
git add "src/app/(auth)/signup/page.tsx"
git commit -m "feat: add signup page"
```

---

### Task 7: Create Session Provider

**Files:**
- Create: `src/components/auth/session-provider.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create SessionProvider component**

Create `src/components/auth/session-provider.tsx`:
```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';

interface SessionProviderProps {
  children: React.ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

- [ ] **Step 2: Update layout to include SessionProvider**

Modify `src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SessionProvider } from "@/components/auth/session-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Family Site",
  description: "Family website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

Run:
```bash
cd ~/coding/family-site
git add src/components/auth/session-provider.tsx src/app/layout.tsx
git commit -m "feat: add SessionProvider to app layout"
```

---

### Task 8: Create Auth Middleware

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Create middleware for route protection**

Create `src/middleware.ts`:
```typescript
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                       req.nextUrl.pathname.startsWith('/signup');
    const isAuthApi = req.nextUrl.pathname.startsWith('/api/auth');

    // Allow public access to auth pages and auth API
    if (isAuthPage || isAuthApi) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated
    if (!isAuth) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (robots.txt, sitemap.xml, etc.)
     * - auth pages and API
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|signup|api/auth).*)',
  ],
};
```

- [ ] **Step 2: Commit**

Run:
```bash
cd ~/coding/family-site
git add src/middleware.ts
git commit -m "feat: add auth middleware for route protection"
```

---

### Task 9: Add Environment Configuration

**Files:**
- Create: `.env.local`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env.local with required variables**

Create `.env.local`:
```
# NextAuth
NEXTAUTH_SECRET=your-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000
```

- [ ] **Step 2: Verify .env.local is in .gitignore**

Check that `.gitignore` contains:
```
.env
.env.local
.env.*.local
```

- [ ] **Step 3: Commit**

Run:
```bash
cd ~/coding/family-site
git add .env.local
git commit -m "feat: add environment configuration for NextAuth"
```

---

### Task 10: Update Home Page and Verify

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update home page to show auth status**

Modify `src/app/page.tsx`:
```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Family Site
              </span>
            </div>
            <div className="flex items-center gap-4">
              {status === 'loading' ? (
                <span className="text-gray-500">Loading...</span>
              ) : session ? (
                <>
                  <span className="text-gray-700 dark:text-gray-300">
                    Welcome, {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/signup"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Family Site
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {session 
              ? 'You are signed in. Explore the site!'
              : 'Sign in or create an account to get started.'}
          </p>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Final commit**

Run:
```bash
cd ~/coding/family-site
git add src/app/page.tsx
git commit -m "feat: update home page with auth status"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ Configure NextAuth.js with JWT strategy - Task 3
- ✅ Create signup page with password hashing (bcrypt) - Task 4, Task 6
- ✅ Create login page - Task 5
- ✅ Implement session management - Task 3, Task 7
- ✅ Add auth middleware to protect routes - Task 8
- ✅ Create User model in Prisma schema - Task 2

**2. Placeholder scan:** No TBD/TODO placeholders found - all code is complete

**3. Type consistency:** 
- User model fields match across schema, types, and components
- Session types properly extended in auth-types.ts
- All imports use consistent paths (@/ alias)

---

Plan complete and saved to `docs/superpowers/plans/2026-05-03-authentication-nextauth.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
