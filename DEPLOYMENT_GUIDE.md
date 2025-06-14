# Vistream Deployment Guide

## Prerequisites

1. **GitHub Repository**: https://github.com/solusaas-git/vistream
2. **Vercel Account**: Sign up at https://vercel.com
3. **MongoDB Atlas**: Set up a MongoDB database
4. **Domain**: vistream.net (configured in DNS)

## Step 1: MongoDB Setup

1. Create a MongoDB Atlas account at https://cloud.mongodb.com
2. Create a new cluster
3. Create a database user with read/write permissions
4. Get your connection string (replace `<password>` with your actual password)
5. Whitelist Vercel's IP addresses or use `0.0.0.0/0` for all IPs

## Step 2: Vercel Deployment

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import from GitHub: `solusaas-git/vistream`
4. Configure environment variables (see below)
5. Deploy

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
vercel

# Follow the prompts:
# - Link to existing project? No
# - Project name: vistream
# - Directory: ./
# - Override settings? No
```

## Step 3: Environment Variables

Add these environment variables in Vercel Dashboard → Project → Settings → Environment Variables:

### Required Variables

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vistream?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NEXTAUTH_SECRET=your-nextauth-secret-key-here-also-long-and-random
NEXTAUTH_URL=https://vistream.net

# Email (Optional - for contact forms and notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@vistream.net
```

### Generate Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 4: Domain Configuration

1. In Vercel Dashboard → Project → Settings → Domains
2. Add custom domain: `vistream.net`
3. Add www redirect: `www.vistream.net` → `vistream.net`
4. Configure DNS records:

```
Type: A
Name: @
Value: 76.76.19.61

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## Step 5: Database Initialization

After deployment, you need to create an admin user:

1. Go to your deployed site
2. Register a new account at `/auth/signup`
3. Connect to your MongoDB database
4. Update the user's role to 'admin':

```javascript
// In MongoDB Compass or shell
db.users.updateOne(
  { email: "your-admin-email@example.com" },
  { $set: { role: "admin" } }
)
```

## Step 6: Verify Deployment

1. Visit https://vistream.net
2. Test user registration and login
3. Access admin panel at `/admin`
4. Test contact form functionality
5. Verify email sending (if SMTP configured)

## Environment-Specific Settings

### Production Optimizations

1. **Performance**: Enable Vercel Analytics
2. **Security**: Configure CSP headers
3. **Monitoring**: Set up error tracking
4. **Backup**: Schedule MongoDB backups

### Development Setup

```bash
# Clone repository
git clone https://github.com/solusaas-git/vistream.git
cd vistream

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Edit .env.local with your local settings
# Start development server
npm run dev
```

## Troubleshooting

### Common Issues

1. **Build Errors**: Check Node.js version (use Node 18+)
2. **Database Connection**: Verify MongoDB URI and network access
3. **Environment Variables**: Ensure all required vars are set
4. **Domain Issues**: Check DNS propagation (can take 24-48 hours)

### Logs and Debugging

```bash
# View Vercel logs
vercel logs

# Check build logs in Vercel dashboard
# Monitor function execution in Vercel dashboard
```

### Support

- Vercel Documentation: https://vercel.com/docs
- MongoDB Atlas Documentation: https://docs.atlas.mongodb.com
- Next.js Documentation: https://nextjs.org/docs

## Security Checklist

- [ ] Strong JWT and NextAuth secrets
- [ ] MongoDB user with minimal required permissions
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Environment variables properly secured
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] CORS properly configured

## Post-Deployment Tasks

1. Set up monitoring and alerts
2. Configure backup strategy
3. Test all functionality
4. Set up CI/CD pipeline
5. Configure error tracking
6. Set up analytics
7. Create admin user
8. Test email functionality
9. Verify domain and SSL
10. Performance optimization

Your Vistream application should now be live at https://vistream.net! 