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
