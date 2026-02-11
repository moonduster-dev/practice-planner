# Softball Practice Planner - User Guide

A web application for planning and managing softball practices with drill scheduling, player grouping, and shareable coach views.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Managing Players](#managing-players)
4. [Managing Coaches](#managing-coaches)
5. [Managing Drills](#managing-drills)
6. [Managing Equipment](#managing-equipment)
7. [Creating a Practice](#creating-a-practice)
8. [Editing a Practice](#editing-a-practice)
9. [Using Groups & Partners](#using-groups--partners)
10. [Creating Rotations](#creating-rotations)
11. [Sharing the Coach View](#sharing-the-coach-view)
12. [Copying a Practice](#copying-a-practice)
13. [Finalizing a Practice](#finalizing-a-practice)
14. [Metrics Dashboard](#metrics-dashboard)

---

## Getting Started

Access the app at your Vercel URL or run locally at `http://localhost:3000`.

The navigation bar at the top provides quick access to all sections:
- **Dashboard** - Overview of upcoming practices
- **Players** - Manage your roster
- **Coaches** - Manage coaching staff
- **Drills** - Your drill library
- **Equipment** - Track equipment inventory
- **Practices** - Create and manage practices
- **Metrics** - View attendance and drill analytics

<!-- Screenshot: Navigation bar -->

---

## Dashboard

The Dashboard shows your upcoming practices at a glance.

**What you'll see:**
- List of scheduled practices with dates
- Quick stats (total players, drills, etc.)
- Links to create new practices

<!-- Screenshot: Dashboard overview -->

---

## Managing Players

Navigate to **Players** to manage your team roster.

### Adding a Player

1. Click the **"Add Player"** button
2. Fill in the player details:
   - **Name** - Player's full name
   - **Jersey Number** - Their uniform number
   - **Position** - Primary position (e.g., Pitcher, Catcher, Infield)
   - **Status** - Active or Injured
3. Click **"Save"**

<!-- Screenshot: Add Player form -->

### Editing a Player

1. Find the player in the list
2. Click **"Edit"** next to their name
3. Update the information
4. Click **"Save"**

### Deleting a Player

1. Click **"Delete"** next to the player
2. Confirm the deletion

<!-- Screenshot: Player list with Edit/Delete buttons -->

---

## Managing Coaches

Navigate to **Coaches** to manage your coaching staff.

### Adding a Coach

1. Click **"Add Coach"**
2. Enter the coach's name and email
3. Click **"Save"**

Coaches can be assigned to specific drills or stations during practice planning.

<!-- Screenshot: Coaches page -->

---

## Managing Drills

Navigate to **Drills** to build your drill library.

### Adding a Drill

1. Click **"Add Drill"**
2. Fill in the drill details:
   - **Title** - Name of the drill
   - **Category** - Warmup, Hitting, Fielding, Pitching, Catching, Game IQ, or Games
   - **Description** - Detailed instructions (line breaks are preserved)
   - **Coach Notes** - Private notes for coaches
   - **Base Duration** - Default time in minutes
   - **Skill Level** - Beginner, Intermediate, or Advanced
   - **Location** - Where on the field (optional)
   - **Video URL** - Link to instructional video (YouTube, Google Drive, Vimeo, etc.)
   - **Equipment** - Select required equipment
3. Click **"Save"**

<!-- Screenshot: Add Drill form -->

### Filtering Drills

Use the category buttons at the top to filter drills:
- Click a category to show only those drills
- Click again to show all drills
- Use the search box to find drills by name or description

<!-- Screenshot: Drill library with category filters -->

### Viewing Drill Videos

1. Click **"Watch Video"** on any drill with a video link
2. The video will play in a popup
3. Supported platforms: YouTube, Google Drive, Vimeo, and direct video links

<!-- Screenshot: Video player popup -->

---

## Managing Equipment

Navigate to **Equipment** to track your inventory.

### Adding Equipment

1. Click **"Add Equipment"**
2. Enter the equipment name and quantity
3. Click **"Save"**

Equipment can be linked to drills to track what's needed for each activity.

<!-- Screenshot: Equipment page -->

---

## Creating a Practice

Navigate to **Practices** and click **"New Practice"**.

### Step 1: Basic Information

1. Select the **Date** for the practice
2. Set the **Total Duration** in minutes (e.g., 90 or 120)
3. Click **"Create Practice"**

<!-- Screenshot: New practice form -->

### Step 2: Take Attendance

After creating the practice, you'll see the attendance section:

1. Check the box next to each player who is present
2. Use **"Select All"** to mark everyone present
3. Use **"Clear All"** to uncheck everyone

Only players marked present will be included in groups and partner assignments.

<!-- Screenshot: Attendance check-in -->

### Step 3: Set Up Groups & Partners

The Groups & Partners section lets you create both simultaneously for different drill types.

**Creating Groups** (blue section):
1. Set the number of groups using the **"#"** input
2. Click **"Create"** to auto-assign present players
3. Use **"Balance"** to even out group sizes
4. **Drag and drop** players between groups to customize

**Creating Partners** (purple section):
1. Click **"Create"** to pair players (pairs of 2, with one trio if odd number)
2. **Drag and drop** players between partner pairs to customize

**You can have both groups AND partners active at the same time** - some drills can use groups while others use partners.

<!-- Screenshot: Group/Partner setup with drag-and-drop -->

---

## Editing a Practice

### Adding Drills to the Schedule

1. Open an existing practice
2. You'll see two columns:
   - **Left side**: Drill Library (available drills)
   - **Right side**: Practice Schedule (your planned drills)
3. **Hover over any drill** to see a tooltip with:
   - Category and skill level badges
   - Full description
   - Coach notes
   - Location
   - Video indicator (if available)
4. **Drag a drill** from the library to the schedule
5. Or click the **"+"** button on a drill to add it

Drills with videos show a small video icon next to the title.

<!-- Screenshot: Drill library and schedule side by side -->

### Editing a Drill in the Schedule

Click on any drill in your schedule to edit:

- **Duration** - Adjust the time for this instance
- **Coach(es)** - Assign one or more coaches
- **Groups** - Select which groups do this drill (blue buttons)
- **Partners** - Select which partners do this drill (purple buttons)
- **Notes** - Add practice-specific notes
- **Edit Players** - Click to open the drag-and-drop editor to customize player assignments for just this drill

**Assigning Groups or Partners:**
- Groups are shown in a blue section with "Select All" and "Clear" buttons
- Partners are shown in a purple section with "Select All" and "Clear" buttons
- You can select any combination of groups and/or partners

<!-- Screenshot: Drill edit modal with group and partner selection -->

### Reordering Drills

Drag and drop drills in your schedule to reorder them.

### Removing a Drill

Click the **"X"** or trash icon on a drill to remove it from the schedule.

### Time Tracking

The **Time Engine** at the top shows:
- Total practice time
- Time used by scheduled drills
- Remaining time
- Color indicator (green = plenty of time, yellow = getting low, red = over time)

<!-- Screenshot: Time engine display -->

---

## Using Groups & Partners

### Practice-Level Groups & Partners

The Groups & Partners panel has two separate sections that work independently:

**Groups Section** (blue):
- Use for team drills, stations, and activities with larger player groups
- Set the number of groups with the **"#"** input
- Click **"Create"** to auto-assign players
- Use **"Balance"** to even out group sizes
- Drag and drop players between groups to rebalance

**Partners Section** (purple):
- Use for pair drills, partner throwing, and activities requiring pairs
- Click **"Create"** to automatically pair players
- Creates pairs of 2, with one trio if there's an odd number
- Drag and drop players between partner pairs to change pairings

**Key Feature**: You can have both groups AND partners at the same time. This lets you assign some drills to groups and others to partners in the same practice.

<!-- Screenshot: Practice-level group and partner editor -->

### Per-Drill Player Changes

You can modify groups or partners for individual drills without affecting the practice-level assignments:

1. Click on a drill in your schedule
2. Select the groups and/or partners for this drill
3. Click **"Edit Groups for this Drill"**, **"Edit Partners for this Drill"**, or **"Edit Groups & Partners for this Drill"** (depending on what you selected)
4. **Drag and drop** players between groups/partners to customize
5. The editor shows:
   - Blue section for groups (if groups are selected)
   - Purple section for partners (if partners are selected)
6. Changes show **"✓ Modified for this drill"** indicator
7. Click **"Reset"** to restore original practice assignments

This is useful when certain drills need different groupings (e.g., skill-based matching for a specific drill).

<!-- Screenshot: Per-drill drag-and-drop editor -->

### Renaming Groups & Partners

Click on any group or partner name to rename it (e.g., "Group A" → "Infielders" or "Partner 1" → "Battery Pairs").

---

## Creating Rotations

Rotations allow multiple stations to run simultaneously with groups rotating through them.

### Adding a Rotation

1. In the practice editor, click **"Add Rotation"**
2. The Rotation Builder opens

<!-- Screenshot: Rotation Builder -->

### Setting Up Stations

1. Click **"Add Station"** to create a station
2. For each station:
   - **Name** - Give it a descriptive name (e.g., "Hitting Station")
   - **Drill(s)** - Select one or more drills (hover to see drill details)
   - **Duration** - Set time per drill
   - **Coach(es)** - Assign coaches
   - **Groups** - Select which groups visit this station

Drills with videos show a small video icon next to the dropdown.

<!-- Screenshot: Station configuration -->

### Matching Station Durations

For rotations to work smoothly, all stations should have the same duration. If durations don't match:

1. An **amber warning** appears showing each station's duration
2. Click **"Sync All to X min"** to set all stations to the longest duration
3. The system proportionally adjusts drill times when syncing multi-drill stations

This ensures groups rotate in sync without waiting.

<!-- Screenshot: Duration mismatch warning -->

### Rotation Modes

**Sequential Mode** (default):
- Groups rotate through all stations
- Total time = sum of all station durations
- Example: 3 stations × 10 min each = 30 min total

**Simultaneous Mode**:
- All stations run at the same time
- Groups stay at their assigned stations
- Total time = longest station duration
- Toggle this with the **"Simultaneous"** checkbox

<!-- Screenshot: Mode toggle -->

### Assigning Groups & Partners to Stations

Each station can have groups and/or partners assigned:

1. In the station settings, you'll see:
   - **Groups section** (blue) - Select which groups visit this station
   - **Partners section** (purple) - Select which partners visit this station
2. Use **"All"** to select all groups or partners
3. Use **"Clear"** to deselect all
4. Click individual buttons to toggle selection

<!-- Screenshot: Rotation station with group/partner assignment -->

### Editing Groups/Partners per Station

You can customize player assignments for individual stations:

1. Select groups and/or partners for the station
2. Click **"Edit Groups for this Station"**, **"Edit Partners for this Station"**, or **"Edit Groups & Partners for this Station"** (depending on what you selected)
3. **Drag and drop** players between groups/partners to customize
4. Click **"Save Changes"** to save your customizations
5. Stations with modified groups show a **"✎ Groups modified"** indicator
6. Click **"Reset"** to restore the original group assignments

This is useful when a specific station needs different player groupings (e.g., putting stronger players together at the hitting station).

<!-- Screenshot: Per-station group editor in rotation builder -->

### Summary Panel

The bottom of the Rotation Builder shows:
- Number of stations
- Total time
- Number of groups
- Number of coaches assigned

### Saving the Rotation

Click **"Add Rotation to Practice"** (or **"Save Changes"** when editing).

---

## Sharing the Coach View

The Coach View is a clean, shareable page showing the practice schedule.

### Accessing Coach View

From the practice editor:
1. Click **"View Schedule"** to open in a new tab
2. Or click **"Share"** to copy the URL to your clipboard

<!-- Screenshot: Share and View Schedule buttons -->

### What Coaches See

The Coach View displays:
- Practice date and total duration
- Number of players present
- Groups/Partners with player names listed
- Complete schedule with:
  - Start times
  - Drill names and durations
  - Coach assignments
  - Drill descriptions and coach notes
  - Video links (expandable)
  - Modified partner assignments (highlighted in amber)

<!-- Screenshot: Coach View page -->

### Sharing the Link

Copy the URL and share via:
- Text message
- Email
- Team messaging apps (Slack, GroupMe, etc.)

Anyone with the link can view the schedule - no login required.

---

## Copying a Practice

Save time by duplicating an existing practice as a starting point.

### How to Copy a Practice

1. Navigate to **Practices**
2. Find the practice you want to copy
3. Click the **"Copy"** button
4. Select a new date in the dialog
5. Click **"Copy Practice"**

### What Gets Copied

- All scheduled drills and their order
- Drill durations and coach assignments
- Rotations and station configurations
- Group/Partner structure

### What Gets Reset

- Attendance is cleared (you'll need to check in players again)
- Practice status starts as draft

This is useful for recurring practice formats or when you want to use a previous practice as a template.

<!-- Screenshot: Copy Practice dialog -->

---

## Metrics Dashboard

Navigate to **Metrics** to view analytics about your practices and players.

### Time Range Filters

Use the buttons at the top to filter data:
- **Week** - Last 7 days
- **Month** - Last 30 days
- **Season** - All practices

### Player Attendance

View attendance statistics for each player:
- Bar chart showing attendance percentage
- Color-coded bars (green for high attendance, yellow/red for lower)
- Present count vs total practices

### Drill Categories

See how practice time is distributed:
- Pie chart showing category breakdown
- Minutes spent on each drill category
- Percentage of total practice time

### Summary Statistics

Quick stats at a glance:
- Total practices in the selected period
- Average attendance percentage
- Total practice minutes
- Most-used drill category

<!-- Screenshot: Metrics Dashboard -->

---

## Finalizing a Practice

Mark practices as complete when they're done.

### How to Finalize

1. Navigate to **Practices**
2. Find the practice to finalize
3. Click the **"Finalize"** button
4. The status changes from active to completed

### Practice Statuses

- **Draft** - Practice is being planned
- **Active** - Practice is ready or in progress
- **Completed** - Practice has been finalized

Completed practices are included in the Metrics Dashboard analytics.

<!-- Screenshot: Finalize button on practices list -->

---

## Tips & Best Practices

### Planning Efficient Practices

1. **Start with warmups** - Add 10-15 minutes of dynamic stretching
2. **Use rotations** - Keep players engaged at multiple stations
3. **Add water breaks** - Schedule 5-minute breaks every 20-30 minutes
4. **End with games** - Fun competitive drills to close practice

### Managing Large Rosters

1. Create **both** groups and partners at the start of practice
2. Use **Partners** (purple) for individual skill work and pair drills
3. Use **Groups** (blue, 4-6 players) for team drills and stations
4. **Drag and drop** players between groups/partners to balance teams
5. Adjust groupings based on attendance each practice
6. Use per-drill editing to customize for specific skill-based activities

### Using Videos Effectively

1. Add YouTube links to drill descriptions
2. Coaches can show videos on phones/tablets during practice
3. Players can review videos before practice

### Keeping Drills Organized

1. Use consistent categories
2. Add detailed descriptions with step-by-step instructions
3. Include coach notes for teaching points
4. Track equipment needs for setup

---

## Troubleshooting

### Practice Won't Save

- Check for any incomplete required fields
- Ensure you have an internet connection
- Try refreshing the page

### Video Won't Play

- Ensure the video is set to "Anyone with the link can view" (for Google Drive)
- YouTube and Vimeo links should work automatically
- Try opening the video in a new tab using the link provided

### Groups Not Showing

- Make sure you've taken attendance first
- Groups are only created from present players
- Click "Create Groups" or "Create Partners" to set them up

### Navigation Not Working

- Clear your browser cache
- Try refreshing the page
- Check browser console for errors (F12 → Console)

---

## Need Help?

For issues or feature requests, contact your team administrator or check the project repository.

---

*Practice Planner - Built for softball coaches who want to run organized, efficient practices.*
