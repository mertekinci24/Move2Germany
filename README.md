# Move2Germany Enterprise Complete (v1.0.0)

A comprehensive web application to help international students and young expats navigate their first 90 days in Germany. The platform provides a personalized task management system, AI assistance, and structured guidance across Housing, Bureaucracy, Work, and Social modules.

## Overview

Move2Germany helps newcomers to Germany manage the complex process of settling in by providing:

- **Personalized 90-day roadmap** based on city, arrival date, and personal circumstances
- **Task management system** with dependencies and status tracking
- **AI Assistant** for answering questions and helping with bureaucratic processes
- **Document management** for organizing important paperwork
- **City-specific guidance** for Aachen, Berlin, Munich, Frankfurt, and Hamburg
- **Multi-module approach** covering Housing, Bureaucracy, Work, and Social integration

## Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Tailwind CSS** for responsive, modern UI design
- **Lucide React** for consistent iconography

### Backend & Infrastructure
- **Supabase** for:
  - PostgreSQL database with Row Level Security (RLS)
  - Authentication and user management
  - File storage for documents
  - Real-time capabilities
- **Google Gemini 2.0 Flash** for AI assistant functionality

### Architecture
- **Configuration-driven** task system using JSON
- **Modular component structure** for maintainability
- **Type-safe** with comprehensive TypeScript interfaces
- **Secure by default** with RLS policies and input validation

## Prerequisites

- **Node.js** 18+ and npm
- **Supabase account** (free tier works)
- **Google AI API key** (Gemini)

## Installation

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

**Getting Supabase Credentials:**
1. Create a project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your Project URL and anon/public key

**Getting Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env` file

### 3. Data Ingestion (Enterprise Knowledge Base)

Initialize the AI knowledge base with the latest research data:

```bash
npm run ingest
```

### 4. Database Setup

The database schema is already applied via Supabase migrations. The following tables are created:

- `users` - User accounts and profiles
- `user_tasks` - Task status and user notes
- `documents` - Uploaded document metadata
- `ai_conversations` - AI chat history
- `ai_messages` - Individual AI messages
- `audit_logs` - System event tracking

### 4. Storage Setup

A storage bucket named `documents` has been created for file uploads. It's configured to:
- Accept PDF, JPG, and PNG files only
- Enforce a 10MB file size limit
- Use signed URLs for secure access

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## Project Structure

```
/src
  /components
    /auth         - Login and signup forms
    /ai           - AI chat interface
    /layout       - Sidebar, topbar, layout components
    /onboarding   - Onboarding wizard
    /tasks        - Task cards and detail views
    /views        - Main application views (Overview, Module, Settings)
  /contexts       - React contexts (Auth)
  /lib            - Core business logic
    auth.ts       - Authentication functions
    supabase.ts   - Supabase client setup
    config.ts     - JSON configuration loader
    tasks.ts      - Task management logic
    documents.ts  - Document upload/management
    ai.ts         - AI assistant integration
  App.tsx         - Main application component
  main.tsx        - Application entry point

/config
  move2germany_tasks_v1.json - Task configuration file
```

## Configuration System

Tasks are managed through the `config/move2germany_tasks_v1.json` file. This allows adding new cities, tasks, and modules without code changes.

### Task Structure

```json
{
  "id": "unique-task-id",
  "timeWindow": "pre_arrival",
  "module": "housing",
  "title": "Task title",
  "description": "Detailed description",
  "dependencies": ["other-task-id"],
  "importance": "critical",
  "repeat": "once",
  "cityScope": ["berlin", "munich"],
  "cityNote": "City-specific information"
}
```

### Adding New Tasks

1. Edit `config/move2germany_tasks_v1.json`
2. Add your task following the structure above
3. Restart the development server
4. Tasks will be available immediately

### Time Windows

- `pre_arrival` - 0-3 months before arrival
- `week_1` - First week in Germany
- `weeks_2_4` - Weeks 2-4
- `month_2` - Second month
- `month_3` - Third month

### Modules

- `housing` - Finding and securing accommodation
- `bureaucracy` - Registration, insurance, banking
- `work` - Job searching and employment
- `social` - Building social connections

## Features

### 1. Authentication
- Secure email/password authentication
- Password hashing with SHA-256
- Session management
- Account deletion with data cleanup

### 2. Onboarding
- Two-step wizard for gathering user information
- City selection from 5 major German cities
- Persona type (student/worker)
- German language level
- Budget range

### 3. Task Management
- Task filtering by city, time window, and module
- Status tracking (To Do, In Progress, Done, Blocked)
- Dependency management
- User notes and custom due dates
- Progress visualization

### 4. Document Management
- Secure file upload (PDF, JPG, PNG)
- 10MB file size limit
- Association with specific tasks
- Signed URLs for secure access
- Easy deletion

### 5. AI Assistant
- Context-aware assistance
- Access to user's task data
- Tools for task management
- General information about German bureaucracy
- Important: Provides information only, not legal advice

### 6. Dashboard Views
- **Overview**: Summary stats and critical tasks
- **Module Views**: Filtered by Housing, Bureaucracy, Work, or Social
- **Settings**: Profile management and account settings

## Security

### Authentication
- Passwords hashed with SHA-256
- Session-based authentication using sessionStorage
- Secure password reset flow

### Database Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Restrictive policies by default

### File Upload Security
- MIME type validation
- File size limits
- Signed URLs with expiration
- Server-side validation

### GDPR Compliance
- User data export capability
- Account deletion with full data removal
- Soft deletes for audit trails
- EU-based data storage (Supabase EU region)

## Assumptions & Limitations

### V1 Scope Assumptions

1. **Authentication**: Simple email/password authentication is sufficient for V1. Social logins and 2FA are not implemented.

2. **AI Assistant**: Uses basic tool calling without advanced function calling. The AI provides general information only and explicitly avoids legal advice.

3. **Task Initialization**: Critical tasks are automatically created for users during onboarding. Other tasks are created on-demand when accessed.

4. **Document Storage**: Uses Supabase Storage. Files are not virus-scanned in V1 (planned for future versions).

5. **Notifications**: No email or push notifications in V1. Users must manually check the dashboard.

6. **Multi-language**: UI is in English/Turkish. Task content is currently in Turkish only.

7. **Mobile**: Responsive web design only. Native iOS/Android apps are out of scope for V1.

8. **Collaboration**: Single-user accounts only. No family/roommate collaboration features.

9. **External Integrations**: No direct integrations with government APIs, banks, or other external services.

10. **Content Management**: Task content is JSON-based. No CMS for non-technical content updates.

### Known Limitations

- Password hashing uses SHA-256 instead of bcrypt/argon2 for simplicity (should be upgraded for production)
- No email verification flow (users can sign up with any email)
- No rate limiting on AI assistant calls
- No caching strategy for frequently accessed data
- Search is client-side only (could be slow with large datasets)
- No analytics dashboard for admins
- No content versioning system

## Future Enhancements

### Planned for V2
- Email verification and password reset via email
- Real-time notifications
- Advanced AI capabilities with function calling
- Admin dashboard for content management
- Multi-language support (German, English, Turkish)
- Mobile native apps
- Integration with calendar apps
- Community features (forums, peer support)

### Considerations
- Payment integration for premium features
- Partnerships with service providers
- Automated document verification
- Video tutorials and guides
- Professional advisor marketplace

## Contributing

This is a V1 product built for initial validation. Contributions should focus on:

1. Bug fixes and security improvements
2. Documentation improvements
3. Accessibility enhancements
4. Performance optimizations
5. Test coverage

## License

This project is private and proprietary. All rights reserved.

## Support

For issues or questions:
1. Check this README
2. Review the code comments
3. Check Supabase dashboard for database issues
4. Verify environment variables are set correctly

## Deployment

### Production Build

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deployment Options

**Recommended: Vercel**
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

**Alternative: Netlify, Cloudflare Pages, or any static host**

### Environment Variables for Production

Ensure these are set in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GEMINI_API_KEY`

### Database Migrations

Database schema is already applied via Supabase. For future migrations:
1. Use Supabase dashboard or CLI
2. Apply migrations in development first
3. Test thoroughly before production
4. Always backup before migrations

## Troubleshooting

### Common Issues

**"Missing Supabase environment variables"**
- Verify `.env` file exists and contains correct values
- Restart development server after changing `.env`

**"Failed to load tasks"**
- Check browser console for errors
- Verify Supabase connection
- Check RLS policies are correctly set

**"AI Assistant not responding"**
- Verify Gemini API key is valid
- Check browser console for API errors
- Ensure you're not exceeding API rate limits

**"Document upload failing"**
- Verify file size is under 10MB
- Check file type is PDF, JPG, or PNG
- Ensure storage bucket exists in Supabase

**"Authentication errors"**
- Clear browser sessionStorage
- Check database for user record
- Verify RLS policies on users table

## Credits

Built as a comprehensive SaaS-quality application following enterprise best practices for architecture, security, and user experience.

## Multi-Language Support (i18n)

Move2Germany supports **4 languages** with full internationalization:

### Supported Languages:
- **English (en)** - Full UI and content translations
- **Türkçe (tr)** - Full UI and content translations  
- **العربية (ar)** - Full UI translations with RTL support
- **Deutsch (de)** - Infrastructure ready (not visible in UI yet)

### Language Selection:
Users can switch languages via the language switcher in the top-right corner (globe icon).

**Language Detection Priority:**
1. User profile locale (if logged in)
2. Browser `lang` cookie
3. Browser language preference
4. Default: English

### RTL Support:
Arabic is fully supported with right-to-left (RTL) layout:
- Automatic `dir="rtl"` attribute on HTML element
- CSS adjustments for spacing and text alignment
- Proper icon and button positioning

### Translation Files:
- **UI Translations:** `src/locales/{en,tr,ar,de}.json`
- **Task Content:** `src/locales/tasks.{en,tr,ar,de}.json`

### Fallback Strategy:
- **Arabic:** Falls back to English for task content
- **German:** Falls back to English (UI not visible yet)
- **Missing keys:** Display the translation key itself

### Adding New Languages:
1. Create translation files: `src/locales/{locale}.json` and `src/locales/tasks.{locale}.json`
2. Add locale to `SUPPORTED_LOCALES` in `src/lib/i18n.ts`
3. Add locale to `VISIBLE_LOCALES` (if user-selectable)
4. Add locale metadata in `localeMeta` object
5. Rebuild application: `npm run build`

