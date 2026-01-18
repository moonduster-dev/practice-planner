import { SessionBlock, TimeEngineResult } from '@/types';

const WATER_BREAK_INTERVAL = 45; // minutes
const WATER_BREAK_DURATION = 5; // minutes

/**
 * Calculates the duration of a single session block
 */
export function calculateBlockDuration(block: SessionBlock): number {
  if (block.type === 'single') {
    return block.duration || 0;
  }

  // For rotation blocks, the total time is the time for ONE group to complete all drills
  // All groups rotate simultaneously
  if (block.rotationDrills && block.rotationDrills.length > 0) {
    return block.rotationDrills.reduce((sum, drill) => sum + drill.duration, 0);
  }

  return 0;
}

/**
 * Calculates the number of water breaks needed based on practice duration
 */
export function calculateWaterBreaks(totalUsedMinutes: number): number {
  if (totalUsedMinutes <= WATER_BREAK_INTERVAL) {
    return 0;
  }
  return Math.floor(totalUsedMinutes / WATER_BREAK_INTERVAL);
}

/**
 * Main time engine function that calculates remaining time
 * @param totalMinutes - Total practice time allocated
 * @param sessionBlocks - Array of session blocks (drills/rotations)
 * @param autoWaterBreaks - Whether to automatically insert water breaks
 */
export function calculateRemainingTime(
  totalMinutes: number,
  sessionBlocks: SessionBlock[],
  autoWaterBreaks: boolean = true
): TimeEngineResult {
  // Calculate total used time from all blocks
  const blocksTime = sessionBlocks.reduce(
    (sum, block) => sum + calculateBlockDuration(block),
    0
  );

  // Calculate water breaks if enabled
  const waterBreaksInserted = autoWaterBreaks ? calculateWaterBreaks(blocksTime) : 0;
  const waterBreakTime = waterBreaksInserted * WATER_BREAK_DURATION;

  const usedMinutes = blocksTime + waterBreakTime;
  const remainingMinutes = totalMinutes - usedMinutes;

  return {
    totalMinutes,
    usedMinutes,
    remainingMinutes,
    isOverLimit: remainingMinutes < 0,
    waterBreaksInserted,
  };
}

/**
 * Gets the positions where water breaks should be inserted
 * Returns array of indices in the session blocks where breaks should occur
 */
export function getWaterBreakPositions(sessionBlocks: SessionBlock[]): number[] {
  const positions: number[] = [];
  let cumulativeTime = 0;
  let nextBreakAt = WATER_BREAK_INTERVAL;

  for (let i = 0; i < sessionBlocks.length; i++) {
    const blockDuration = calculateBlockDuration(sessionBlocks[i]);
    cumulativeTime += blockDuration;

    if (cumulativeTime >= nextBreakAt) {
      positions.push(i + 1); // Insert after this block
      nextBreakAt += WATER_BREAK_INTERVAL;
    }
  }

  return positions;
}

/**
 * Formats minutes into a readable time string
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60);
  const mins = Math.abs(minutes) % 60;
  const sign = minutes < 0 ? '-' : '';

  if (hours > 0) {
    return `${sign}${hours}h ${mins}m`;
  }
  return `${sign}${mins}m`;
}

/**
 * Returns a color based on remaining time percentage
 */
export function getTimeStatusColor(remainingMinutes: number, totalMinutes: number): string {
  if (remainingMinutes < 0) return 'text-red-600';
  const percentRemaining = (remainingMinutes / totalMinutes) * 100;
  if (percentRemaining <= 10) return 'text-red-500';
  if (percentRemaining <= 25) return 'text-yellow-500';
  return 'text-green-600';
}
