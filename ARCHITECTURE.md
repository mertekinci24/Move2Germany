# Move2Germany Architecture Documentation

## System Architecture

### High-Level Overview

Move2Germany V1 follows a modern web application architecture with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│         React Frontend (Vite)           │
│  ┌────────────────────────────────────┐ │
│  │      UI Components (Views)         │ │
│  └────────────────┬───────────────────┘ │
│  ┌────────────────┴───────────────────┐ │
│  │    Business Logic (lib/)           │ │
│  └────────────────┬───────────────────┘ │
└───────────────────┼─────────────────────┘
                    │
          ┌─────────┴─────────┐
          │                   │
    ┌─────▼──────┐    ┌──────▼─────┐
    │  Supabase  │    │  Google    │
    │  (PostgreSQL, │    │  Gemini AI │
    │   Storage,    │    │            │
    │   Auth)       │    │            │
    └───────────────┘    └────────────┘
```

## Layer Architecture

### 1. UI Layer (`/src/components`)

**Responsibility:** User interface rendering and interaction

**Sub-modules:**
- `auth/` - Authentication forms (login, signup)
- `layout/` - App shell components (sidebar, topbar)
- `onboarding/` - First-time user setup wizard
- `tasks/` - Task display and management UI
- `views/` - Main application screens
- `ai/` - AI chat interface

**Key Patterns:**
- Functional components with hooks
- Props for data passing
- Context API for global state (Auth)
- Event callbacks for user actions

### 2. Business Logic Layer (`/src/lib`)

**Responsibility:** Core application logic, data transformations, external service integration

**Modules:**

#### `config.ts` - Configuration Management
- Loads task matrix from JSON
- Provides filtering and querying capabilities
- In-memory caching for performance
- Type-safe configuration access

#### `auth.ts` - Authentication & User Management
- User registration and login
- Password hashing (SHA-256)
- Session management via sessionStorage
- Profile updates
- Account deletion (GDPR compliance)

#### `tasks.ts` - Task Management
- UserTask CRUD operations
- Task filtering and querying
- Dependency checking
- Status management
- Integration with config for task definitions

#### `documents.ts` - Document Storage
- File upload with validation
- Size and type checking
- Secure signed URLs
- Document deletion
- Association with tasks

#### `ai.ts` - AI Assistant
- Gemini 2.0 Flash integration
- Context-aware messaging
- Tool execution (listTasks, explainTask, updateTaskStatus, openContent)
- Conversation history management
- System prompt management

#### `supabase.ts` - Database Client
- Supabase client initialization
- Type definitions for database schema
- Shared client instance

### 3. Context Layer (`/src/contexts`)

**Responsibility:** Global state management

#### `AuthContext.tsx`
- Current user state
- Authentication actions (signIn, signUp, signOut)
- User refresh
- Loading state management

### 4. Configuration Layer (`/config`)

**Format:** JSON
**Purpose:** Declarative task definitions

**Structure:**
- `cities[]` - Supported cities
- `timeWindows[]` - 90-day timeline segments
- `modules[]` - Feature areas (Housing, Bureaucracy, Work, Social)
- `tasks[]` - Individual task definitions

**Benefits:**
- Non-engineers can update task content
- No code deployment needed for task changes
- Version control for task definitions
- Easy localization path

## Data Flow

### 1. User Authentication Flow

```
User Input → LoginForm
  → auth.signIn()
  → Supabase query (users table)
  → Password verification
  → Session storage
  → AuthContext update
  → UI re-render
```

### 2. Task Management Flow

```
User Action → TaskDetail component
  → tasks.updateUserTask()
  → Supabase update (user_tasks table)
  → Audit log entry
  → UI refresh
```

### 3. AI Assistant Flow

```
User Message → AiChat component
  → ai.sendMessage()
  → Create/retrieve conversation
  → Build context (user data, current page, task info)
  → Call Gemini API
  → Parse tool calls (if any)
  → Execute tool functions
  → Get AI response
  → Store message history
  → Display response
```

### 4. Document Upload Flow

```
File Selection → TaskDetail component
  → documents.uploadDocument()
  → Validate file type/size
  → Upload to Supabase Storage
  → Create document record in DB
  → Audit log entry
  → UI refresh with new document
```

## Security Architecture

### Authentication
- Password hashing with SHA-256 (note: should use bcrypt/argon2 for production)
- Session-based auth using sessionStorage
- No sensitive data in localStorage

### Authorization
- Row Level Security (RLS) on all Supabase tables
- Users can only access their own data
- Restrictive by default policies

### Data Protection
- All API calls require authentication
- File access via signed URLs (1-hour expiration)
- File type and size validation
- SQL injection protection via parameterized queries
- XSS protection via React's built-in escaping

### GDPR Compliance
- User data export capability
- Account deletion with cascade
- Soft deletes for audit trails
- EU-based data storage
- Audit logging for sensitive operations

## State Management

### Local Component State
- React useState for form inputs
- Component-specific UI state
- Temporary data (search queries, filters)

### Context State
- Authentication state (user object)
- Loading states
- Global user actions

### Server State
- Fetched on-demand from Supabase
- No client-side caching (relying on Supabase real-time)
- Refetch on mutation

### Configuration State
- Loaded once at import time
- In-memory cache
- Immutable at runtime

## Performance Considerations

### Current Implementation
- Code splitting at route level (via dynamic imports if added)
- Lazy loading of images
- Memoization where beneficial (can be added)
- Optimistic UI updates for task status changes

### Known Performance Limitations
- No pagination for tasks (will be slow with 1000+ tasks)
- No query result caching
- Search is client-side only
- All tasks loaded at once

### Future Optimizations
- Implement virtual scrolling for long lists
- Add React Query for server state management
- Implement progressive loading
- Add service worker for offline capability
- Optimize bundle size with tree shaking

## Extensibility Points

### Adding New Modules
1. Add module to `config/move2germany_tasks_v1.json`
2. No code changes needed
3. UI automatically includes new module

### Adding New Cities
1. Add city to config JSON
2. Add city-specific tasks with `cityScope`
3. No code changes needed

### Adding New Task Fields
1. Update JSON structure
2. Update TypeScript types in `config.ts`
3. Update UI components to display new fields

### Adding New AI Tools
1. Add tool definition to AI system prompt
2. Implement tool function in `ai.ts`
3. Add tool to executeTool switch statement

### Adding New Authentication Methods
1. Update `auth.ts` with new method
2. Add UI components
3. Update AuthContext if needed

## Technology Decisions

### Why Supabase?
- Rapid development (auth, DB, storage in one)
- Built-in RLS for security
- PostgreSQL for reliability
- EU hosting for GDPR
- Generous free tier

### Why Vite?
- Fast development experience
- Modern build tooling
- Excellent React support
- Small production bundles

### Why TypeScript?
- Type safety prevents bugs
- Better IDE support
- Self-documenting code
- Easier refactoring

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Small production CSS
- No naming conflicts

### Why JSON Config?
- Easy to edit by non-developers
- Version controlled
- No deployment for content changes
- Type-safe via code generation

### Why Gemini AI?
- Cost-effective compared to GPT-4
- Fast response times
- Good multilingual support
- Simple API

## Deployment Architecture

### Production Setup

```
┌──────────────┐
│   Vercel     │ ← React App (Static hosting)
│   (CDN)      │
└──────┬───────┘
       │
       ├─────────► Supabase (EU region)
       │           ├─ PostgreSQL
       │           ├─ Storage
       │           └─ Auth
       │
       └─────────► Google AI API
                   └─ Gemini 2.0 Flash
```

### Environment Variables
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key
- `VITE_GEMINI_API_KEY` - Google AI API key

### CI/CD
- Git push to main branch
- Vercel auto-deploys
- Environment variables managed in Vercel dashboard
- Database migrations managed in Supabase dashboard

## Error Handling Strategy

### UI Level
- Try-catch blocks in async functions
- Error state in components
- User-friendly error messages
- Loading states for async operations

### Service Level
- Throw typed errors
- Error logging to console
- Audit log for critical failures

### Database Level
- Supabase returns structured errors
- Transaction rollback on failure
- Constraint violations caught

## Testing Strategy (Future)

### Unit Tests
- Business logic in `lib/` modules
- Pure functions (config parsing, filtering)
- Utility functions

### Integration Tests
- Auth flows
- Task CRUD operations
- Document upload/delete
- AI conversation flows

### E2E Tests
- Complete user journeys
- Onboarding flow
- Task management
- AI interaction

## Monitoring & Observability (Future)

### Logging
- Structured JSON logs
- Audit logs for sensitive operations
- Error tracking (Sentry integration planned)

### Metrics
- User engagement
- Task completion rates
- AI usage patterns
- Error rates

### Performance
- Page load times
- API response times
- Database query performance

## Known Technical Debt

1. **Password Hashing**: Using SHA-256 instead of bcrypt/argon2
2. **No Email Verification**: Users can register with any email
3. **No Rate Limiting**: AI assistant calls unlimited
4. **Client-Side Search**: Should move to DB for large datasets
5. **No Caching**: Every request hits the database
6. **No Test Coverage**: Zero automated tests
7. **No Error Monitoring**: No Sentry or similar
8. **Hardcoded Locale**: UI strings not internationalized
9. **No Analytics**: No usage tracking
10. **Manual Migrations**: No automated migration system

## Future Architecture Improvements

### Short Term (V1.1)
- Add bcrypt for passwords
- Implement email verification
- Add rate limiting
- Basic error tracking

### Medium Term (V2.0)
- Add React Query for caching
- Implement proper i18n
- Add analytics
- Automated tests
- Admin dashboard

### Long Term (V3.0)
- Native mobile apps
- Real-time collaboration
- Advanced AI features
- Integration marketplace
- Multi-tenancy
