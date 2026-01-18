'use client';

import Link from 'next/link';
import { Button, Card, Badge } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Practice } from '@/types';

export default function PracticesPage() {
  const { data: practices, loading, error, remove } = useFirestoreCollection<Practice>('practices', {
    orderByField: 'date',
    orderDirection: 'desc',
  });

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this practice?')) {
      await remove(id);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'active':
        return 'info';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practices</h1>
          <p className="text-gray-600">{practices.length} practice plans</p>
        </div>
        <Link href="/practices/new">
          <Button>New Practice</Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading practices...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">Error loading practices: {error.message}</p>
        </div>
      ) : practices.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500 mb-4">No practices planned yet.</p>
          <Link href="/practices/new">
            <Button>Create Your First Practice</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {practices.map((practice) => {
            const presentCount = Object.values(practice.attendance || {}).filter(Boolean).length;

            return (
              <Card key={practice.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {formatDate(practice.date)}
                      </h3>
                      <Badge variant={getStatusColor(practice.status) as 'default' | 'success' | 'warning' | 'danger' | 'info'}>
                        {practice.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>{practice.totalMinutes} minutes</span>
                      <span>{practice.sessionBlocks?.length || 0} activities</span>
                      {presentCount > 0 && <span>{presentCount} players</span>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/practices/${practice.id}`}>
                      <Button variant="secondary" size="sm">
                        {practice.status === 'completed' ? 'View' : 'Edit'}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(practice.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
