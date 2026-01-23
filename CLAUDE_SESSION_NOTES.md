# Practice Planner - Session Summary

## Project Overview
Next.js 14 softball practice planner with Firebase Firestore, Tailwind CSS, @dnd-kit for drag-drop.

## Recent Changes Completed

### 1. Group/Partner Editing (GroupManager.tsx)
- Edit group/partner names inline (click name or pencil icon)
- Add/remove players from groups manually
- Shows unassigned players in yellow warning box
- Fixed partner count bug: uses `Math.floor` not `Math.ceil`

### 2. Video Playback (DrillCard.tsx)
- `getEmbedInfo()` function handles YouTube, Vimeo, Google Drive, TikTok, direct video URLs
- Modal with embedded player or "Watch on TikTok" button for non-embeddable platforms
- Always shows "Open in new tab" link

### 3. Groups on All Drills (DrillSequencer.tsx + types/index.ts)
- `SessionBlock` now has `groupIds` and `coachIds` for single drills
- When drill added, all groups assigned by default
- Edit modal for single drills: change duration, coaches, groups/partners, notes
- Groups display as purple badges on each drill block

### 4. Shareable Coach View (practices/[id]/coach-view/page.tsx)
- Read-only practice schedule with all details
- Shows groups/partners with player names
- Expandable video players per drill
- Works for rotations too

### 5. Share Button (practices/[id]/page.tsx)
- "Share" copies coach-view URL to clipboard
- "View Schedule" opens coach-view in new tab

### 6. Per-Drill Partner Editing (DrillSequencer.tsx)
- Partners can be changed for each individual drill
- `SessionBlock.drillGroups` stores drill-specific group overrides
- Edit modal shows "Change Partners for this Drill" button when in partners mode
- Partner editor allows moving players between groups via dropdown
- Shows "✎ modified" badge on drills with custom partner compositions
- Coach-view shows modified partners in amber highlight box
- Reset button to restore practice-level partner assignments

### 7. Per-Station Partner Editing (RotationBuilder.tsx)
- Partners can be changed for each rotation station
- `RotationDrill.stationGroups` stores station-specific group overrides
- "Change Partners for this Station" button appears when in partners mode
- Partner editor allows moving players between groups via dropdown
- Shows "✎ modified" badge on stations with custom partner compositions
- Coach-view shows modified partners in amber highlight box for each station
- Reset button to restore practice-level partner assignments

## Key Files
- `src/types/index.ts` - SessionBlock has groupIds, coachIds
- `src/components/practices/DrillSequencer.tsx` - Drill editing with groups
- `src/components/practices/GroupManager.tsx` - Group/partner management
- `src/components/drills/DrillCard.tsx` - Video embed logic
- `src/lib/groupingUtils.ts` - createPartners, createGroups functions
- `src/app/practices/[id]/coach-view/page.tsx` - Shareable view

## Known Limitations
- TikTok requires click-through (no iframe embedding)
- Google Drive videos need "Anyone with link" sharing permission

## Tech Stack
- Next.js 14 (App Router)
- React 18 with TypeScript
- Firebase Firestore
- Tailwind CSS
- @dnd-kit/core for drag-drop
- uuid for ID generation

## Firestore Collections
- players, drills, equipment, coaches, practices

## Key Types (src/types/index.ts)
```typescript
SessionBlock {
  id, type, order,
  drillId?, duration?, coachId?, coachIds?, equipmentIds?, notes?,
  groupIds?,  // Groups/partners for this drill
  drillGroups?,  // Per-drill group overrides (different partner compositions)
  rotationDrills?
}

Group { id, name, playerIds }

RotationDrill {
  drillId, drillIds?, drillDurations?, stationName?,
  duration, coachId, coachIds?, groupIds, equipmentIds,
  stationGroups?  // Per-station partner overrides
}
```
