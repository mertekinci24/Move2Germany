# Quick Start Guide

Get Move2Germany up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)
- A Google AI API key (Gemini)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose the EU region for GDPR compliance
3. Wait for the project to be provisioned (~2 minutes)

### Get Your Credentials

1. Go to Project Settings > API
2. Copy your **Project URL** and **anon/public key**

The database schema has already been applied via migrations.

## Step 3: Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API key"
3. Copy the generated key

## Step 4: Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

## Step 5: Start Development Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

## Step 6: Create Your First Account

1. Click "Sign up"
2. Enter email and password (min 8 characters)
3. Complete the onboarding wizard
4. Explore the dashboard

## Verify Everything Works

### Test Authentication
- [x] Can sign up
- [x] Can sign in
- [x] Can see dashboard

### Test Task Management
- [x] Can see tasks filtered by city
- [x] Can open task detail
- [x] Can change task status
- [x] Can add notes

### Test Document Upload
- [x] Can upload a PDF/image
- [x] Can see uploaded documents
- [x] Can delete documents

### Test AI Assistant
- [x] Click the AI button (bottom right)
- [x] Ask: "What critical tasks should I do first?"
- [x] Verify it responds with context-aware information

## Common Issues

### "Missing Supabase environment variables"
- Verify your `.env` file exists in project root
- Verify environment variables are prefixed with `VITE_`
- Restart the dev server

### "Failed to load tasks"
- Check browser console for errors
- Verify Supabase URL is correct
- Check if database migrations are applied

### "AI Assistant not responding"
- Verify Gemini API key is valid
- Check browser console for API errors
- Ensure you're not hitting rate limits

### Documents won't upload
- Verify file is under 10MB
- Check file type (PDF, JPG, PNG only)
- Verify storage bucket was created in Supabase

## Next Steps

- Read [README.md](./README.md) for full documentation
- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details
- Explore the configuration system in `config/move2germany_tasks_v1.json`
- Try adding new tasks to the JSON file

## Development Tips

### Hot Module Replacement
Vite supports HMR. Changes to React components update instantly without page reload.

### Type Checking
Run type check without starting the server:
```bash
npm run typecheck
```

### Building for Production
```bash
npm run build
npm run preview  # Preview production build locally
```

### Inspecting the Database
1. Go to your Supabase dashboard
2. Click "Table Editor"
3. Browse `users`, `user_tasks`, `documents`, etc.

### Viewing Logs
- Browser console for frontend errors
- Supabase dashboard > Database > Logs for backend errors
- Audit logs table for user actions

## Customization Quick Reference

### Add a New City
Edit `config/move2germany_tasks_v1.json`:
```json
{
  "cities": [
    ...existing,
    {"id": "cologne", "name": "Cologne"}
  ]
}
```

### Add a New Task
```json
{
  "tasks": [
    ...existing,
    {
      "id": "new-task-id",
      "timeWindow": "week_1",
      "module": "housing",
      "title": "Your task title",
      "description": "Task description",
      "dependencies": [],
      "importance": "high",
      "repeat": "once",
      "cityScope": ["berlin", "munich"]
    }
  ]
}
```

### Change UI Colors
Edit `tailwind.config.js` to customize the color palette.

### Add New Module
1. Add to config JSON
2. Update Module type in `src/lib/config.ts`
3. Add icon in `src/components/layout/Sidebar.tsx`

## Support

For issues:
1. Check README troubleshooting section
2. Check browser console for errors
3. Check Supabase dashboard for database issues
4. Verify all environment variables are set

Happy coding! 🚀
