StudyFlow 📚
A responsive study-session tracker that helps students plan their learning, monitor progress, and keep their study data private.

Built with: React, Vite, Tailwind CSS, Supabase Authentication, PostgreSQL, Row Level Security (RLS), and Lucide icons. Deployed using Vercel.

Repository: https://github.com/masayaseen1/studyflow
Live demo: Add your exact Vercel deployment URL here.

Features
- Email/password sign-up, sign-in, and sign-out using Supabase Auth.
- Create, view, edit, and delete study sessions.
- Record a subject, date, duration (in minutes), and status (Planned or Completed).
- Mark sessions complete or switch them back to planned.
- Search by subject and filter by status.
- View total sessions, completed sessions, hours studied, and completion percentage.
- Responsive dashboard with form validation and loading/error feedback.
- Store sessions in PostgreSQL instead of browser local storage.
- Isolate each user's records with Supabase Row Level Security.
Tech stack
Layer	Technology
Frontend	React, Vite, JavaScript, Tailwind CSS
UI icons	lucide-react
Authentication	Supabase Auth
Database	Supabase PostgreSQL
Data access	Supabase JavaScript client
Authorization	PostgreSQL Row Level Security policies
Hosting	Vercel


Getting started
1. Clone and install
git clone https://github.com/masayaseen1/studyflow.git
cd studyflow
npm install
2. Configure Supabase
Create a Supabase project and a public.study_sessions table with the following fields:
Column	Type	Notes
id	uuid	Primary key; default gen_random_uuid()
user_id	uuid	Required; references auth.users(id)
subject	text	Required
session_date	date	Required
duration	integer	Required, positive
status	text	Planned or Completed
created_at	timestamptz	Default now()


Enable RLS on the table and create authenticated-user policies for SELECT, INSERT, UPDATE, and DELETE, each scoped to auth.uid() = user_id. The insert policy should use WITH CHECK; update should use both USING and WITH CHECK.
Do not disable RLS to make the application work. The frontend uses a publishable key; access control must be enforced in the database.

3. Environment variables
Create .env.local in the project root:
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
Keep .env.local in .gitignore. Never place a Supabase secret key or service-role key in frontend code. Note that VITE_ variables are bundled into browser code and are not secret.
4. Run locally
npm run dev
Open the local URL shown by Vite. For a production build:
npm run build
npm run preview
How it works
1. The user signs up or signs in using Supabase Auth.
2. The React app loads study sessions through the Supabase JavaScript client.
3. Adding or editing a session writes directly to PostgreSQL.
4. RLS policies ensure users can only access their own sessions.
5. The dashboard calculates progress statistics from the loaded sessions.
Deployment
The project is deployed on Vercel from the GitHub repository. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel's Environment Variables before deploying. In Supabase Auth URL Configuration, set the appropriate Site URL and redirect URLs for your deployed domain if required by your authentication flow.
Future improvements
- Password reset flow and clearer authentication feedback.
- Automated tests for authentication and CRUD workflows.
- Weekly study analytics and accessibility improvements.
Author
Masa Yaseen
