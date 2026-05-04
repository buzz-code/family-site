'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    {
      href: '/dashboard/tools',
      label: 'Tools',
      icon: '🔧',
      dropdown: [
        { href: '/dashboard/tools/tool1', label: 'Tool 1' },
        { href: '/dashboard/tools/tool2', label: 'Tool 2' },
        { href: '/dashboard/tools/tool3', label: 'Tool 3' },
      ],
    },
    { href: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
    { href: '/dashboard/feature-request', label: 'Feature Request', icon: '💡' },
  ];

  return (
    <>
      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
            Family Site
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.href}>
              {item.dropdown ? (
                <DetailsDropdown
                  item={item}
                  pathname={pathname}
                />
              ) : (
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* User info */}
        {session && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {session.user?.name?.[0]?.toUpperCase() || session.user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.user?.name || session.user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-3 w-full text-left text-sm text-red-600 hover:text-red-500 dark:text-red-400"
            >
              Sign out
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon?: string;
  dropdown?: { href: string; label: string }[];
}

function DetailsDropdown({ item, pathname }: { item: NavItem; pathname: string }) {
  return (
    <details className="group">
      <summary
        className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
          pathname?.startsWith(item.href)
            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
      >
        <span className="flex items-center gap-3">
          <span>{item.icon}</span>
          {item.label}
        </span>
        <span className="transform group-open:rotate-180 transition-transform">▼</span>
      </summary>
      <div className="ml-9 mt-1 space-y-1">
        {item.dropdown!.map((subItem: { href: string; label: string }) => (
          <Link
            key={subItem.href}
            href={subItem.href}
            className={`block px-3 py-1.5 text-sm rounded transition-colors ${
              pathname === subItem.href
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {subItem.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
