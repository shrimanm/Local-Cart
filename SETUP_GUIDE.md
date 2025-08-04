# Myntra Ecommerce Clone - Complete Setup Guide

This guide will walk you through setting up the Myntra Ecommerce Clone from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)
- **Code Editor** (VS Code recommended) - [Download here](https://code.visualstudio.com/)

## Step 1: Clone and Install

### 1.1 Clone the Repository
\`\`\`bash
git clone https://github.com/yourusername/myntra-ecommerce-clone.git
cd myntra-ecommerce-clone
\`\`\`

### 1.2 Install Dependencies
\`\`\`bash
npm install
\`\`\`

This will install all required packages including:
- Next.js 14
- TypeScript
- Tailwind CSS
- MongoDB driver
- Radix UI components
- And more...

## Step 2: Environment Configuration

### 2.1 Create Environment File
\`\`\`bash
cp .env.example .env.local
\`\`\`

### 2.2 Configure Environment Variables

Open `.env.local` and fill in the following:

#### Database Configuration
\`\`\`env
MONGODB_URI=mongodb://localhost:27017/myntra-clone
DATABASE_URL=mongodb://localhost:27017/myntra-clone
\`\`\`

#### JWT Secret (Required for Authentication)
Generate a secure JWT secret:
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

Add the generated secret:
\`\`\`env
JWT_SECRET=your-generated-secret-here
\`\`\`

#### Cloudinary Configuration (Required for Image Upload)
Sign up at [Cloudinary](https://cloudinary.com/) and get your credentials:
\`\`\`env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
\`\`\`

## Step 3: Database Setup

### 3.1 Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
\`\`\`bash
mongod
\`\`\`

**macOS (with Homebrew):**
\`\`\`bash
brew services start mongodb-community
\`\`\`

**Linux:**
\`\`\`bash
sudo systemctl start mongod
\`\`\`

### 3.2 Initialize Database
Run the database initialization script:
\`\`\`bash
node scripts/init-db.js
\`\`\`

This will:
- Create the database
- Set up collections
- Create necessary indexes

### 3.3 Seed Sample Data
Populate the database with sample data:
\`\`\`bash
node scripts/seed-data.js
\`\`\`

This will create:
- Sample users (including admin and merchant accounts)
- Product categories
- Sample products
- Test data for development

## Step 4: Development Server

### 4.1 Start the Development Server
\`\`\`bash
npm run dev
\`\`\`

### 4.2 Access the Application
Open your browser and navigate to:
- **Main App**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:3000/api/test](http://localhost:3000/api/test)

## Step 5: Test the Setup

### 5.1 Test User Authentication
1. Go to [http://localhost:3000](http://localhost:3000)
2. Enter a phone number (e.g., `9876543210`)
3. Use OTP `123456` (development mode)
4. Complete the onboarding process

### 5.2 Test Admin Access
Use these credentials to test admin functionality:
- **Phone**: `9999999999`
- **OTP**: `123456`
- **Role**: Admin

### 5.3 Test Merchant Access
Use these credentials to test merchant functionality:
- **Phone**: `8888888888`
- **OTP**: `123456`
- **Role**: Merchant

## Step 6: Production Deployment

### 6.1 Vercel Deployment (Recommended)

1. **Push to GitHub**:
   \`\`\`bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   \`\`\`

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy

3. **Set Production Environment Variables**:
   \`\`\`env
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   CLOUDINARY_API_KEY=your-cloudinary-api-key
   CLOUDINARY_API_SECRET=your-cloudinary-api-secret
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
   \`\`\`

### 6.2 MongoDB Atlas Setup (For Production)

1. **Create MongoDB Atlas Account**:
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create a free account

2. **Create a Cluster**:
   - Choose a free tier cluster
   - Select a region close to your users

3. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password

4. **Update Environment Variables**:
   \`\`\`env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/myntra-clone
   \`\`\`

## Step 7: Troubleshooting

### Common Issues and Solutions

#### 7.1 MongoDB Connection Issues
**Error**: `MongoNetworkError: failed to connect to server`

**Solutions**:
- Ensure MongoDB is running
- Check if the port 27017 is available
- Verify the connection string in `.env.local`

#### 7.2 JWT Secret Missing
**Error**: `JWT_SECRET is not defined`

**Solution**:
- Generate a new JWT secret
- Add it to your `.env.local` file
- Restart the development server

#### 7.3 Cloudinary Upload Issues
**Error**: `Invalid API key or secret`

**Solutions**:
- Verify your Cloudinary credentials
- Ensure all Cloudinary environment variables are set
- Check if the API key has upload permissions

#### 7.4 Port Already in Use
**Error**: `Port 3000 is already in use`

**Solution**:
\`\`\`bash
# Kill the process using port 3000
npx kill-port 3000

# Or run on a different port
npm run dev -- -p 3001
\`\`\`

#### 7.5 Build Errors
**Error**: TypeScript or build errors

**Solutions**:
- Run type checking: `npm run type-check`
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Step 8: Development Workflow

### 8.1 Code Structure
\`\`\`
app/
├── api/           # API routes
├── admin/         # Admin pages
├── merchant/      # Merchant pages
├── home/          # User pages
└── globals.css    # Global styles

components/
├── ui/            # Base UI components
├── auth/          # Authentication components
└── home/          # Home page components

lib/
├── db.ts          # Database connection
├── types.ts       # TypeScript types
└── utils.ts       # Utility functions
\`\`\`

### 8.2 Adding New Features

1. **Create API Route**:
   \`\`\`typescript
   // app/api/your-feature/route.ts
   import { NextRequest, NextResponse } from "next/server"
   
   export async function GET(request: NextRequest) {
     // Your logic here
     return NextResponse.json({ success: true })
   }
   \`\`\`

2. **Create Page Component**:
   \`\`\`typescript
   // app/your-page/page.tsx
   export default function YourPage() {
     return <div>Your page content</div>
   }
   \`\`\`

3. **Add Types**:
   \`\`\`typescript
   // lib/types.ts
   export interface YourType {
     id: string
     name: string
   }
   \`\`\`

### 8.3 Database Operations

**Adding a new collection**:
\`\`\`javascript
// In your API route
const db = await connectToDatabase()
const collection = db.collection("your-collection")

// Create
await collection.insertOne(document)

// Read
const documents = await collection.find({}).toArray()

// Update
await collection.updateOne({ _id: id }, { $set: updates })

// Delete
await collection.deleteOne({ _id: id })
\`\`\`

## Step 9: Testing

### 9.1 Manual Testing Checklist

- [ ] User registration and login
- [ ] Product browsing and search
- [ ] Add to cart functionality
- [ ] Checkout process
- [ ] Order management
- [ ] Merchant product management
- [ ] Admin panel functionality

### 9.2 API Testing

Use tools like Postman or curl to test API endpoints:

\`\`\`bash
# Test OTP sending
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'

# Test product fetching
curl http://localhost:3000/api/products
\`\`\`

## Step 10: Going Live

### 10.1 Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database properly set up and seeded
- [ ] Image upload working
- [ ] Authentication flow tested
- [ ] Payment integration (if implemented)
- [ ] Error handling in place
- [ ] Performance optimization
- [ ] Security measures implemented

### 10.2 Post-Launch Monitoring

- Monitor application logs
- Set up error tracking (Sentry recommended)
- Monitor database performance
- Track user analytics
- Set up backup strategies

## Support

If you encounter any issues during setup:

1. **Check the logs**: Look at the console output for error messages
2. **Verify environment variables**: Ensure all required variables are set
3. **Check database connection**: Verify MongoDB is running and accessible
4. **Review the documentation**: This guide covers most common scenarios
5. **Create an issue**: If you're still stuck, create a GitHub issue with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps to reproduce

---

**Congratulations! 🎉** You now have a fully functional Myntra ecommerce clone running locally. Happy coding!
\`\`\`

Now let me continue with more essential files:
