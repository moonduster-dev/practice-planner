'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, Badge, Modal, Input } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Practice } from '@/types';

export default function PracticesPage() {
  const router = useRouter();
  const { data: practices, loading, error, remove, add } = useFirestoreCollection<Practice>('practices', {
    orderByField: 'date',
    orderDirection: 'desc',
  });

  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const [practiceToCopy, setPracticeToCopy] = useState<Practice | null>(null);
  const [newDate, setNewDate] = useState('');
  const [copying, setCopying] = useState(false);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this practice?')) {
      await remove(id);
    }
  };

  const handleCopyClick = (practice: Practice) => {
    setPracticeToCopy(practice);
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNewDate(tomorrow.toISOString().split('T')[0]);
    setCopyModalOpen(true);
  };

  const handleCopyPractice = async () => {
    if (!practiceToCopy || !newDate) return;

    setCopying(true);
    try {
      // Create a copy of the practice with the new date
      const newPractice: Omit<Practice, 'id' | 'createdAt' | 'updatedAt'> = {
        date: new Date(newDate),
        totalMinutes: practiceToCopy.totalMinutes,
        attendance: {}, // Clear attendance for new date
        groups: practiceToCopy.groups || {},
        sessionBlocks: practiceToCopy.sessionBlocks || [],
        postPracticeNotes: '',
        drillRatings: {},
        status: 'draft',
      };

      const newId = await add(newPractice);
      setCopyModalOpen(false);
      setPracticeToCopy(null);
      router.push(`/practices/${newId}`);
    } catch (err) {
      console.error('Error copying practice:', err);
      alert('Failed to copy practice. Please try again.');
    } finally {
      setCopying(false);
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
                      onClick={() => handleCopyClick(practice)}
                      title="Copy practice"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </Button>
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

      {/* Copy Practice Modal */}
      <Modal
        isOpen={copyModalOpen}
        onClose={() => setCopyModalOpen(false)}
        title="Copy Practice"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Create a copy of this practice plan for a new date. The schedule and drills will be copied, but attendance will be cleared.
          </p>

          {practiceToCopy && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-500">Copying from:</p>
              <p className="font-medium text-gray-900">{formatDate(practiceToCopy.date)}</p>
              <p className="text-sm text-gray-500">
                {practiceToCopy.totalMinutes} min | {practiceToCopy.sessionBlocks?.length || 0} activities
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Practice Date
            </label>
            <Input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="ghost"
              onClick={() => setCopyModalOpen(false)}
              disabled={copying}
            >
              Cancel
            </Button>
            <Button onClick={handleCopyPractice} disabled={copying || !newDate}>
              {copying ? 'Copying...' : 'Copy Practice'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
