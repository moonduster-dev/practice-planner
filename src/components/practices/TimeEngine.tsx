'use client';

import { SessionBlock } from '@/types';
import { calculateRemainingTime, formatTime, getTimeStatusColor } from '@/lib/timeEngine';

interface TimeEngineProps {
  totalMinutes: number;
  sessionBlocks: SessionBlock[];
  autoWaterBreaks?: boolean;
}

export default function TimeEngineDisplay({
  totalMinutes,
  sessionBlocks,
  autoWaterBreaks = true,
}: TimeEngineProps) {
  const result = calculateRemainingTime(totalMinutes, sessionBlocks, autoWaterBreaks);
  const percentage = Math.max(0, Math.min(100, (result.remainingMinutes / totalMinutes) * 100));
  const usedPercentage = 100 - percentage;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Time Remaining</h3>

      {/* Progress Bar */}
      <div className="h-4 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-300 ${
            result.isOverLimit ? 'bg-red-500' : usedPercentage > 90 ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${Math.min(100, usedPercentage)}%` }}
        />
      </div>

      {/* Time Display */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {formatTime(result.usedMinutes)} used
        </div>
        <div className={`text-lg font-bold ${getTimeStatusColor(result.remainingMinutes, totalMinutes)}`}>
          {result.isOverLimit ? (
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              {formatTime(Math.abs(result.remainingMinutes))} over
            </span>
          ) : (
            `${formatTime(result.remainingMinutes)} left`
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <div>Total: {formatTime(totalMinutes)}</div>
        <div>Blocks: {sessionBlocks.length}</div>
        {autoWaterBreaks && result.waterBreaksInserted > 0 && (
          <div className="col-span-2">
            Water breaks: {result.waterBreaksInserted} ({result.waterBreaksInserted * 5}min)
          </div>
        )}
      </div>
    </div>
  );
}
