'use client';

import { useState, useMemo } from 'react';
import { Card, Button } from '@/components/ui';
import { useFirestoreCollection } from '@/hooks/useFirestore';
import { Practice, Player, Drill } from '@/types';
import AuthGuard from '@/components/auth/AuthGuard';

type TimeRange = 'week' | 'month' | 'season';

export default function MetricsPage() {
  return (
    <AuthGuard>
      <MetricsPageContent />
    </AuthGuard>
  );
}

function MetricsPageContent() {
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const { data: practices, loading: practicesLoading } = useFirestoreCollection<Practice>('practices', {
    orderByField: 'date',
    orderDirection: 'desc',
  });
  const { data: players } = useFirestoreCollection<Player>('players');
  const { data: drills } = useFirestoreCollection<Drill>('drills');

  // Filter practices by time range
  const filteredPractices = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'season':
        // Assume season is last 4 months
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 4);
        break;
    }

    return practices.filter((p) => new Date(p.date) >= startDate);
  }, [practices, timeRange]);

  // Calculate attendance metrics
  const attendanceMetrics = useMemo(() => {
    const playerStats: Record<string, { present: number; total: number }> = {};

    // Initialize all players
    players.forEach((player) => {
      playerStats[player.id] = { present: 0, total: 0 };
    });

    // Count attendance
    filteredPractices.forEach((practice) => {
      players.forEach((player) => {
        if (playerStats[player.id]) {
          playerStats[player.id].total++;
          if (practice.attendance?.[player.id]) {
            playerStats[player.id].present++;
          }
        }
      });
    });

    // Convert to array with player info
    return players
      .map((player) => ({
        player,
        present: playerStats[player.id]?.present || 0,
        total: playerStats[player.id]?.total || 0,
        percentage:
          playerStats[player.id]?.total > 0
            ? Math.round((playerStats[player.id].present / playerStats[player.id].total) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [filteredPractices, players]);

  // Calculate drill category metrics
  const drillCategoryMetrics = useMemo(() => {
    const categories: Record<string, number> = {
      warmup: 0,
      hitting: 0,
      fielding: 0,
      pitching: 0,
      catching: 0,
      iq: 0,
      games: 0,
    };

    filteredPractices.forEach((practice) => {
      practice.sessionBlocks?.forEach((block) => {
        if (block.type === 'single' && block.drillId) {
          const drill = drills.find((d) => d.id === block.drillId);
          if (drill?.category) {
            categories[drill.category] = (categories[drill.category] || 0) + (block.duration || drill.baseDuration || 0);
          }
        } else if (block.type === 'rotation' && block.rotationDrills) {
          block.rotationDrills.forEach((rd) => {
            const drill = drills.find((d) => d.id === rd.drillId);
            if (drill?.category) {
              categories[drill.category] = (categories[drill.category] || 0) + (rd.duration || 0);
            }
          });
        }
      });
    });

    const total = Object.values(categories).reduce((sum, val) => sum + val, 0);

    return Object.entries(categories)
      .filter(([, minutes]) => minutes > 0)
      .map(([category, minutes]) => ({
        category,
        minutes,
        percentage: total > 0 ? Math.round((minutes / total) * 100) : 0,
      }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [filteredPractices, drills]);

  const totalDrillMinutes = drillCategoryMetrics.reduce((sum, cat) => sum + cat.minutes, 0);

  const categoryColors: Record<string, { bg: string; text: string; pie: string }> = {
    warmup: { bg: 'bg-orange-100', text: 'text-orange-800', pie: '#fb923c' },
    hitting: { bg: 'bg-red-100', text: 'text-red-800', pie: '#f87171' },
    fielding: { bg: 'bg-green-100', text: 'text-green-800', pie: '#4ade80' },
    pitching: { bg: 'bg-blue-100', text: 'text-blue-800', pie: '#60a5fa' },
    catching: { bg: 'bg-purple-100', text: 'text-purple-800', pie: '#c084fc' },
    iq: { bg: 'bg-yellow-100', text: 'text-yellow-800', pie: '#facc15' },
    games: { bg: 'bg-pink-100', text: 'text-pink-800', pie: '#f472b6' },
  };

  const categoryLabels: Record<string, string> = {
    warmup: 'Warmup',
    hitting: 'Hitting',
    fielding: 'Fielding',
    pitching: 'Pitching',
    catching: 'Catching',
    iq: 'Game IQ',
    games: 'Games',
  };

  // Generate pie chart SVG
  const generatePieChart = () => {
    if (drillCategoryMetrics.length === 0) return null;

    const size = 200;
    const center = size / 2;
    const radius = 80;

    let cumulativeAngle = -90; // Start from top

    const paths = drillCategoryMetrics.map((cat, index) => {
      const angle = (cat.percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const pathD = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return (
        <path
          key={cat.category}
          d={pathD}
          fill={categoryColors[cat.category]?.pie || '#gray'}
          stroke="white"
          strokeWidth="2"
        />
      );
    });

    return (
      <svg width={size} height={size} className="mx-auto">
        {paths}
      </svg>
    );
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-navy-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-navy-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (practicesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Loading metrics...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Team Metrics</h1>
          <p className="text-gray-600">
            {filteredPractices.length} practices in selected period
          </p>
        </div>
      </div>

      {/* Time Range Selector */}
      <Card className="mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Time Range:</span>
          <Button
            variant={timeRange === 'week' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('week')}
          >
            Week
          </Button>
          <Button
            variant={timeRange === 'month' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('month')}
          >
            Month
          </Button>
          <Button
            variant={timeRange === 'season' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setTimeRange('season')}
          >
            Season
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Metrics */}
        <Card>
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Player Attendance</h2>
          {attendanceMetrics.length === 0 ? (
            <p className="text-gray-500 text-sm">No attendance data available.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceMetrics.map(({ player, present, total, percentage }) => (
                <div key={player.id} className="flex items-center space-x-3">
                  <div className="w-32 truncate">
                    <span className="text-sm font-medium text-gray-900">{player.name}</span>
                    <span className="text-xs text-gray-500 ml-1">#{player.jerseyNumber}</span>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getAttendanceBarColor(percentage)} transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <span className={`text-sm font-bold ${getAttendanceColor(percentage)}`}>
                      {percentage}%
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      ({present}/{total})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Drill Categories */}
        <Card>
          <h2 className="text-lg font-semibold text-navy-900 mb-4">Drill Categories</h2>
          {drillCategoryMetrics.length === 0 ? (
            <p className="text-gray-500 text-sm">No drill data available.</p>
          ) : (
            <div>
              {/* Pie Chart */}
              <div className="mb-4">{generatePieChart()}</div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2">
                {drillCategoryMetrics.map(({ category, minutes, percentage }) => (
                  <div key={category} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: categoryColors[category]?.pie }}
                    />
                    <span className="text-sm text-gray-700">
                      {categoryLabels[category] || category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {percentage}% ({minutes} min)
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Total Practice Time:</span> {totalDrillMinutes} minutes
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-navy-900">{filteredPractices.length}</div>
          <div className="text-sm text-gray-500">Practices</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-navy-900">
            {Math.round(
              attendanceMetrics.reduce((sum, a) => sum + a.percentage, 0) /
                (attendanceMetrics.length || 1)
            )}
            %
          </div>
          <div className="text-sm text-gray-500">Avg Attendance</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-navy-900">{totalDrillMinutes}</div>
          <div className="text-sm text-gray-500">Total Minutes</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-navy-900">
            {drillCategoryMetrics.length > 0 ? categoryLabels[drillCategoryMetrics[0].category] : '-'}
          </div>
          <div className="text-sm text-gray-500">Top Category</div>
        </Card>
      </div>
    </div>
  );
}
