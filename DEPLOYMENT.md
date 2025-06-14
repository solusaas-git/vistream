# Vistream Production Deployment Guide

This guide covers deploying Vistream to production with MongoDB, proper security, and monitoring.

## Prerequisites

- Node.js 18+ 
- MongoDB database (Atlas or self-hosted)
- SMTP email service (Gmail, SendGrid, etc.)
- Domain name with SSL certificate
- Production hosting (Vercel, AWS, DigitalOcean, etc.)

## Environment Configuration

### 1. Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Environment
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vistream?retryWrites=true&w=majority

# JWT Secrets (generate strong 64+ character secrets)
JWT_SECRET=your-super-secure-jwt-secret-64-characters-minimum-random-string
JWT_REFRESH_SECRET=your-super-secure-refresh-jwt-secret-64-characters-minimum-random-string

# NextAuth
NEXTAUTH_SECRET=your-super-secure-nextauth-secret-64-characters-minimum-random-string
NEXTAUTH_URL=https://your-domain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-production-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@your-domain.com
FROM_NAME=Vistream

# App Configuration
APP_URL=https://your-domain.com

# Security
BCRYPT_ROUNDS=12
ENABLE_RATE_LIMITING=true
LOG_LEVEL=error

# Features
ENABLE_EMAIL_VERIFICATION=true
ENABLE_PASSWORD_RESET=true
```

### 2. Generate Secure Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 64
```

## Database Setup

### MongoDB Atlas (Recommended)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your application's IP addresses
5. Get the connection string and update `MONGODB_URI`

### Self-hosted MongoDB

1. Install MongoDB on your server
2. Configure authentication and SSL
3. Create the `vistream` database
4. Create indexes for performance:

```javascript
// Connect to MongoDB and run these commands
use vistream

// User collection indexes
db.users.createIndex({ "email": 1 }, { unique: true })
db.users.createIndex({ "isVerified": 1 })
db.users.createIndex({ "resetToken": 1 })
db.users.createIndex({ "otpExpiry": 1 })
db.users.createIndex({ "resetTokenExpiry": 1 })
db.users.createIndex({ "createdAt": 1 })
```

## Email Service Setup

### Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the app password in `SMTP_PASS`

### SendGrid Setup (Alternative)

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Security Checklist

### 1. Environment Variables
- [ ] All secrets are 32+ characters long
- [ ] No hardcoded secrets in code
- [ ] Production secrets are different from development
- [ ] Environment variables are properly secured on hosting platform

### 2. Database Security
- [ ] MongoDB authentication enabled
- [ ] Database user has minimal required permissions
- [ ] Connection uses SSL/TLS
- [ ] IP whitelist configured (if using Atlas)

### 3. Application Security
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers implemented
- [ ] Input validation on all endpoints
- [ ] Password hashing with bcrypt (12+ rounds)

### 4. SSL/TLS
- [ ] SSL certificate installed
- [ ] HTTPS redirect configured
- [ ] Secure cookies enabled in production
- [ ] HSTS headers configured

## Deployment Options

### Vercel (Recommended for Next.js)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Configure environment variables in Vercel dashboard

4. Set up custom domain and SSL

### Docker Deployment

1. Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
  
  mongodb:
    image: mongo:6
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongodb_data:
```

3. Deploy:
```bash
docker-compose up -d
```

### Manual Server Deployment

1. Clone repository on server:
```bash
git clone https://github.com/your-username/vistream.git
cd vistream
```

2. Install dependencies:
```bash
npm ci --only=production
```

3. Build application:
```bash
npm run build
```

4. Set up process manager (PM2):
```bash
npm install -g pm2
pm2 start npm --name "vistream" -- start
pm2 startup
pm2 save
```

5. Configure reverse proxy (Nginx):
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Logging

### 1. Application Monitoring

Set up monitoring for:
- Application uptime
- Response times
- Error rates
- Database performance
- Memory and CPU usage

### 2. Error Tracking

Consider integrating:
- Sentry for error tracking
- LogRocket for session replay
- DataDog for comprehensive monitoring

### 3. Database Monitoring

Monitor:
- Connection pool usage
- Query performance
- Index usage
- Storage usage

## Performance Optimization

### 1. Database Optimization
- Ensure proper indexes are created
- Monitor slow queries
- Use connection pooling
- Consider read replicas for high traffic

### 2. Application Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize images and assets
- Use CDN for static assets

### 3. Security Headers

Add these headers in production:

```javascript
// In next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## Backup Strategy

### 1. Database Backups
- Set up automated daily backups
- Test backup restoration regularly
- Store backups in multiple locations

### 2. Application Backups
- Version control with Git
- Automated deployment pipelines
- Configuration backups

## Health Checks

Create health check endpoints:

```javascript
// pages/api/health.js
export default async function handler(req, res) {
  try {
    // Check database connection
    await connectToDatabase()
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check MongoDB URI format
   - Verify network connectivity
   - Check authentication credentials

2. **Email Sending Failures**
   - Verify SMTP credentials
   - Check firewall settings
   - Test with email service provider

3. **JWT Token Issues**
   - Ensure secrets are properly set
   - Check token expiration times
   - Verify cookie settings

4. **Rate Limiting Issues**
   - Monitor rate limit logs
   - Adjust limits for production traffic
   - Consider using Redis for distributed rate limiting

### Logs and Debugging

- Check application logs: `pm2 logs vistream`
- Monitor error rates in production
- Set up alerts for critical errors
- Use structured logging for better analysis

## Maintenance

### Regular Tasks
- [ ] Update dependencies monthly
- [ ] Review security patches
- [ ] Monitor database performance
- [ ] Check backup integrity
- [ ] Review error logs
- [ ] Update SSL certificates

### Security Updates
- [ ] Monitor for security vulnerabilities
- [ ] Update Node.js and dependencies
- [ ] Review and rotate secrets periodically
- [ ] Audit user permissions

## Support

For production support:
- Check logs first
- Review this deployment guide
- Contact the development team
- Create detailed issue reports with logs and environment details 