# Family Calendar & Event System - Technical Design

**Date:** 2026-05-04  
**Issue:** HER-27  
**Status:** Draft

---

## Overview

A shared calendar system for family members to create events, set recurrence patterns, and view Hebrew date labels on each day. Events are public to all family members by default.

---

## Design Decisions

### Calendar Library Choice

**Decision:** Custom lightweight implementation with CSS grid + `@hebcal/core` for Hebrew date conversion.

**Rationale:**
- Hebrew date labels on every cell is a hard requirement
- Existing libraries (FullCalendar, react-big-calendar) are built around Gregorian dates
- Custom grid gives full control over cell rendering
- ~60-70% faster than customizing a library for Hebrew dates

**Note:** Reconsider this choice after initial implementation once we have clearer understanding of the effort involved. If Hebrew date integration proves more complex than expected, evaluate library customization vs. continued custom build.

---

## Data Models

### Prisma Schema

```prisma
// Event model
model CalendarEvent {
  id          String   @id @default(cuid())
  title       String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  
  // Timing
  startDate   DateTime
  endDate     DateTime?
  isAllDay    Boolean  @default(false)
  
  // Recurrence
  recurrence  RecurrenceType @default(NONE)
  recurrencePattern RecurrencePattern?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Recurrence pattern (one-to-one with events that have recurrence)
model RecurrencePattern {
  id              String       @id @default(cuid())
  eventId         String       @unique
  event           CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  frequency       RecurrenceFrequency
  interval        Int          @default(1)
  daysOfWeek      Int[]        // 0-6 for Sunday-Saturday
  dayOfMonth      Int?         // 1-31
  endCondition    RecurrenceEnd?
  endDate         DateTime?
  endOccurrences  Int?
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}

enum RecurrenceFrequency {
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
}

enum RecurrenceEnd {
  NEVER
  AFTER_OCCURRENCES
  ON_DATE
}

enum RecurrenceType {
  NONE
  DAILY
  WEEKLY
  MONTHLY
  YEARLY
  CUSTOM
}
```

### User Model Extension

The existing User model needs no changes. Events are linked via `ownerId`.

---

## API Contracts

### Base Path: `/api/calendar`

#### GET /events

Fetch events for a date range.

**Query Params:**
- `start` (required): ISO 8601 date string
- `end` (required): ISO 8601 date string

**Response:**
```json
{
  "events": [
    {
      "id": "evt_...",
      "title": "Birthday Party",
      "description": "John's birthday",
      "ownerId": "user_...",
      "startDate": "2026-05-15T18:00:00Z",
      "endDate": "2026-05-15T22:00:00Z",
      "isAllDay": false,
      "recurrence": "NONE",
      "createdAt": "2026-05-01T10:00:00Z",
      "updatedAt": "2026-05-01T10:00:00Z"
    }
  ]
}
```

#### POST /events

Create a new event.

**Body:**
```json
{
  "title": "Birthday Party",
  "description": "John's birthday",
  "startDate": "2026-05-15T18:00:00Z",
  "endDate": "2026-05-15T22:00:00Z",
  "isAllDay": false,
  "recurrence": "YEARLY",
  "recurrencePattern": {
    "frequency": "YEARLY",
    "interval": 1
  }
}
```

**Response:** `201 Created` with event object

#### GET /events/:id

Get a single event by ID.

**Response:** Event object or `404 Not Found`

#### PUT /events/:id

Update an event.

**Body:** Same as POST (partial update supported)

**Response:** Updated event object

#### DELETE /events/:id

Delete an event.

**Response:** `204 No Content`

#### GET /occurrences

Fetch expanded occurrences for recurring events within a date range.

**Query Params:**
- `start` (required): ISO 8601 date string
- `end` (required): ISO 8601 date string

**Response:**
```json
{
  "occurrences": [
    {
      "eventId": "evt_...",
      "title": "Birthday Party",
      "startDate": "2026-05-15T18:00:00Z",
      "endDate": "2026-05-15T22:00:00Z",
      "isAllDay": false,
      "isRecurring": true
    }
  ]
}
```

#### GET /hebrew-dates

Batch Hebrew date conversion for calendar cells.

**Query Params:**
- `dates` (required): Comma-separated ISO 8601 date strings

**Response:**
```json
{
  "hebrewDates": {
    "2026-05-01": "14 Iyar 5786",
    "2026-05-02": "15 Iyar 5786",
    "2026-05-03": "16 Iyar 5786"
  }
}
```

---

## UI Components

### Directory Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── calendar/
│           └── page.tsx          # Main calendar page
├── components/
│   └── calendar/
│       ├── CalendarGrid.tsx      # 7-column grid layout
│       ├── CalendarHeader.tsx    # Month nav, view toggle
│       ├── CalendarDay.tsx       # Day cell with Hebrew date
│       ├── CalendarEvent.tsx     # Event chip component
│       ├── EventModal.tsx        # Create/edit modal
│       └── RecurrencePicker.tsx  # Recurrence settings
└── lib/
    └── hebrew-date.ts            # Hebrew date utilities
```

### Component Responsibilities

**CalendarGrid.tsx**
- Renders 7-column CSS grid
- Handles month view rendering
- Computes day positions (padding days for month start)

**CalendarHeader.tsx**
- Month/year display
- Previous/Next navigation
- Today button
- View mode toggle (Month/Week/Day - future)

**CalendarDay.tsx**
- Renders individual day cell
- Displays Gregorian date number
- Displays Hebrew date label (small, below)
- Highlights today
- Handles click to create event

**CalendarEvent.tsx**
- Renders event chip/badge within day cell
- Color-coded by owner
- Truncated title with tooltip
- Click to view/edit

**EventModal.tsx**
- Form for create/edit
- Fields: title, description, start/end datetime, all-day toggle
- Recurrence settings toggle
- Delete button (edit mode)

**RecurrencePicker.tsx**
- Frequency selector (Daily/Weekly/Monthly/Yearly)
- Interval input (every N weeks/months)
- Day of week selector (for Weekly)
- End condition selector (Never/After N/On date)

---

## Implementation Phases

### Phase 1: Core Calendar (MVP)
- [ ] Prisma schema migration
- [ ] API routes for CRUD
- [ ] Calendar grid with Hebrew dates
- [ ] Event create/edit/delete
- [ ] Month navigation

### Phase 2: Recurrence
- [ ] Recurrence pattern UI
- [ ] Occurrence expansion logic
- [ ] Edit recurring event options (this/single/all)

### Phase 3: Polish (Future)
- [ ] External calendar sync
- [ ] Reminders/notifications
- [ ] Week/Day views
- [ ] Drag-and-drop rescheduling

---

## Technical Notes

### Hebrew Date Integration

Using `@hebcal/core` package:

```typescript
import { HDate } from '@hebcal/core';

function getHebrewDateLabel(date: Date): string {
  const hDate = new HDate(date);
  return hDate.toString(); // e.g., "14 Iyar 5786"
}
```

### Recurrence Expansion

For displaying recurring events, expand patterns on-the-fly when fetching for a date range:

```typescript
function expandRecurrence(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): Occurrence[] {
  // Generate occurrences based on pattern
  // Return array of { eventId, startDate, endDate, isAllDay }
}
```

### CSS Grid Layout

```css
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}

.calendar-day {
  min-height: 120px;
  background: white;
  border: 1px solid #e5e7eb;
}
```

---

## Security Considerations

1. **Authentication Required:** All calendar API routes require valid NextAuth session
2. **Ownership Validation:** Users can only edit/delete their own events
3. **Input Sanitization:** All user input sanitized before database insertion

---

## Testing Strategy

- Unit tests for recurrence expansion logic
- Component tests for CalendarDay (Hebrew date rendering)
- API integration tests for CRUD operations
- E2E test for create → view → edit → delete flow
