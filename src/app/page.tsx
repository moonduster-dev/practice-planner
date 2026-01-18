'use client';

import Link from 'next/link';
import { Card } from '@/components/ui';

const quickActions = [
  {
    title: 'Players',
    description: 'Manage your roster',
    href: '/players',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'bg-blue-500',
  },
  {
    title: 'Drills',
    description: 'Build your drill library',
    href: '/drills',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    color: 'bg-green-500',
  },
  {
    title: 'Equipment',
    description: 'Track your inventory',
    href: '/equipment',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    color: 'bg-yellow-500',
  },
  {
    title: 'New Practice',
    description: 'Plan a practice session',
    href: '/practices/new',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
      </svg>
    ),
    color: 'bg-purple-500',
  },
];

export default function Dashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Softball Practice Planner</h1>
        <p className="mt-2 text-gray-600">
          Plan, organize, and track your team&apos;s practice sessions
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start space-x-4">
                <div className={`${action.color} p-3 rounded-lg text-white`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Getting Started */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>
            <strong>Add your players</strong> - Go to Players and add your team roster
          </li>
          <li>
            <strong>Build your drill library</strong> - Create drills with categories, durations, and equipment
          </li>
          <li>
            <strong>Add equipment</strong> - Track what equipment you have available
          </li>
          <li>
            <strong>Create a practice</strong> - Set the date, check attendance, and build your schedule
          </li>
          <li>
            <strong>Use rotations</strong> - Split players into groups and rotate through drills
          </li>
        </ol>
      </Card>
    </div>
  );
}
