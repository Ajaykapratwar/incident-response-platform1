# Deployment Guide

Complete deployment guide for the Incident Response Platform.

## Prerequisites

- GitHub repository
- Render account (backend)
- Vercel account (frontend)
- Cloud PostgreSQL database (Render, AWS RDS, or Heroku)

## Step 1: Database Setup

### Option A: Render PostgreSQL

1. Go to Render Dashboard
2. Create New → PostgreSQL
3. Note the connection details:
   - Internal Database URL
   - External Database URL
   - Database name, username, password

### Option B: AWS RDS / Heroku Postgres

Follow provider-specific setup instructions.

## Step 2: Backend Deployment (Render)

1. **Connect Repository**
   - Go to Render Dashboard
   - New → Web Service
   - Connect your GitHub repository

2. **Configure Service**
   - **Name:** `incident-response-backend`
   - **Environment:** `Java`
   - **Build Command:** `cd backend && mvn clean install -DskipTests`
   - **Start Command:** `cd backend && java -jar target/incident-response-platform-1.0.0.jar --spring.profiles.active=prod`

3. **Environment Variables**
   ```
   DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>
   DATABASE_USERNAME=<username>
   DATABASE_PASSWORD=<password>
   JWT_SECRET=<generate-32-char-secret>
   UPLOAD_DIR=/app/uploads
   PORT=10000
   SPRING_PROFILES_ACTIVE=prod
   ```

4. **Generate JWT Secret**
   ```bash
   # Use a secure random string (minimum 32 characters)
   openssl rand -base64 32
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment
   - Note the service URL (e.g., `https://incident-response-backend.onrender.com`)

## Step 3: Frontend Deployment (Vercel)

1. **Connect Repository**
   - Go to Vercel Dashboard
   - Import Project
   - Select your GitHub repository

2. **Configure Project**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Environment Variables**
   ```
   VITE_API_URL=https://incident-response-backend.onrender.com
   VITE_WS_URL=https://incident-response-backend.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build
   - Note the deployment URL (e.g., `https://incident-response-platform.vercel.app`)

## Step 4: Update CORS Configuration

Update `backend/src/main/java/com/incident/config/SecurityConfig.java`:

```java
configuration.setAllowedOrigins(Arrays.asList(
    "http://localhost:5173",
    "http://localhost:3000",
    "https://*.vercel.app",
    "https://your-frontend-domain.vercel.app"  // Add your Vercel URL
));
```

Redeploy backend after CORS update.

## Step 5: File Storage (Production)

For production, consider migrating to cloud storage:

### Option A: AWS S3
- Create S3 bucket
- Update `FileStorageService` to use S3 SDK
- Configure bucket permissions

### Option B: Cloudinary
- Create Cloudinary account
- Update file upload to use Cloudinary API

## Step 6: Database Migrations

For production, use Flyway or Liquibase instead of `ddl-auto: update`:

1. Add Flyway dependency to `pom.xml`
2. Create migration scripts
3. Set `ddl-auto: validate` in production

## Step 7: Monitoring and Logging

### Recommended Additions:

1. **Application Monitoring**
   - Add Spring Boot Actuator
   - Configure health checks
   - Set up alerts

2. **Error Tracking**
   - Sentry integration
   - Log aggregation (Loggly, Papertrail)

3. **Performance Monitoring**
   - New Relic or Datadog
   - Database query monitoring

## Step 8: Security Hardening

1. **Rate Limiting**
   - Add Spring Security rate limiting
   - Protect against DDoS

2. **HTTPS**
   - Ensure all endpoints use HTTPS
   - Configure SSL certificates

3. **Secrets Management**
   - Use environment variables (never commit secrets)
   - Consider AWS Secrets Manager or similar

## Troubleshooting

### Backend Issues

- **Database Connection:** Verify DATABASE_URL format
- **Port:** Render uses PORT environment variable
- **Build Failures:** Check Maven logs, Java version

### Frontend Issues

- **API Calls:** Verify VITE_API_URL is correct
- **WebSocket:** Check VITE_WS_URL, ensure backend supports WebSocket
- **CORS:** Verify CORS configuration includes frontend domain

### Database Issues

- **Connection Limits:** Check database connection pool settings
- **Migrations:** Ensure schema is created correctly
- **Performance:** Add indexes on frequently queried columns

## Post-Deployment Checklist

- [ ] Backend health check endpoint responds
- [ ] Frontend loads and connects to backend
- [ ] Database connection established
- [ ] JWT authentication works
- [ ] WebSocket connection established
- [ ] File uploads work (or cloud storage configured)
- [ ] GPS location detection works
- [ ] Real-time updates function
- [ ] Admin panel accessible
- [ ] Default admin/responder accounts created

## Scaling Considerations

- **Database:** Use read replicas for query scaling
- **Backend:** Multiple instances behind load balancer
- **WebSocket:** Use message broker (RabbitMQ, Redis Pub/Sub)
- **File Storage:** CDN for image delivery
- **Caching:** Redis for frequently accessed data

## Support

For deployment issues, check:
- Render logs (backend)
- Vercel logs (frontend)
- Database connection logs
- Browser console (frontend errors)


