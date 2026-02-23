# Practice Planner - Claude Code Instructions

## Project Overview
GC Falcons Practice Planner - A Next.js web app for softball coaches to plan, organize, and track team practices with drill scheduling, player grouping, and rotation management.

## Tech Stack
- **Framework**: Next.js 16.1.3 with App Router
- **UI**: React 19, Tailwind CSS 4
- **Database**: Firebase Firestore
- **Drag-Drop**: @dnd-kit
- **Types**: TypeScript 5 (strict mode)

## Key Directories
- `src/app/` - Next.js pages (players, coaches, drills, equipment, practices, metrics)
- `src/components/` - React components organized by feature
- `src/lib/` - Utility functions (timeEngine, rotationCalculator, groupingUtils)
- `src/hooks/` - Custom hooks (useFirestore)
- `src/types/` - TypeScript interfaces

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Known Issues to Address
1. **Security**: No authentication - add Firebase Auth before production
2. **Performance**: `DrillSequencer.tsx` is 800+ lines - needs splitting
3. **Efficiency**: useFirestore does full re-fetch after mutations
4. **Validation**: Add Zod for runtime input validation

## Slash Commands
- `/review` - Run comprehensive code review (security, best practices, efficiency)

## Firebase Collections
- `practices` - Practice sessions with attendance and drill schedules
- `players` - Team roster with positions and status
- `coaches` - Coaching staff
- `drills` - Drill library with categories and equipment
- `equipment` - Equipment inventory
