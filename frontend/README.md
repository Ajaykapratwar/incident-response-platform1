# Incident Response Platform - Frontend

React + Vite frontend for the Real-Time Incident Reporting and Resource Coordination Platform.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **@stomp/stompjs** - WebSocket client
- **Leaflet** - Maps

## Project Structure

```
src/
├── components/       # Reusable components (Layout, etc.)
├── pages/           # Page components (Dashboard, ReportIncident, etc.)
├── services/        # API and WebSocket services
├── context/         # React context (AuthContext)
├── App.jsx          # Main app component with routing
└── main.jsx         # Entry point
```

## Features

### Pages

1. **Dashboard** (`/`) - Public trust dashboard with metrics
2. **Report Incident** (`/report`) - Incident reporting form with GPS
3. **Live Feed** (`/feed`) - Real-time incident feed with map
4. **Admin Panel** (`/admin`) - Admin/responder incident management
5. **Login** (`/login`) - Authentication page

### Key Components

- **Layout** - Navigation and page wrapper
- **AuthContext** - Authentication state management
- **API Service** - Centralized API calls
- **WebSocket Service** - Real-time updates

## Configuration

### Environment Variables

Create `.env` file:

```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

For production (Vercel), set these in Vercel dashboard.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features Implementation

### GPS Location

Uses browser Geolocation API:
- Auto-detects location on report form
- Manual correction allowed
- Privacy-aware (only captured at report time)

### Real-Time Updates

WebSocket connection:
- Connects on feed and admin pages
- Subscribes to `/topic/incidents`
- Updates UI automatically on new/updated incidents

### Maps

Leaflet integration:
- OpenStreetMap tiles (free, no API key)
- Markers for each incident
- Popup with incident details
- User location marker

## Styling

Tailwind CSS with custom theme:
- Emergency-focused color palette
- Responsive design (mobile-first)
- Professional, clean UI
- Accessible contrast ratios

## Production Build

```bash
npm run build
```

Output in `dist/` directory, ready for Vercel deployment.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers with Geolocation API support
- WebSocket support required for real-time features


