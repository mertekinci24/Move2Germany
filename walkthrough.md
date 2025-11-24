a# V5.3 Journey & Persona Engine - Walkthrough

## Overview
This update introduces the **Journey Phase Engine** and **Persona Engine v1**, transforming Move2Germany into a more dynamic and personalized copilot.

## Key Features

### 1. Journey Phase Engine
*   **Automatic Phase Detection**: The app now calculates your current journey phase (e.g., "Pre-arrival", "Week 1") based on your arrival date.
*   **Visual Indicator**: The current phase is displayed in the Overview header.
*   **Phase Change Notification**: Users receive a one-time toast notification when they enter a new phase.

### 2. Persona Engine v1
*   **Personalized Tasks**: Tasks can now be targeted to specific personas (e.g., "Student" or "Professional").
*   **Filtering**: Users only see tasks relevant to their selected persona, reducing clutter.

### 3. Internationalization (i18n)
*   Full support for English, Turkish, and Arabic for all new features.

## Verification

### Automated Tests
All unit and integration tests passed:
```bash
npm test
```
*   `src/lib/journey.test.ts`: Verified phase calculation logic.
*   `src/lib/config.test.ts`: Verified persona filtering logic.
*   `src/lib/tasks.test.ts`: Verified task fetching with filters.

### Manual Verification Checklist
- [x] **Journey Phase**:
    - [x] Set arrival date to various past/future dates.
    - [x] Verified correct phase is selected.
    - [x] Verified "New Phase" toast appears only once per phase change.
- [x] **Persona Filtering**:
    - [x] Verified "Student" users see student-specific tasks.
    - [x] Verified "Professional" users do not see student-only tasks.
- [x] **i18n**:
    - [x] Verified translations in English, Turkish, and Arabic.

## Configuration
*   **Journey Phases**: Defined in `src/config/journey_phases_v1.json`.
*   **Task Personas**: Defined in `src/config/move2germany_tasks_v1.json` (using `personas` field).
