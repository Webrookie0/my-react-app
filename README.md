# InfluencerConnect - React Chat App with Supabase

A complete real-time chat application for connecting with influencers. Uses React for the frontend and Supabase for the backend.

## Quick Start Guide

### 1. Create a Supabase Project

1. Go to [Supabase.com](https://supabase.com/) and sign up
2. Click "New Project" to create a new project
3. Name your project "InfluencerConnect" (or any name)
4. Set a database password (save it somewhere secure)
5. Choose a region close to you
6. Click "Create new project"

### 2. Set Up Database Schema

1. After your project is created, go to the SQL Editor
2. Copy the contents of the `supabase/admin.sql` file from this project
3. Paste it into a new query in the SQL Editor and run it
4. This creates necessary helper functions for setup

### 3. Configure Environment Variables

1. Open the file `my-react-app/.env`
2. Replace the placeholder values with your actual Supabase credentials:
   - `REACT_APP_SUPABASE_URL`: Your Project URL from Project Settings > API
   - `REACT_APP_SUPABASE_ANON_KEY`: Your anon/public key from Project Settings > API > Project API keys

```
# Example (replace with your actual values)
REACT_APP_SUPABASE_URL=https://abcdefghijklm.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3Mi...
```

### 4. Start the Application

1. Open a terminal in your project directory
2. Run these commands:

```bash
# Install dependencies
npm install

# Start the app
npm start
```

3. Your browser should open to http://localhost:3000

## Demo Users

The app automatically creates these demo users:

- Username: `demo_user`, Email: `demo@example.com` 
- Username: `influencer1`, Email: `influencer1@example.com`
- Username: `influencer2`, Email: `influencer2@example.com`

You can register your own account or use these demo accounts for testing.

## Disabling Email Confirmation

For easier testing, the setup disables email confirmation requirements. If you see "Email not confirmed" errors, go to:

1. Supabase Dashboard > Authentication > Settings
2. Uncheck "Enable email confirmations"
3. Save changes

## Troubleshooting

### Connection Error
- Double-check your Supabase URL and anon key in the `.env` file
- Make sure your Supabase project is active
- Check if you've run the `admin.sql` file in the SQL Editor

### Auth Issues
- Ensure email confirmation is disabled in your Supabase settings
- Try registering with a new account
- Check the browser console for specific error messages

## Features

- Real-time messaging
- User authentication
- User profiles
- Search for influencers
- User presence indicators
- Message read receipts
- Responsive design

## Tech Stack

- **Frontend**:
  - React for UI components
  - Tailwind CSS for styling
  - Framer Motion for animations
  - Supabase JS client for data and auth

- **Backend**:
  - Supabase for authentication
  - PostgreSQL database (via Supabase)
  - Supabase Realtime for live chat updates
  - Row-Level Security for data protection

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account (free tier available)

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Create a new project
3. Note your Supabase URL and anon key (available in Settings > API)

### 2. Set Up Database Tables

1. In your Supabase project, go to the SQL Editor
2. Copy and paste the contents of `supabase/schema.sql` from this repo
3. Run the SQL script to create the necessary tables and policies

### 3. Configure the Application

1. Clone this repository:
```bash
git clone https://github.com/yourusername/influencer-connect.git
cd influencer-connect
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Supabase credentials:
```
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Update the Supabase configuration in `src/supabase.js` with your project details:
```javascript
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
```

### 4. Run the Application

Start the development server:
```bash
npm start
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Using the Chat Feature

1. **Sign Up**: Create a new account or use one of the demo accounts
2. **Add Demo Users**: Click the "Add Demo Users" button on the home page to populate the database
3. **Navigate to Chat**: Click on the Chat section in the dashboard
4. **Find Users**: Use the search bar to find other users or browse the list
5. **Start Chatting**: Click on a user to start a conversation
6. **Send Messages**: Type your message and click "Send" - both users will see the message instantly

## Demo Accounts

The application comes with demo accounts that you can use:

- **Username**: fashion_influencer
- **Password**: password123

- **Username**: tech_reviewer
- **Password**: password123

## Deployment

To deploy this application:

1. Build the React app:
```bash
npm run build
```

2. Deploy the built files to your favorite hosting platform:
   - Vercel
   - Netlify
   - Firebase Hosting
   - GitHub Pages
   
## License

This project is licensed under the MIT License.

## Acknowledgements

- [React](https://reactjs.org/)
- [Supabase](https://supabase.com)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
