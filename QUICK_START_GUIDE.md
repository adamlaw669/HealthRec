# HealthRec Engine - Quick Start Guide 🚀

## Prerequisites
- Python 3.9+
- Node.js 16+
- pip and npm installed

## Backend Setup (5 minutes)

### 1. Navigate to Backend Directory
```bash
cd backend
```

### 2. Create Virtual Environment (Optional but Recommended)
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip3 install -r requirements.txt
```

### 4. Create Environment File
Create a file named `.env` or `data.env` in the `backend` directory:

```env
SECRET_KEY=your-secret-key-here-make-it-long-and-random
DEBUG=True
OPENAI_API_KEY=your-openai-api-key
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=http://localhost:3000/dashboard
DATABASE_URL=sqlite:///db.sqlite3
```

**Note**: Replace `your-openai-api-key` with your actual OpenAI API key from https://platform.openai.com/api-keys

### 5. Run Migrations
```bash
python3 manage.py migrate
```

### 6. Create Superuser (Optional)
```bash
python3 manage.py createsuperuser
```

### 7. Start Backend Server
```bash
python3 manage.py runserver
```

Backend will run at: **http://127.0.0.1:8000**

---

## Frontend Setup (3 minutes)

### 1. Navigate to Frontend Directory (New Terminal)
```bash
cd frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

Frontend will run at: **http://localhost:3000**

---

## Access the Application

1. Open your browser and go to: **http://localhost:3000**
2. You'll see the landing page
3. Click "Get Started" or navigate to **http://localhost:3000/auth**
4. Create an account or sign in with Google

---

## Features to Try

### 1. Basic Authentication
- Sign up with email/password
- Try the demo account (if you create one)

### 2. Dashboard
- View health metrics
- See AI-generated recommendations
- View weekly summaries

### 3. Health Interpreter (Purple Brain Button)
- Click the purple brain button at bottom-right
- Type health metrics like "My blood pressure is 120/80"
- Get instant AI analysis

### 4. Add Metrics (Blue Plus Button)
- Click the blue plus button at bottom-right
- Add steps, sleep, heart rate, weight, etc.
- View updated charts

### 5. Dark Mode
- Toggle dark mode using the moon/sun icon at top-right
- Settings persist across sessions

---

## Troubleshooting

### Backend Issues

#### "Django is not installed"
```bash
pip3 install django djangorestframework
```

#### "No module named 'dotenv'"
```bash
pip3 install python-dotenv python-decouple
```

#### Port 8000 already in use
```bash
python3 manage.py runserver 8080
# Then update VITE_API_URL in frontend to http://localhost:8080
```

### Frontend Issues

#### "Cannot find module"
```bash
npm install
npm run dev
```

#### Port 3000 already in use
The dev server will automatically try port 3001, 3002, etc.

#### "Failed to fetch" errors
- Make sure backend is running on port 8000
- Check that CORS is properly configured

---

## Testing the Application

### Test Basic Features
1. ✅ Sign up with email
2. ✅ View dashboard
3. ✅ Add a metric
4. ✅ View charts
5. ✅ Toggle dark mode
6. ✅ Use Health Interpreter

### Test Google OAuth (Requires Setup)
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add redirect URI: `http://localhost:3000/dashboard`
4. Update credentials.json
5. Try "Continue with Google"

---

## API Endpoints

Backend API runs at: `http://127.0.0.1:8000`

### Test Endpoints

#### Health Check
```bash
curl http://127.0.0.1:8000/csrf-cookie/
```

#### Get Health Facts (requires auth)
```bash
curl -X POST http://127.0.0.1:8000/HealthFacts/ \
  -H "Content-Type: application/json" \
  -d '{"username": "your-username"}'
```

---

## Project Structure

```
HealthRec/
├── backend/          ← Django backend (port 8000)
│   ├── manage.py
│   ├── backend/      ← Settings
│   └── user/         ← Health app
│
└── frontend/         ← React frontend (port 3000)
    ├── app/          ← Pages & components
    ├── components/   ← UI components
    └── package.json
```

---

## Environment Variables Reference

### Backend (.env or data.env)
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| SECRET_KEY | Yes | Django secret key | random-50-char-string |
| DEBUG | No | Debug mode | True or False |
| OPENAI_API_KEY | Yes* | OpenAI API key | sk-... |
| GOOGLE_CLIENT_SECRET | No** | Google OAuth secret | GOCSPX-... |
| GOOGLE_REDIRECT_URI | No | OAuth redirect | http://localhost:3000/dashboard |
| DATABASE_URL | No | Database URL | sqlite:///db.sqlite3 |

\* Required for AI features
\*\* Required for Google OAuth

### Frontend (Usually not needed for local dev)
The frontend automatically uses `http://localhost:8000` for development.

---

## Next Steps

1. ✅ Application is running
2. 📝 Create your first account
3. 💪 Add some health metrics
4. 🤖 Get AI recommendations
5. 🧠 Try the Health Interpreter
6. 🎨 Customize in dark mode

---

## Getting Help

### Documentation
- See `REVITALIZATION_SUMMARY.md` for all changes made
- Check `README.md` for project overview

### Common Issues
1. **White screen**: Check browser console (F12)
2. **API errors**: Ensure backend is running
3. **No data**: Add metrics manually or connect Google Fit

### Need More Help?
- Check the browser console (F12) for errors
- Check the backend terminal for errors
- Ensure both servers are running

---

## Production Deployment

For production deployment:
1. Set `DEBUG=False` in backend .env
2. Configure proper PostgreSQL database
3. Set up proper domain and SSL
4. Update CORS and CSRF trusted origins
5. Run `npm run build` for frontend
6. Deploy to Netlify (frontend) and Render (backend)

See deployment documentation for detailed steps.

---

**Enjoy your HealthRec Engine! 🏥💙**

Last Updated: 2025-10-27
