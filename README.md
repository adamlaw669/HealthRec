# HealthRec Engine 🏥

An AI-powered health analytics platform that provides personalized recommendations for improving overall wellbeing by analyzing health metrics and patterns.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.9+-blue)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Django](https://img.shields.io/badge/Django-4.2+-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)

## Features 🌟

- **Smart Health Analytics**: AI-powered analysis of health metrics
- **Personalized Recommendations**: Actionable insights for improving wellbeing
- **Google Fit Integration**: Seamless sync with Google Fit data
- **Interactive Dashboard**: Real-time visualization of health trends
- **Dark Mode Support**: Comfortable viewing in any lighting condition

## Tech Stack 💻

- **Frontend**: React, TypeScript, TailwindCSS
- **Backend**: Django, Django REST Framework
- **AI/ML**: OpenAI GPT, HuggingFace Transformers
- **Database**: PostgreSQL
- **Authentication**: JWT, Google OAuth2

## Getting Started 🚀

### Prerequisites

- Python 3.9+
- Node.js 16+
- PostgreSQL
- Docker (optional)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/HealthRec.git
cd HealthRec
```

2. **Set up backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
```

3. **Configure environment variables**
```bash
# Create .env file in backend directory
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up frontend**
```bash
cd frontend
npm install
npm run dev
```

### Running Locally

1. **Start backend server**
```bash
cd backend
python manage.py runserver
```

2. **Start frontend development server**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Documentation 📚

- API Documentation
- Frontend Architecture
- Backend Architecture
- Contributing Guide

## Contributing 🤝

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📝

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments 🙏

- [Google Fit API](https://developers.google.com/fit)
- [OpenAI](https://openai.com/)
- [React Community](https://reactjs.org/community/support.html)

## Contact 📧


Project Link: https://github.com/adamlaw669/HealthRec

---

⭐️ If you find this project helpful, please give it a star!
