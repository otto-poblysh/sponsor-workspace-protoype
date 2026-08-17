# Tutorial Video Storyboard: Labour Market Portal

This storyboard defines the visual compositions, motion design, and transitions required to produce the tutorial video in HyperFrames.

## Global Visual Settings
- **Base Resolution**: 1920x1080
- **Browser Window**: Clean, borderless browser mockup (no OS chrome or address bar).
- **Cursor**: Standard OS pointer. Cursor moves on an ease-in-out bezier curve, with a slight scale-down animation on clicks (0.9x scale for 100ms) and a subtle blue ping ring.
- **Subtitles**: Centered at the bottom (10% from bottom edge). 
  - Font: Geist Sans, Regular, 32px
  - Color: White text on a semi-transparent dark grey rounded pill background (`rgba(0,0,0,0.7)`).
- **Transitions**: Smooth 400ms cross-fades between major pages, unless a direct link click causes a simulated page load.

---

## Segment 1: Dashboard Overview & Filtering

### Frame 1.1: Introduction
- **Visual**: The `index.html` Dashboard page. Data is fully populated.
- **Cursor State**: Enters from the bottom-right corner, moving diagonally toward the center.
- **Subtitle**: "Welcome to the Labour Market Portal."

### Frame 1.2: KPI Highlight
- **Visual**: The top KPI cards. 
- **Cursor State**: Moves smoothly over the "Registered Employers" card (card border slightly darkens as per CSS hover state), then glides to "Active Vacancies".
- **Subtitle**: "Start by reviewing high-level national employment metrics."

### Frame 1.3: Interaction - Filtering
- **Visual**: The 'Sector' filter dropdown in the top header.
- **Cursor State**: Clicks the 'Sector' dropdown. The dropdown menu opens. Cursor moves down to 'Construction' and clicks it.
- **Subtitle**: "When you need to track sector-specific growth, filter the national dashboard in seconds."

### Frame 1.4: Results
- **Visual**: Simulated loading state (skeleton rows for 400ms), then the UI updates to show filtered metrics. 
- **Cursor State**: Moves slightly to the side to reveal the updated numbers.
- **Subtitle**: "The metrics instantly update to reflect your selected criteria."

---

## Segment 2: Verifying an Employer

### Frame 2.1: Navigation
- **Visual**: The left sidebar navigation menu.
- **Cursor State**: Moves to 'Registered Employers' (`entities.html`) and clicks.
- **Transition**: Page content area crossfades to the Entities list.
- **Subtitle**: "Managing company compliance is straightforward."

### Frame 2.2: Scanning the List
- **Visual**: The entities table. 
- **Cursor State**: Hovers over the row for "Annobón Eco Tours" (which has a yellow 'Pending' badge).
- **Subtitle**: "Locate new employer registrations that are pending review."

### Frame 2.3: Context Menu Action
- **Visual**: The table row action area.
- **Cursor State**: Clicks the three-dots context menu on the row. A small popover menu appears. Cursor clicks 'Verify Employer'. A confirmation modal (`<dialog>`) overlays the screen with a dark backdrop.
- **Subtitle**: "When reviewing new registrations, quickly verify employers to grant them reporting access."

### Frame 2.4: Confirmation
- **Visual**: The confirmation modal.
- **Cursor State**: Clicks the primary blue 'Confirm' button.
- **Transition**: Modal scales down and fades out. A green success toast slides in from the top-right corner.
- **Subtitle**: "The employer is now verified and notified automatically."

---

## Segment 3: Analyzing Skill Gaps

### Frame 3.1: Navigation
- **Visual**: The left sidebar navigation menu.
- **Cursor State**: Moves to 'Skill Gap Report' (`skill-gap.html`) and clicks.
- **Transition**: Page content area crossfades to the Skill Gap page.
- **Subtitle**: "Use the platform to inform your vocational training strategies."

### Frame 3.2: Chart Hover
- **Visual**: A horizontal bar chart displaying "Hard-to-fill roles".
- **Cursor State**: Moves over the longest bar (e.g., "Industrial Electrician"). A dark tooltip appears showing demand vs. supply numbers.
- **Subtitle**: "When planning training budgets, identify roles with high employer demand and low worker supply."

---

## Segment 4: Generating a Report

### Frame 4.1: Navigation
- **Visual**: The left sidebar navigation menu.
- **Cursor State**: Moves to 'Labour Market Reports' (`general-report.html`) and clicks.
- **Transition**: Page content area crossfades to the Reports configuration page.
- **Subtitle**: "Reporting is automated and always up-to-date."

### Frame 4.2: Configuration
- **Visual**: The report generation form.
- **Cursor State**: Clicks the card for 'Monthly Labour Summary'. Clicks the radio button for 'PDF'. Clicks the primary 'Generate Report' button.
- **Subtitle**: "When briefing leadership, generate comprehensive, standardized reports in minutes."

### Frame 4.3: Success State
- **Visual**: The 'Generate Report' button shows a loading spinner for 1 second, then turns green with a checkmark. A 'Download Ready' toast appears.
- **Cursor State**: Clicks the 'Download' link in the toast.
- **Subtitle**: "Your report is ready to share immediately."

---

## Segment 5: Auditing Activity

### Frame 5.1: Navigation
- **Visual**: The left sidebar navigation menu.
- **Cursor State**: Moves to 'Activity Logs' (`activity-logs.html`) and clicks.
- **Transition**: Page content area crossfades to the Activity Logs page.
- **Subtitle**: "Every action taken on the portal is securely recorded."

### Frame 5.2: Log Inspection
- **Visual**: A chronological list of system events.
- **Cursor State**: Scrolls the page slightly. Clicks on a specific row (e.g., "Status changed to Verified by Compliance Officer"). An accordion expands to show the exact timestamp, user IP, and payload data.
- **Subtitle**: "When maintaining oversight, trace every important action through immutable activity logs."

### Frame 5.3: Outro
- **Visual**: The expanded log row. 
- **Transition**: The browser window smoothly scales down and fades to black. A clean white Ministry of Labour logo fades in at the center.
- **Subtitle**: "Empowering smarter employment decisions."
- **Cursor State**: Fades out before the browser scales down.
