# Architecture Documentation

## System Overview

The Incident Response Platform is a full-stack application designed for real-time incident reporting and resource coordination. It follows a clean, layered architecture with clear separation of concerns.

## Backend Architecture

### Layer Structure

```
┌─────────────────────────────────────┐
│      Controller Layer (REST)        │
│  - IncidentController               │
│  - AuthController                   │
│  - DashboardController              │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Service Layer (Business)       │
│  - IncidentService                  │
│  - AuthService                      │
│  - FileStorageService               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Repository Layer (Data Access)    │
│  - IncidentRepository               │
│  - UserRepository                   │
│  - ConfirmationRepository           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Entity Layer (Database)        │
│  - Incident                         │
│  - User                             │
│  - Confirmation                    │
│  - IncidentTimeline                 │
└─────────────────────────────────────┘
```

### Key Design Patterns

1. **Repository Pattern** - Abstraction over data access
2. **Service Layer Pattern** - Business logic encapsulation
3. **DTO Pattern** - Data transfer objects for API contracts
4. **Builder Pattern** - Entity construction (Lombok)

### Security Architecture

```
┌─────────────────────────────────────┐
│   Spring Security Filter Chain      │
│  - JwtAuthenticationFilter          │
│  - CORS Configuration               │
│  - Role-Based Access Control       │
└─────────────────────────────────────┘
```

### WebSocket Architecture

```
Client (STOMP) ──► /ws ──► WebSocketConfig
                           │
                           ▼
                    SimpMessagingTemplate
                           │
                           ▼
                    /topic/incidents
```

## Frontend Architecture

### Component Hierarchy

```
App
├── AuthProvider (Context)
└── Router
    ├── Layout
    │   └── Navigation
    ├── Dashboard
    ├── ReportIncident
    ├── IncidentFeed
    │   ├── Filters
    │   └── Map (Leaflet)
    ├── AdminPanel
    └── Login
```

### State Management

- **React Context** - Authentication state
- **Local State** - Component-specific data
- **WebSocket** - Real-time updates

### Service Layer

- **API Service** - Centralized HTTP client (Axios)
- **WebSocket Service** - STOMP client for real-time updates

## Data Flow

### Incident Reporting Flow

```
1. User fills form → ReportIncident component
2. GPS location detected → Browser Geolocation API
3. Form submitted → POST /api/incidents/public/report
4. Backend validates → IncidentService.createIncident()
5. Duplicate check → findPotentialDuplicates()
6. Confidence score calculated → ConfidenceScoreCalculator
7. Incident saved → IncidentRepository
8. WebSocket broadcast → /topic/incidents
9. Frontend receives update → IncidentFeed component
```

### Admin Status Update Flow

```
1. Admin selects incident → AdminPanel
2. Status update → PUT /api/incidents/admin/{id}/status
3. Backend updates → IncidentService.updateStatus()
4. Reputation updated → updateReporterReputation()
5. Timeline entry created → IncidentTimeline
6. WebSocket broadcast → All connected clients
7. UI updates → Real-time refresh
```

## Confidence Score Algorithm

### Formula

```
Base Score: 30 points

+ Image Bonus: 20 points (if image present)
+ Confirmation Bonus: 15 × min(confirmations, 3)
+ Reputation Bonus: 
  - NEW: 0
  - RELIABLE: 10
  - TRUSTED: 20
+ GPS Accuracy Bonus:
  - ≤10m: 15
  - 10-50m: 7
  - >50m: 3
+ Time Freshness Bonus:
  - ≤1 hour: 5
  - ≤6 hours: 2
  - >6 hours: 0

Total (capped at 100)
```

### Confidence Levels

- **HIGH** (70-100%): Verified, reliable, actionable
- **MEDIUM** (40-69%): Needs verification, moderate trust
- **LOW** (0-39%): Unverified, low trust, investigate

## Duplicate Detection Algorithm

### Steps

1. **Distance Check**
   - Calculate distance using Haversine formula
   - Threshold: 300 meters

2. **Time Window**
   - Check incidents from last 10 minutes
   - Configurable via `app.duplicate.time-window-minutes`

3. **Type Matching**
   - Same incident type required

4. **Status Filter**
   - Exclude FALSE status incidents

5. **User Warning**
   - Show potential duplicates before submission
   - Allow user to confirm or cancel

### SQL Query

```sql
SELECT i.* FROM incidents i
WHERE 
  (6371 * acos(...)) <= 0.3  -- 300m in km
  AND i.type = :type
  AND i.created_at >= :timeWindow
  AND i.status != 'FALSE'
```

## Location Intelligence

### Haversine Formula

Distance calculation between two coordinates:

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c

Where R = Earth radius (6371 km)
```

### Radius Queries

PostgreSQL native query with distance calculation:

```sql
SELECT i.*, 
  (6371 * acos(...)) AS distance
FROM incidents i
WHERE distance <= :radius
ORDER BY distance ASC
```

## Database Schema

### Entity Relationships

```
User (1) ──► (N) Incident
User (1) ──► (N) Confirmation
Incident (1) ──► (N) Confirmation
Incident (1) ──► (N) IncidentTimeline
User (1) ──► (N) IncidentTimeline (updatedBy)
```

### Indexes

- `idx_location` on (latitude, longitude)
- `idx_status` on (status)
- `idx_created_at` on (createdAt)
- `idx_incident_user` on (incident_id, user_id) - unique

## Scalability Considerations

### Current Design

- **Stateless Backend** - JWT tokens, no session storage
- **Database Indexing** - Optimized queries
- **Connection Pooling** - HikariCP (Spring Boot default)

### Scaling Strategies

1. **Horizontal Scaling**
   - Multiple backend instances
   - Load balancer (nginx, AWS ALB)
   - Stateless design supports this

2. **Database Scaling**
   - Read replicas for queries
   - Connection pooling
   - Query optimization

3. **WebSocket Scaling**
   - Message broker (RabbitMQ, Redis Pub/Sub)
   - Sticky sessions or shared state

4. **File Storage**
   - Migrate to S3/cloud storage
   - CDN for image delivery

5. **Caching**
   - Redis for frequently accessed data
   - Dashboard stats caching
   - Incident list caching

## Security Considerations

### Authentication

- JWT tokens with expiration
- BCrypt password hashing
- Role-based access control

### Authorization

- Public endpoints: No authentication
- Admin endpoints: JWT required, ADMIN/RESPONDER roles

### Data Privacy

- GPS captured only at report time
- Exact coordinates visible only to ADMIN/RESPONDER
- Public users see approximate location

### Input Validation

- Server-side validation (Bean Validation)
- Client-side validation (React forms)
- SQL injection prevention (JPA parameterized queries)

## Performance Optimizations

### Database

- Indexed columns (location, status, timestamps)
- Efficient radius queries (native SQL)
- Pagination for large result sets

### Frontend

- React component optimization
- Lazy loading for maps
- WebSocket connection reuse

### Caching Opportunities

- Dashboard stats (30-second cache)
- Incident lists (short TTL)
- User reputation (longer TTL)

## Monitoring and Observability

### Recommended Additions

1. **Application Metrics**
   - Spring Boot Actuator
   - Prometheus metrics
   - Custom business metrics

2. **Logging**
   - Structured logging (JSON)
   - Log aggregation (ELK stack)
   - Error tracking (Sentry)

3. **Performance Monitoring**
   - APM tools (New Relic, Datadog)
   - Database query monitoring
   - WebSocket connection monitoring

## Future Enhancements

1. **Advanced Features**
   - Machine learning for duplicate detection
   - Predictive analytics for incident patterns
   - Mobile app (React Native)

2. **Integration**
   - Emergency services APIs
   - SMS/Email notifications
   - Third-party mapping services

3. **Analytics**
   - Incident trend analysis
   - Response time optimization
   - Reporter behavior analysis


