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

### Step 3: Set Up Groups/Partners

If you want to use groups or partners for drills:

1. Click **"Create Groups"** or **"Create Partners"**
2. **Groups** - Divides players into larger groups (3-6 players each)
3. **Partners** - Pairs players together (2 players each, with trios if odd number)
4. Choose the number of groups/partners
5. Click **"Generate"** to auto-assign players
6. Drag and drop players between groups to customize

<!-- Screenshot: Group/Partner setup -->

---

## Editing a Practice

### Adding Drills to the Schedule

1. Open an existing practice
2. You'll see two columns:
   - **Left side**: Drill Library (available drills)
   - **Right side**: Practice Schedule (your planned drills)
3. **Drag a drill** from the library to the schedule
4. Or click the **"+"** button on a drill to add it

<!-- Screenshot: Drill library and schedule side by side -->

### Editing a Drill in the Schedule

Click on any drill in your schedule to edit:

- **Duration** - Adjust the time for this instance
- **Coach(es)** - Assign one or more coaches
- **Groups** - Select which groups do this drill
- **Notes** - Add practice-specific notes
- **Change Partners** - Modify partner assignments for just this drill

<!-- Screenshot: Drill edit modal -->

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

### Practice-Level Groups

Groups set at the practice level apply to all drills by default.

1. In the practice editor, find the **Groups/Partners** section
2. Click **"Create Groups"** or **"Create Partners"**
3. Set the number of groups
4. Click **"Generate"** to auto-assign present players
5. Drag players between groups to customize

<!-- Screenshot: Practice-level group editor -->

### Per-Drill Partner Changes

You can modify partners for individual drills:

1. Click on a drill in your schedule
2. Click **"Change Partners for this Drill"**
3. Move players between groups using the dropdown menus
4. Drills with modified partners show a **"✎ modified"** badge
5. Click **"Reset to Practice Partners"** to undo changes

This is useful when certain drills need different pairings (e.g., skill-based matching).

<!-- Screenshot: Per-drill partner editor -->

### Renaming Groups

Click on a group name to rename it (e.g., "Group A" → "Infielders").

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
   - **Drill(s)** - Select one or more drills
   - **Duration** - Set time per drill
   - **Coach(es)** - Assign coaches
   - **Groups** - Select which groups visit this station

<!-- Screenshot: Station configuration -->

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

### Modifying Partners for Rotations

1. Click **"Change Partners for this Rotation"**
2. Drag and drop players between groups
3. These modified groups will be used for station assignments
4. You can also rename groups here

<!-- Screenshot: Rotation partner editor with drag-and-drop -->

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

## Tips & Best Practices

### Planning Efficient Practices

1. **Start with warmups** - Add 10-15 minutes of dynamic stretching
2. **Use rotations** - Keep players engaged at multiple stations
3. **Add water breaks** - Schedule 5-minute breaks every 20-30 minutes
4. **End with games** - Fun competitive drills to close practice

### Managing Large Rosters

1. Use **Partners mode** for individual skill work
2. Use **Groups mode** (4-6 players) for team drills
3. Adjust groups based on attendance each practice

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
