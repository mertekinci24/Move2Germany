# Move2Germany Configuration Guide

This guide explains how to update the task configuration without modifying code. All tasks, cities, modules, and time windows are defined in a single JSON file.

## Configuration File Location

**File:** `/config/move2germany_tasks_v1.json`

This JSON file contains all the data-driven configuration for the application.

## Configuration Structure

The configuration file has four main sections:

### 1. Cities
Defines the available cities in Germany.

```json
{
  "cities": [
    {
      "id": "berlin",
      "name": "Berlin"
    }
  ]
}
```

**Fields:**
- `id` (string): Unique identifier (lowercase, no spaces)
- `name` (string): Display name

### 2. Time Windows
Defines the timeline phases for task organization.

```json
{
  "timeWindows": [
    {
      "id": "pre_arrival",
      "label": "Pre-arrival (0–3 ay önce)"
    }
  ]
}
```

**Fields:**
- `id` (string): Unique identifier (snake_case)
- `label` (string): Display name with description

**Existing Time Windows:**
- `pre_arrival` - Before arriving in Germany
- `week_1` - First week
- `weeks_2_4` - Weeks 2-4
- `month_2` - Second month
- `month_3` - Third month

### 3. Modules
Defines the main categories of tasks.

```json
{
  "modules": [
    {
      "id": "housing",
      "label": "Konut"
    }
  ]
}
```

**Fields:**
- `id` (string): Unique identifier (lowercase)
- `label` (string): Display name

**Existing Modules:**
- `housing` - Accommodation tasks
- `bureaucracy` - Administrative tasks
- `work` - Employment tasks
- `social` - Social integration tasks

### 4. Tasks
Defines individual tasks with all their properties.

```json
{
  "tasks": [
    {
      "id": "task_anmeldung",
      "timeWindow": "week_1",
      "module": "bureaucracy",
      "title": "Anmeldung (Resident Registration)",
      "description": "Register your address at the local registration office within 14 days",
      "dependencies": [],
      "importance": "critical",
      "repeat": "once",
      "cityScope": ["berlin", "munich", "frankfurt"],
      "cityNote": "In Berlin, book appointment online at least 2 weeks in advance",
      "contentKey": "anmeldung"
    }
  ]
}
```

**Required Fields:**
- `id` (string): Unique task identifier
- `timeWindow` (string): One of the timeWindow IDs
- `module` (string): One of the module IDs
- `title` (string): Task title
- `description` (string): Detailed description
- `dependencies` (array): Array of task IDs that must be completed first
- `importance` (string): `critical`, `high`, or `medium`
- `repeat` (string): `once` or `recurring`
- `cityScope` (array): Array of city IDs where this task applies

**Optional Fields:**
- `cityNote` (string): City-specific notes or variations
- `contentKey` (string): Reference key for AI assistant content lookup

---

## How to Add a New City

1. Open `/config/move2germany_tasks_v1.json`
2. Add a new entry to the `cities` array:

```json
{
  "id": "cologne",
  "name": "Cologne"
}
```

3. Update relevant tasks to include the new city in their `cityScope`:

```json
{
  "id": "task_anmeldung",
  "cityScope": ["berlin", "munich", "frankfurt", "cologne"]
}
```

4. Optionally, add city-specific notes:

```json
{
  "id": "task_anmeldung",
  "cityNote": "Berlin: book online | Cologne: walk-in accepted"
}
```

5. Save the file
6. Run `npm run build`
7. Deploy the updated application

---

## How to Add a New Task

1. Open `/config/move2germany_tasks_v1.json`
2. Add a new object to the `tasks` array:

```json
{
  "id": "task_tax_id",
  "timeWindow": "weeks_2_4",
  "module": "bureaucracy",
  "title": "Apply for Tax ID (Steuer-ID)",
  "description": "Request your German tax identification number from the tax office. You'll need this for employment.",
  "dependencies": ["task_anmeldung"],
  "importance": "high",
  "repeat": "once",
  "cityScope": ["berlin", "munich", "frankfurt", "hamburg", "aachen"],
  "cityNote": "Tax ID is automatically sent after Anmeldung in most cities",
  "contentKey": "tax_id"
}
```

3. If this task depends on other tasks, add their IDs to the `dependencies` array
4. Save the file
5. Run `npm run build`
6. Deploy

---

## How to Add a New Module

1. Open `/config/move2germany_tasks_v1.json`
2. Add a new entry to the `modules` array:

```json
{
  "id": "healthcare",
  "label": "Healthcare"
}
```

3. Update TypeScript types (if needed):
   - Edit `/src/lib/config.ts`
   - Update the `Module` type definition:

```typescript
export type Module = {
  id: 'housing' | 'bureaucracy' | 'work' | 'social' | 'healthcare';
  label: string;
};
```

4. Create tasks for the new module
5. Update the sidebar navigation if needed (`src/components/layout/Sidebar.tsx`)
6. Run `npm run build`
7. Deploy

---

## How to Modify Task Properties

### Change Task Importance

```json
{
  "id": "task_health_insurance",
  "importance": "critical"
}
```

Options: `critical`, `high`, `medium`

### Add Dependencies

```json
{
  "id": "task_bank_account",
  "dependencies": ["task_anmeldung", "task_residence_permit"]
}
```

The UI will show warnings if dependencies aren't completed yet.

### Update City Scope

```json
{
  "id": "task_mvg_ticket",
  "cityScope": ["munich"]
}
```

Task will only appear for users who selected Munich as their city.

### Change Time Window

```json
{
  "id": "task_find_apartment",
  "timeWindow": "pre_arrival"
}
```

Task will appear in the corresponding timeline phase.

---

## Best Practices

### Task IDs
- Use descriptive, unique IDs
- Format: `task_[descriptive_name]`
- Examples: `task_anmeldung`, `task_health_insurance`, `task_open_bank_account`

### Descriptions
- Be clear and actionable
- Include what, where, when, and how
- Add links to official resources when relevant
- Mention required documents

### Dependencies
- Only add dependencies that are truly required
- Keep dependency chains short (max 2-3 levels)
- Test that dependency warnings work correctly

### City Scope
- Include all cities where the task is relevant
- Use `cityNote` for city-specific variations
- If a task is universal, include all cities

### Importance Levels
- **Critical:** Must be done, has legal consequences or deadlines
- **High:** Very important, significantly impacts quality of life
- **Medium:** Important but can be delayed if needed

---

## Validation After Changes

After editing the configuration file, always:

1. **Validate JSON syntax:**
   ```bash
   cat config/move2germany_tasks_v1.json | jq .
   ```

2. **Run tests:**
   ```bash
   npm run test:run
   ```

3. **Type check:**
   ```bash
   npm run typecheck
   ```

4. **Build:**
   ```bash
   npm run build
   ```

5. **Test in browser:**
   - Check that new cities appear in the city selector
   - Verify new tasks show up in the correct module
   - Test task filtering by city, module, and time window
   - Verify dependencies display correctly

---

## Deployment Process

1. Make changes to `move2germany_tasks_v1.json`
2. Validate and test locally
3. Commit changes:
   ```bash
   git add config/move2germany_tasks_v1.json
   git commit -m "Add new tasks for [city/module]"
   ```
4. Push to repository
5. Deploy to production

**Note:** Configuration changes take effect immediately after deployment. No code changes required!

---

## AI Assistant Integration

### Content Keys

The `contentKey` field links tasks to the AI assistant's knowledge base.

**Existing content keys:**
- `anmeldung` - Resident registration info
- `health_insurance` - Health insurance providers
- `minijob` - Part-time work regulations
- `housing_scams` - How to avoid rental scams

### Adding New Content

To add AI assistant content for a new task:

1. Add the task with a `contentKey`:
```json
{
  "id": "task_tax_id",
  "contentKey": "tax_id"
}
```

2. Edit `/src/lib/ai.ts`, function `openContentTool`:
```typescript
const contentMap: Record<string, string> = {
  'tax_id': 'Tax ID: Automatically issued after Anmeldung. Link: https://...',
  // ... other entries
};
```

3. Rebuild and deploy

---

## Troubleshooting

### Task Not Appearing
- Check `cityScope` - task might not be available for selected city
- Verify `timeWindow` - task might be in a different phase
- Check `module` - task might be in a different category

### Dependency Warnings Not Working
- Verify dependency task IDs exist
- Check that the config loader is working: `configLoader.getTask(taskId)`

### TypeScript Errors
- Make sure all string literals match type definitions
- Valid time windows: `pre_arrival`, `week_1`, `weeks_2_4`, `month_2`, `month_3`
- Valid modules: `housing`, `bureaucracy`, `work`, `social`
- Valid importance: `critical`, `high`, `medium`

### JSON Syntax Errors
- Use a JSON validator
- Check for missing commas
- Verify all brackets and braces are balanced
- Remove trailing commas (not valid in JSON)

---

## Example: Complete Task Addition

Here's a full example of adding a new task:

```json
{
  "id": "task_german_course",
  "timeWindow": "month_2",
  "module": "social",
  "title": "Enroll in German Language Course",
  "description": "Register for an integration course (Integrationskurs) at the Volkshochschule or a private language school. Courses are subsidized for residents.",
  "dependencies": ["task_anmeldung", "task_residence_permit"],
  "importance": "high",
  "repeat": "once",
  "cityScope": ["berlin", "munich", "frankfurt", "hamburg", "aachen"],
  "cityNote": "Berlin: Apply for course voucher (Berechtigungsschein) at BAMF office",
  "contentKey": "german_course"
}
```

This task:
- Appears in the "Social" module
- Shows up in the second month timeline
- Requires Anmeldung and residence permit first
- Is available in all cities
- Has a Berlin-specific note
- Can be linked to AI assistant content

---

## Support

For questions or issues with configuration:
1. Check the validation report: `VALIDATION_REPORT.md`
2. Review existing tasks for examples
3. Test changes locally before deploying
4. Consult the architecture documentation: `ARCHITECTURE.md`

**Remember:** Configuration changes are immediate and don't require code changes. Always test thoroughly before deploying to production!
