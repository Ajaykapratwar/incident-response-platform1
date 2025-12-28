# Incident Response Platform - Backend

Spring Boot backend for the Real-Time Incident Reporting and Resource Coordination Platform.

## Architecture

### Layered Architecture

```
Controller Layer (REST APIs)
    ↓
Service Layer (Business Logic)
    ↓
Repository Layer (Data Access)
    ↓
Entity Layer (Database Models)
```

### Key Components

- **Controllers:** REST API endpoints
- **Services:** Business logic, confidence scoring, duplicate detection
- **Repositories:** JPA data access with custom queries
- **Security:** JWT authentication, role-based access control
- **WebSocket:** STOMP for real-time updates
- **File Storage:** Local file system (configurable for cloud storage)

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/incident_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# JWT
JWT_SECRET=your-256-bit-secret-key-change-in-production-minimum-32-characters

# File Upload
UPLOAD_DIR=./uploads

# Server
PORT=8080
```

### Application Properties

See `application.yml` for default configuration and `application-prod.yml` for production settings.

## Database Schema

The application uses JPA with automatic schema generation (`ddl-auto: update`). Entities:

- `Incident` - Core incident data
- `User` - User accounts and reputation
- `Confirmation` - User confirmations of incidents
- `IncidentTimeline` - Status change history

## API Documentation

### Public Endpoints

#### Create Incident
```http
POST /api/incidents/public/report
Content-Type: multipart/form-data

type: ACCIDENT | MEDICAL | FIRE | INFRASTRUCTURE | CRIME
description: string (10-2000 chars)
latitude: double (-90 to 90)
longitude: double (-180 to 180)
address: string (optional)
gpsAccuracy: double (optional, in meters)
image: file (optional, max 10MB)
reporterUsername: string (optional, default: "anonymous")
```

#### Query Incidents
```http
GET /api/incidents/public/query?latitude=40.7128&longitude=-74.0060&radiusKm=5&type=ACCIDENT&status=VERIFIED&minConfidenceScore=50&limit=50&offset=0
```

#### Confirm Incident
```http
POST /api/incidents/public/confirm
Content-Type: application/json

{
  "incidentId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Admin Endpoints (JWT Required)

#### Get Prioritized Incidents
```http
GET /api/incidents/admin/prioritized?status=UNVERIFIED&limit=50
Authorization: Bearer <token>
```

#### Update Status
```http
PUT /api/incidents/admin/{id}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "VERIFIED",
  "notes": "Verified by responder on scene"
}
```

## WebSocket

- **Endpoint:** `/ws`
- **Protocol:** STOMP over SockJS
- **Topic:** `/topic/incidents`
- **Message Format:** JSON `IncidentResponse`

## Confidence Score Calculation

See `ConfidenceScoreCalculator` for detailed logic. Factors:
- Base score (30)
- Image presence (+20)
- Confirmations (+15 each, max 3)
- Reporter reputation (0-20)
- GPS accuracy (0-15)
- Time freshness (0-5)

## Duplicate Detection

Configured in `application.yml`:
- `app.duplicate.distance-threshold-meters: 300`
- `app.duplicate.time-window-minutes: 10`

Logic in `IncidentService.findPotentialDuplicates()`

## Building and Running

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Or with JAR
java -jar target/incident-response-platform-1.0.0.jar
```

## Production Considerations

1. **Database:** Use connection pooling, read replicas for scale
2. **File Storage:** Migrate to S3/cloud storage
3. **Caching:** Add Redis for frequently accessed data
4. **Monitoring:** Add Actuator endpoints, Prometheus metrics
5. **Logging:** Structured logging with ELK stack
6. **Security:** Rate limiting, input sanitization, CSRF protection


