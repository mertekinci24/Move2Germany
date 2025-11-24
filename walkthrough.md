# V5.4 Housing Copilot Upgrade Walkthrough

## Overview
This upgrade implements the "Enterprise Subtask Model" to enhance the Housing Copilot capabilities. It introduces a more robust data model for subtasks, enabling personalized housing criteria, external action tracking, and user-defined subtasks.

## Changes

### Database
- **New Table**: `user_subtasks` for storing user-created subtasks.
- **New Column**: `metadata` (JSONB) in `user_tasks` for storing task-specific data (e.g., housing criteria, action progress).
- **RLS**: Policies added for `user_subtasks`.

### Configuration & Types
- **`TaskSubtask`**: Updated to a discriminated union supporting:
    - `simple`: Standard checkboxes.
    - `linked_task`: References to other tasks.
    - `form_criteria`: Data input forms (e.g., max rent, min size).
    - `external_action`: External platform actions (e.g., signups).

### Logic
- **Status Calculation**: `computeTaskStatusOnChange` now accounts for:
    - `form_criteria` completion (all fields filled).
    - `external_action` completion (at least one provider actioned).
- **Housing URL Generation**: `generateHousingUrl` now uses `metadata` to inject user criteria (max rent, min size) into provider URLs.

### UI Components
- **`SubtaskList`**: Refactored to render the new subtask types.
- **`SubtaskEditor`**: New component allowing users to add/edit/delete their own subtasks.
- **`ActionBlock`**: Updated to use `metadata` for generating personalized housing links.

## Verification

### Automated Tests
- **Subtask Creation**: Verified optimistic updates and error handling with unit tests.
- **i18n**: Verified keys are present and correctly used.
- **RLS**: Verified policies allow users to manage their own subtasks.

### Automated Tests
- `npm test src/components/tasks/SubtaskEditor.test.tsx`: Passed (3 tests)

### Manual Verification Steps
1.  **Housing Task**: Open "Find Housing" task.
2.  **Criteria**: Fill in "Max Rent" and "Min Size".
3.  **Links**: Verify that "Search on WG-Gesucht" link includes the city code and criteria.
4.  **Subtasks**: Add a custom subtask "Call landlord". Verify it persists.
5.  **Status**: Verify task moves to "In Progress" when criteria are added.
