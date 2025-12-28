## Username and password
#### 1) Admin level
#### username : admin, password : admin123

#### 2) Responder level
#### username : responder, password : responder123

# Real-Time Incident Reporting and Resource Coordination Platform

A production-ready, real-time incident reporting and resource coordination platform for emergency management, designed for national-level hackathon demonstrations.

## 🎯 Overview

This platform addresses critical challenges in emergency incident management:
- **Delayed reporting** - Real-time, location-aware reporting
- **Duplicate/false reports** - Smart duplicate detection and verification
- **Lack of visibility** - Live incident feed with WebSocket updates
- **Poor prioritization** - Trust-based confidence scoring system

## 🏗️ Architecture

### Tech Stack

**Backend:**
- Java 17 + Spring Boot 3.2.0
- Spring Security (JWT authentication)
- Spring Data JPA
- WebSocket (STOMP) for real-time updates
- PostgreSQL database

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Leaflet/OpenStreetMap for mapping
- WebSocket client for live updates
- Browser Geolocation API

**Deployment:**
- Backend: Render.com
- Frontend: Vercel
- Database: Cloud PostgreSQL

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Maven 3.8+

### Backend Setup

```bash
cd backend

# Configure database in application.yml or set environment variables:
# DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend will start on `http://localhost:8080`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start on `http://localhost:5173`

### Default Credentials

- **Admin:** `admin` / `admin123`
- **Responder:** `responder` / `responder123`

## 📋 Features

### 1. Public Trust Dashboard
- Real-time metrics (total, verified, resolved incidents)
- Accuracy rate calculation
- Average response time
- Recent activity feed

### 2. Incident Reporting
- GPS auto-detection (mobile & desktop)
- Manual location correction
- Image upload support
- Duplicate detection warning
- Client & server validation

### 3. Location-Aware Intelligence
- Haversine formula for distance calculation
- Radius-based queries (1km, 5km, 10km)
- Distance display in UI
- Location clustering for confidence scoring

### 4. Smart Duplicate Detection
- 300m distance threshold
- 10-minute time window
- Same incident type matching
- User confirmation before submission

### 5. Confidence Scoring System
Dynamic 0-100% score based on:
- Base score: 30%
- Image presence: +20%
- User confirmations: +15% each (max 3)
- Reporter reputation: 0-20%
- GPS accuracy: 0-15%
- Time freshness: 0-5%

**Confidence Levels:**
- HIGH: ≥70%
- MEDIUM: 40-69%
- LOW: <40%

### 6. Reporter Reputation System
- **NEW** → **RELIABLE** (after 3 verified reports)
- **RELIABLE** → **TRUSTED** (after 10 verified reports)
- Demotion on false reports

### 7. Real-Time Incident Feed
- WebSocket live updates
- Filters: type, status, radius, confidence
- Interactive Leaflet map
- Distance-based sorting

### 8. Admin/Responder Panel
- Prioritized incident list (by confidence + time)
- Status management workflow:
  - UNVERIFIED → VERIFIED → IN_PROGRESS → RESOLVED
  - Mark as FALSE for false reports
- Internal notes
- Exact GPS coordinates & images

## 🗄️ Database Schema

### Entities

**Incident**
- id, incidentId (public ID), type, description
- latitude, longitude, address, gpsAccuracy
- imageUrl, status, confidenceScore
- confirmationCount, reporter, adminNotes
- createdAt, updatedAt

**User**
- id, username, email, password (hashed)
- role (PUBLIC, RESPONDER, ADMIN)
- reputation (NEW, RELIABLE, TRUSTED)
- verifiedReports, falseReports

**Confirmation**
- id, incident, user, latitude, longitude
- createdAt

**IncidentTimeline**
- id, incident, status, notes, updatedBy
- createdAt

## 🔐 Security

- JWT-based authentication
- Role-based access control (ADMIN, RESPONDER, PUBLIC)
- BCrypt password hashing
- CORS configuration for Vercel frontend
- Input validation on all endpoints

## 📡 API Endpoints

### Public Endpoints

- `POST /api/incidents/public/report` - Create incident
- `GET /api/incidents/public/query` - Query incidents with filters
- `GET /api/incidents/public/{incidentId}` - Get incident by ID
- `POST /api/incidents/public/confirm` - Confirm incident
- `GET /api/dashboard/stats` - Get dashboard statistics

### Admin Endpoints (JWT required)

- `GET /api/incidents/admin/prioritized` - Get prioritized incidents
- `GET /api/incidents/admin/{id}` - Get incident details
- `PUT /api/incidents/admin/{id}/status` - Update incident status

### Authentication

- `POST /api/auth/login` - Login (returns JWT token)

## 🌐 WebSocket

- **Endpoint:** `/ws`
- **Subscribe:** `/topic/incidents`
- **Events:** Real-time incident updates (create, update, status change)

## 🚢 Deployment

### Backend (Render)

1. Connect GitHub repository
2. Set build command: `cd backend && mvn clean install`
3. Set start command: `cd backend && java -jar target/incident-response-platform-1.0.0.jar`
4. Configure environment variables:
   - `DATABASE_URL`
   - `DATABASE_USERNAME`
   - `DATABASE_PASSWORD`
   - `JWT_SECRET` (minimum 32 characters)
   - `UPLOAD_DIR` (default: `./uploads`)

### Frontend (Vercel)

1. Connect GitHub repository
2. Set root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Configure environment variables:
   - `VITE_API_URL` (your Render backend URL)
   - `VITE_WS_URL` (your Render backend WebSocket URL)

### Database (Cloud PostgreSQL)

- Recommended: Render PostgreSQL, AWS RDS, or Heroku Postgres
- Run migrations automatically via `ddl-auto: update` (development)
- Use `ddl-auto: validate` in production

## 📊 Confidence Score Logic

The confidence score is calculated using a weighted formula:

```
Base Score: 30
+ Image Bonus: 20 (if image present)
+ Confirmation Bonus: 15 × min(confirmations, 3)
+ Reputation Bonus: 0-20 (based on reporter reputation)
+ GPS Accuracy Bonus: 0-15 (better accuracy = higher bonus)
+ Time Freshness Bonus: 0-5 (recent reports get boost)
= Final Score (capped at 100)
```

## 🔍 Duplicate Detection Strategy

1. **Distance Check:** Find incidents within 300m radius
2. **Time Window:** Check incidents from last 10 minutes
3. **Type Match:** Same incident type
4. **Status Filter:** Exclude FALSE status incidents
5. **User Warning:** Show potential duplicates before submission

## 🎨 UI/UX Design Principles

- **Emergency-focused:** Clean, professional, trust-building
- **Mobile-first:** Responsive design with GPS support
- **Real-time feedback:** Live updates via WebSocket
- **Privacy-aware:** GPS only captured at report time
- **Accessibility:** High contrast, readable typography

## 📈 Scalability Assumptions

- **Database:** PostgreSQL with proper indexing on location, status, timestamps
- **Caching:** Consider Redis for frequently accessed data
- **File Storage:** Use S3/cloud storage for production image uploads
- **WebSocket:** Scale using message broker (RabbitMQ, Redis Pub/Sub)
- **Load Balancing:** Multiple backend instances behind load balancer

## 🧪 Testing

```bash
# Backend tests
cd backend
mvn test

# Frontend (add test framework as needed)
cd frontend
npm test
```

## 📝 License

This project is created for hackathon demonstration purposes.

## 🤝 Contributing

This is a hackathon project. For production use, consider:
- Comprehensive test coverage
- API rate limiting
- Enhanced security measures
- Monitoring and logging
- Error tracking (Sentry, etc.)
- CI/CD pipeline

## 📞 Support

For issues or questions, please refer to the codebase documentation or create an issue in the repository.

---

**Built for Emergency Management | Real-Time | Trust-Based | Location-Aware**


