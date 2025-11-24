# V5.2 Task & Subtask Model – Analysis & Design

## 1. Analysis of Current System

### Identified Issues

#### 1. Canonical Task Duplication
*   **Task**: `kira-oda-ilanlarini-takip-et`
*   **Subtask**: `prepare_documents` ("Başvuru belgelerini hazırlayın...")
*   **Issue**: This subtask is a textual duplicate of the top-level task `basvuru-belgelerini-hazirla`.
*   **Impact**: Completing the top-level task does not update this subtask. Users must check off both, leading to confusion and data inconsistency.

#### 2. Data-Dependent Subtasks (The "Checkbox Illusion")
*   **Task**: `kira-oda-ilanlarini-takip-et`
*   **Subtask**: `define_budget` ("Bütçenizi ve kriterlerinizi belirleyin")
*   **Issue**: Represented as a simple checkbox. The system requires this data (max rent, room type) to generate effective housing links, but currently has no way to capture it within the task context.
*   **Impact**: Housing links are generic (city-only), reducing the "Copilot" value.

#### 3. Action-Oriented Subtasks without Actions
*   **Task**: `kira-oda-ilanlarini-takip-et`
*   **Subtask**: `create_accounts` ("Konut platformlarında hesap oluşturun")
*   **Issue**: Instructs the user to create accounts but provides no direct links or tracking for specific platforms (WG-Gesucht, ImmoScout24, etc.).
*   **Impact**: Friction in the user journey. We have this data in `housing_providers.json` but aren't using it here.

#### 4. Lack of User Subtasks
*   **Issue**: Users cannot add their own granular to-do items to a task.
*   **Impact**: Limits the tool's flexibility for personal workflows.

---

## 2. Design – Enterprise Task & Subtask Model

### Data Model

#### Subtask Types
We will introduce a discriminated union for subtasks to handle different behaviors.

```typescript
export type SubtaskType = 'simple' | 'linked_task' | 'form_criteria' | 'external_action';

export interface BaseSubtask {
  id: string;
  type: SubtaskType;
  title_key: string; // i18n key
  required?: boolean;
  personas?: string[]; // e.g. ['student', 'worker']
}

// 1. Simple Checkbox (System or User)
export interface SimpleSubtask extends BaseSubtask {
  type: 'simple';
}

// 2. Linked Task (Canonical Reference)
export interface LinkedTaskSubtask extends BaseSubtask {
  type: 'linked_task';
  linkedTaskId: string; // ID of the top-level task
}

// 3. Form Criteria (Data Input)
export interface FormCriteriaSubtask extends BaseSubtask {
  type: 'form_criteria';
  criteriaKey: 'housing_preferences' | 'job_preferences'; // Maps to a schema
  fields: string[]; // e.g. ['maxRent', 'roomType', 'minSize']
}

// 4. External Action (e.g. Platform Signup)
export interface ExternalActionSubtask extends BaseSubtask {
  type: 'external_action';
  actionType: 'housing_platform_signup';
  providers?: string[]; // e.g. ['wg_gesucht', 'immoscout24']
}

export type TaskSubtask = SimpleSubtask | LinkedTaskSubtask | FormCriteriaSubtask | ExternalActionSubtask;
```

#### User Subtasks Storage
**Decision**: Store user subtasks in a new `user_subtasks` table.
*   **Justification**:
    *   **Cleanliness**: Separates user content from system config.
    *   **Scalability**: Easier to query, index, and migrate than a growing JSON blob.
    *   **RLS**: Standard Row Level Security policies apply.

**Table Schema (`user_subtasks`)**:
*   `id`: uuid (PK)
*   `user_id`: uuid (FK)
*   `task_id`: string (FK to config task ID)
*   `title`: text
*   `is_completed`: boolean
*   `created_at`: timestamp
*   `order`: integer

#### Housing Criteria Storage
**Decision**: Store criteria in `user_tasks.metadata` (new JSONB column).
*   **Choice**: `user_tasks.metadata` for task-specific criteria (like specific housing filters for *this* search phase).
*   **Schema**:
    ```json
    {
      "housing_criteria": {
        "maxRent": 1200,
        "roomType": "apartment",
        "minSize": 40
      }
    }
    ```

### Logic & Behavior

#### 1. Status Logic (`computeTaskStatusOnChange`)
*   **Todo -> In Progress**:
    *   Any subtask checked (system or user).
    *   Criteria form updated.
    *   Note/Document added.
*   **In Progress -> Done**:
    *   All *required* system subtasks completed.
    *   Linked tasks must be `done`.
    *   (Optional) User subtasks don't block `done` but show a warning if incomplete.

#### 2. Linked Tasks
*   Rendered as a subtask row but with a "Link" icon.
*   Clicking navigates to that task.
*   Status reflects the linked task's status (read-only in the parent list).
*   Checking it in the parent list is disabled; must complete the linked task itself.

#### 3. Housing Platform Accounts
*   Rendered as a list of providers (fetched from `housing_providers.json`).
*   Each provider has a "Sign Up" button (link) and a "Created" checkbox.
*   The parent subtask is complete when all required (or at least one?) provider is checked.

#### 4. Persona Awareness
*   Config: Add `personas: ['student', 'worker']` to `Task` and `TaskSubtask`.
*   Filtering: `getVisibleSubtasksForUser(task, userPersona)` filters out irrelevant items.

### Implementation Plan

1.  **Database**:
    *   Create `user_subtasks` table.
    *   Add `metadata` column to `user_tasks`.
2.  **Config**:
    *   Update `TaskSubtask` type definition.
    *   Refactor `kira-oda-ilanlarini-takip-et` in JSON to use new types.
3.  **Logic**:
    *   Update `tasks.ts` to fetch/merge user subtasks.
    *   Update status logic.
4.  **UI**:
    *   Refactor `SubtaskList` to handle discriminated union types.
    *   Add "Add Subtask" button.
    *   Render inputs for `form_criteria`.

## 3. STATE OF TASK ENGINE (V5.2)
*   **Current Subtasks**: Simple `{ id, title, required }` objects in config.
*   **Storage**: `user_tasks.subtask_progress` (JSONB) stores `{ "subtaskId": boolean }`.
*   **Logic**: `computeTaskStatusOnChange` checks if all required subtasks are true.
*   **Housing**:
    *   `kira-oda-ilanlarini-takip-et` has text-based subtasks that duplicate other tasks or imply actions without links.
    *   Housing links are generated in `ActionBlock` but not tied to subtasks.
*   **Goal for V5.3**: Implement the Enterprise Model defined above, starting with Housing.

---

## 4. STATE OF JOURNEY ENGINE (V5.2)

### Current Implementation
*   **Time Windows**: Represented as simple `{ id, label }` objects in `src/lib/config.ts`.
*   **Phases**: Hardcoded IDs: `pre_arrival`, `week_1`, `weeks_2_4`, `month_2`, `month_3`.
*   **Selection**: Manual selection via dropdown in `TopBar`. No automatic selection based on arrival date.
*   **Ordering**: Hardcoded `timeWindowOrder` map in `OverviewView.tsx`.
*   **Persona**: `personaType` exists in `users` table and `UserProfile` type, but is **not used** for task filtering. All users see all tasks.

### Limitations
*   **Static Experience**: Users must manually change phases, reducing the "Copilot" feel.
*   **Information Overload**: Users see tasks irrelevant to their persona (e.g., students seeing family reunion tasks).
*   **Hardcoded Logic**: Phase ordering and logic are scattered in components (`OverviewView`).

---

## 5. V5.3 Journey & Persona Engine – Design

### A. Journey Phase Engine

#### 1. Configuration (`src/config/journey_phases_v1.json`)
Centralized definition of phases to replace hardcoded lists.
```json
[
  {
    "id": "pre_arrival",
    "order": 1,
    "minDaysFromArrival": -999,
    "maxDaysFromArrival": 0,
    "labelKey": "timeWindows.pre_arrival"
  },
  {
    "id": "week_1",
    "order": 2,
    "minDaysFromArrival": 1,
    "maxDaysFromArrival": 7,
    "labelKey": "timeWindows.week_1"
  }
  // ...
]
```

#### 2. Logic (`src/lib/journey.ts`)
*   `computeCurrentPhase(arrivalDate: string | null, now: Date = new Date()): JourneyPhase`
    *   Calculates days diff between `now` and `arrivalDate`.
    *   Finds matching phase from config.
    *   Fallbacks: `pre_arrival` if no arrival date or future; last phase if past all ranges.

#### 3. UI Integration
*   **App Initialization**: On load, `App.tsx` computes `currentPhase` and sets it as the default `selectedTimeWindow`.
*   **Phase Change Toast**:
    *   On app load, compare computed `currentPhase.id` with `localStorage.getItem('last_journey_phase_id')`.
    *   If different, show `sonner` toast: "Welcome to [Phase Name]! We've updated your tasks."
    *   Update `localStorage`.

### B. Persona Engine v1

#### 1. Configuration
*   Update `Task` and `TaskSubtask` types in `src/lib/config.ts`:
    ```typescript
    export type Task = {
      // ...
      personas?: string[]; // e.g. ["student", "worker"]
    };
    ```

#### 2. Filtering Logic (`src/lib/tasks.ts`)
*   Update `configLoader.filterTasks` and `getTasksWithStatus`:
    *   Accept `personaType` (from `user.personaType`).
    *   Logic:
        *   If `task.personas` is missing or empty -> **Show**.
        *   If `task.personas` has values -> **Show only if** `user.personaType` is in the list.
*   **Subtasks**: Filter subtasks in UI components (`TaskDetail`, `TaskCard`) using a helper `isSubtaskVisible(subtask, userPersona)`.

### C. Implementation Notes
*   **Storage**: Using `localStorage` for "last seen phase" to avoid DB schema migration for this version.
*   **i18n**: All new strings (toast messages, phase labels) added to `locales/*.json`.
*   **Tests**:
    *   Unit tests for `computeCurrentPhase` (edge cases: null date, exact boundary days).
    *   Integration tests for persona filtering in `configLoader`.

## 6. V5.3 Implementation Status (Completed)

### Delivered Features
*   **Journey Phase Engine**:
    *   Centralized configuration in `src/config/journey_phases_v1.json`.
    *   Automatic phase calculation based on arrival date (`src/lib/journey.ts`).
    *   UI integration in `OverviewView` and `ModuleView`.
    *   One-time "New Phase Unlocked" toast notification.
*   **Persona Engine v1**:
    *   `personas` field added to `Task` and `TaskSubtask`.
    *   Filtering logic implemented in `ConfigLoader` and `getTasksWithStatus`.
    *   UI now filters tasks based on user's selected persona (Student/Professional).
*   **i18n & UX**:
    *   Full translations for Journey and Persona features in `en.json`, `tr.json`, `ar.json`.
    *   Phase indicator added to Overview page header.

### Verification
*   **Automated Tests**: `npm test` passed (Journey logic, Config loader, Task filtering).
*   **Manual Verification**: Verified UI rendering and phase transitions.

## 7. V5.4 Implementation Status (Completed)

### Delivered Features
*   **Enterprise Subtask Model**:
    *   `user_subtasks` table created with RLS policies.
    *   `metadata` column added to `user_tasks` for storing criteria and action progress.
    *   `TaskSubtask` discriminated union types implemented (`simple`, `linked_task`, `form_criteria`, `external_action`).
*   **Housing Copilot Upgrade**:
    *   `SubtaskList` refactored to render new subtask types.
    *   `SubtaskEditor` implemented for user-defined subtasks.
    *   `ActionBlock` updated to generate personalized housing links using `metadata` (criteria).
    *   Status logic updated to handle `form_criteria` and `external_action` completion.
*   **Verification**:
    *   Unit tests added for status logic (`tasks.test.ts`) and housing URL generation (`housing.test.ts`).
    *   All tests passing.
