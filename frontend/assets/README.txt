# Frontend Assets Directory Documentation

This directory contains static assets and global styles for the HealthRecEngine application.

## Directory Structure

### /styles
- `global.css`: Main CSS file that imports Tailwind CSS and defines global styles and variables.
- `auth-background.css`: Specialized styles for the authentication pages, including gradient backgrounds and animations.
- `background-effects.css`: Reusable background effects and animations used across the application.

## Style Organization

1. **Tailwind Integration**: The global.css file imports Tailwind's base, components, and utilities styles.

2. **Dark Mode Support**: CSS variables and classes that support dark mode throughout the application.

3. **Animation Effects**: CSS animations for background gradients, particles, and hover effects.

4. **Theme Variables**: Custom CSS variables for consistent theming across the application.

## Usage Guidelines

- Always import global.css in the main entry point of the application.
- Use specialized CSS files only when needed to keep bundle size small.
- Prefer Tailwind utility classes for component styling when possible.
- Use CSS variables for colors and other theme values to maintain consistency.

