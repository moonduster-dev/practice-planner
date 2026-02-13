'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/players', label: 'Players' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/drills', label: 'Drills' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/practices', label: 'Practices' },
  { href: '/metrics', label: 'Metrics' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, authEnabled, signIn, signOut } = useAuth();

  // Hide navbar on coach-view pages (read-only shareable view)
  if (pathname.includes('/coach-view')) {
    return null;
  }

  return (
    <nav className="bg-navy-900 border-b border-navy-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/gc-logo.png"
                  alt="GC Falcons Logo"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="hidden sm:block">
                  <div className="text-lg font-bold text-white">GC Falcons</div>
                  <div className="text-xs text-gold-400 -mt-1">Practice Planner</div>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-gold-400 text-navy-900'
                        : 'text-navy-100 hover:bg-navy-800 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Auth Section */}
            {authEnabled && (
              <div className="hidden sm:flex items-center ml-4">
                {user ? (
                  <div className="flex items-center space-x-3">
                    {user.photoURL && (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        className="w-8 h-8 rounded-full"
                      />
                    )}
                    <span className="text-sm text-navy-100">{user.displayName?.split(' ')[0]}</span>
                    <button
                      onClick={() => signOut()}
                      className="text-sm text-navy-300 hover:text-white transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn()}
                    className="text-sm text-navy-100 hover:text-white transition-colors"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="sm:hidden border-t border-navy-800">
        <div className="flex overflow-x-auto py-2 px-4 space-x-2">
          {navItems.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-gold-400 text-navy-900'
                    : 'text-navy-100 hover:bg-navy-800'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {/* Mobile Auth */}
          {authEnabled && (
            user ? (
              <button
                onClick={() => signOut()}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md text-navy-300 hover:bg-navy-800"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => signIn()}
                className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-md text-navy-100 hover:bg-navy-800"
              >
                Sign In
              </button>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
