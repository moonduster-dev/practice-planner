'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/players', label: 'Players' },
  { href: '/coaches', label: 'Coaches' },
  { href: '/drills', label: 'Drills' },
  { href: '/equipment', label: 'Equipment' },
  { href: '/practices', label: 'Practices' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-navy-900 border-b border-navy-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gold-400 rounded-full flex items-center justify-center">
                  <span className="text-navy-900 font-black text-lg">GC</span>
                </div>
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
        </div>
      </div>
    </nav>
  );
}
