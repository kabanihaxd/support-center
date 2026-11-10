# SupportCenter

IT support ticket management system built with Angular 22. Three roles (Admin, Agent, Customer), ticket lifecycle with SLA tracking, comments and history, analytics and reports.

> 🚧 Work in progress. Stage 1 of 5 is done: design system, layout, authentication, role-based access and mock data layer.

## Tech stack

- Angular 22 (standalone components, signals, Signal Forms, zoneless, lazy routes)
- TypeScript (strict mode)
- Custom CSS design system with light and dark themes
- Chart.js (reports)
- Vitest (unit tests)
- Mock backend on `localStorage`, structured to be replaced by Firebase

## Getting started

```bash
npm install
npm start          # http://localhost:4200
npm test           # unit tests
npm run build      # production build in dist/
```

## Demo accounts

All demo accounts use the password `Demo@123` (mock data only, not a real secret).

| Role     | Email                        |
| -------- | ---------------------------- |
| Admin    | `admin@supportcenter.dev`    |
| Agent    | `agent@supportcenter.dev`    |
| Customer | `customer@supportcenter.dev` |

The login page also has one-click demo sign-in buttons.
