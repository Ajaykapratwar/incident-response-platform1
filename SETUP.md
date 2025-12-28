# Setup Guide

Quick setup guide for local development.

## Prerequisites

- Java 17 or higher
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Maven 3.8 or higher

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE incident_db;
```

### 2. Configure Connection

Update `backend/src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/incident_db
    username: postgres
    password: your_password
```

Or set environment variables:

```bash
export DATABASE_URL=jdbc:postgresql://localhost:5432/incident_db
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=your_password
```

### 3. Schema Creation

The application will automatically create tables on first run using `ddl-auto: update`.

## Backend Setup

### 1. Navigate to Backend

```bash
cd backend
```

### 2. Build Project

```bash
mvn clean install
```

### 3. Run Application

```bash
mvn spring-boot:run
```

Or with JAR:

```bash
java -jar target/incident-response-platform-1.0.0.jar
```

### 4. Verify Backend

- Backend should start on `http://localhost:8080`
- Health check: `http://localhost:8080/api/dashboard/stats`

### 5. Default Users

The application automatically creates:
- **Admin:** `admin` / `admin123`
- **Responder:** `responder` / `responder123`

## Frontend Setup

### 1. Navigate to Frontend

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create `.env` file (optional, defaults to localhost):

```bash
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

### 4. Start Development Server

```bash
npm run dev
```

### 5. Verify Frontend

- Frontend should start on `http://localhost:5173`
- Open browser and navigate to the URL

## Testing the Application

### 1. Test Public Dashboard

- Navigate to `http://localhost:5173`
- Should see dashboard with metrics

### 2. Test Incident Reporting

- Click "Report Incident"
- Allow location access
- Fill form and submit
- Should see success message

### 3. Test Live Feed

- Navigate to "Live Feed"
- Should see incidents on map
- Enable location for better experience

### 4. Test Admin Panel

- Navigate to "Login"
- Login with `admin` / `admin123`
- Navigate to "Admin Panel"
- Should see prioritized incidents
- Update incident status

### 5. Test Real-Time Updates

- Open two browser windows
- Report incident in one window
- Should see update in other window (Live Feed or Admin Panel)

## Troubleshooting

### Backend Issues

**Port Already in Use**
```bash
# Change port in application.yml or set PORT environment variable
export PORT=8081
```

**Database Connection Failed**
- Verify PostgreSQL is running
- Check database credentials
- Ensure database exists

**Build Failures**
- Check Java version: `java -version` (should be 17+)
- Check Maven version: `mvn -version` (should be 3.8+)
- Clean and rebuild: `mvn clean install`

### Frontend Issues

**API Connection Failed**
- Verify backend is running
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

**WebSocket Connection Failed**
- Verify backend WebSocket endpoint: `http://localhost:8080/ws`
- Check `VITE_WS_URL` in `.env`
- Check browser console for errors

**GPS Not Working**
- Ensure HTTPS or localhost (browsers require secure context for GPS)
- Check browser permissions
- Try different browser

### Database Issues

**Tables Not Created**
- Check `ddl-auto: update` in `application.yml`
- Check database connection logs
- Verify user has CREATE TABLE permissions

**Migration Errors**
- Drop database and recreate
- Check PostgreSQL version (14+)
- Verify connection string format

## Development Tips

### Backend Development

- Enable SQL logging: Set `show-sql: true` in `application.yml`
- Use Spring Boot DevTools for hot reload
- Check logs in `logs/` directory

### Frontend Development

- Use React DevTools browser extension
- Check browser console for errors
- Use Network tab to debug API calls

### Database Development

- Use pgAdmin or DBeaver for database management
- Check table structure after first run
- Verify indexes are created

## Next Steps

1. Review [README.md](README.md) for feature overview
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment

## Common Commands

### Backend

```bash
# Build
mvn clean install

# Run
mvn spring-boot:run

# Run tests
mvn test

# Package JAR
mvn package
```

### Frontend

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables Reference

### Backend

- `DATABASE_URL` - PostgreSQL connection URL
- `DATABASE_USERNAME` - Database username
- `DATABASE_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `UPLOAD_DIR` - File upload directory
- `PORT` - Server port (default: 8080)

### Frontend

- `VITE_API_URL` - Backend API URL
- `VITE_WS_URL` - WebSocket URL


