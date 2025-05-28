# Frontend App Directory Documentation

This directory contains the core React application code for HealthRecEngine.

## Directory Structure

### /api
- `api.ts`: Central API client that handles all HTTP requests to the backend. Includes authentication interceptors, error handling, and endpoint functions for auth, health data, and support.

### /components
- `Navbar.tsx`: Navigation bar component used across the application.
- `Root.tsx`: Root component that wraps the entire application, provides the SidebarContext, and handles theme.
- `Sidebar.tsx`: Responsive sidebar navigation component with collapsible functionality.

### /context
- `SidebarContext.tsx`: Context provider for sidebar state management (open/closed state) across the application.

### /features
Each feature directory contains components related to a specific feature of the application:

#### /auth
- `AuthPage.tsx`: Handles user authentication (login/signup) with form validation and error handling.

#### /dashboard
- `Dashboard.tsx`: Main dashboard component displaying health metrics overview, charts, and AI recommendations.

#### /landing
- `LandingPage.tsx`: Public landing page with feature showcase, testimonials, and team information.

#### /metrics
- `MetricsPage.tsx`: Overview page for all health metrics with navigation to specific metrics.
- `HeartRateMetric.tsx`: Detailed heart rate tracking and visualization.
- `SleepMetric.tsx`: Sleep tracking and analysis component.
- `StepsMetric.tsx`: Step count tracking and visualization.
- `DoctorReport.tsx`: Component for generating and sending health reports to healthcare providers.

#### /profile
- `ProfilePage.tsx`: User profile management with personal information editing and health goals tracking.

#### /settings
- `SettingsPage.tsx`: Application settings management including preferences, notifications, and support.

### /routes.tsx
- Defines all application routes using React Router, including protected routes that require authentication.

### /utils
- `placeholders.ts`: Utility functions for generating placeholder images and content.
- `theme-utils.ts`: Theme management utilities for handling dark/light mode preferences.

## Key Concepts

1. **Feature-based Organization**: Components are organized by feature rather than type, making it easier to locate and maintain related code.

2. **Context API**: Used for state management across components (e.g., sidebar state, theme).

3. **Protected Routes**: Routes that require authentication are wrapped with an auth guard component.

4. **Responsive Design**: All components are designed to work on both desktop and mobile devices.

5. **Dark/Light Mode**: The application supports theme switching with persistent preferences.

