# ExamPulse - Competitive Exam Preparation Platform

## Project Overview
ExamPulse is a comprehensive exam preparation platform for Indian competitive exams (UPSC, SSC, Railway, Banking, etc.). The application provides:
- Daily current affairs articles (AI-summarized for exam relevance)
- NCERT study materials
- Previous year papers
- AI-generated mock tests
- Doubt clearance with AI assistance
- User progress tracking and bookmarks

## Architecture
- **Frontend**: React + TypeScript + Vite
- **UI Framework**: Radix UI + Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL database, Auth, Storage, Edge Functions)
- **AI Integration**: Lovable AI API for test generation, news summarization, and doubt assistance

## Tech Stack
- React 18.3.1
- TypeScript 5.8.3
- Vite 5.4.19
- React Router 6.30.1
- TanStack Query 5.83.0
- Supabase 2.75.0
- Tailwind CSS 3.4.17
- Radix UI components
- Zod for validation

## Project Structure
```
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── admin/       # Admin dashboard components
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts (Auth)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # Supabase client and types
│   ├── lib/             # Utility functions
│   └── pages/           # Route pages
├── supabase/
│   ├── functions/       # Edge Functions (AI services)
│   └── migrations/      # Database migrations
└── public/              # Static assets
```

## Key Features
1. **Authentication**: Supabase Auth with email/password
2. **Current Affairs**: Daily news fetched from NewsAPI and summarized with AI
3. **Study Materials**: NCERT PDFs and content management
4. **Test System**: 
   - AI-generated mock tests
   - Previous year papers
   - Timed test taking
   - Result analysis with explanations
5. **Admin Panel**: Content management, banner uploads, notifications
6. **User Features**: Bookmarks, download history, test attempts tracking

## Environment Configuration
The project requires the following environment variables (already configured):
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Supabase anonymous key
- `VITE_SUPABASE_PROJECT_ID`: Supabase project ID

## Database Schema
See `supabase/migrations/` for complete database schema including:
- User profiles and roles
- Articles and bookmarks
- NCERT content
- Mock tests and questions
- Test attempts and user answers
- Subscriptions and wallet
- Admin settings

## Development Workflow
1. The app runs on port 5000 (configured for Replit webview)
2. Vite dev server with hot module replacement
3. Supabase handles all backend operations
4. Edge Functions provide AI capabilities

## Recent Changes (Nov 15, 2025)
- Migrated from Lovable to Replit environment
- Updated Vite config to use port 5000 with host 0.0.0.0
- Configured workflow for Replit webview
- All dependencies installed and verified

## Important Notes
- This project uses Supabase as the backend (not a local database)
- The Supabase project is already set up with migrations
- Edge Functions require LOVABLE_API_KEY to be set in Supabase
- Admin features require user to have 'admin' role in user_roles table
