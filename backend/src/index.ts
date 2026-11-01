import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Route Imports - ESM requires .js extension for production builds
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

// Prisma Client
import prisma from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * 1. TRUST PROXY
 * Required for Render/Vercel/Cloudflare. 
 * This ensures that 'secure: true' cookies work correctly by telling Express
 * to trust the HTTPS header sent by the Render proxy.
 */
app.set('trust proxy', 1);

/**
 * 2. DYNAMIC ORIGIN CONFIGURATION
 */
const allowedOrigins = [
  'https://nexugrid.site',
  'https://www.nexugrid.site',
  'https://ops.nexugrid.site',
  'http://localhost:3000',
  'http://localhost:3001'
];

/**
 * 3. MIDDLEWARE SETUP
 * Important: cookieParser must come before any routes.
 */
app.use(cookieParser());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/**
 * 4. ADVANCED CORS CONFIGURATION
 * specifically configured for cross-domain cookie handling.
 */
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.warn(`CORS Blocked: Request from unauthorized origin: ${origin}`);
      callback(new Error('CORS Policy: Origin unauthorized.'));
    }
  },
  credentials: true, // Required for the browser to send/receive cookies across domains
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

/**
 * 5. ROUTE REGISTRATION
 */
app.use('/api/auth', authRoutes);   
app.use('/api/users', userRoutes);  
app.use('/api/admin', adminRoutes); 
app.use('/api/chat', chatRoutes);   

// Health Check Endpoint
app.get('/', async (req, res) => {
  try {
    await prisma.user.count();
    res.json({
      status: 'online',
      database: 'connected',
      version: '1.0.2',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error("Keep-alive database ping failed:", error);
    res.status(500).json({ status: 'online', database: 'error' });
  }
});

/**
 * 6. GLOBAL ERROR HANDLER
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Internal Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Critical internal error. Protocol aborted."
  });
});

/**
 * 7. SERVER STARTUP
 */
app.listen(PORT, () => {
  console.log(`
  ================================================
  🚀 NEXUSGRID PRODUCTION CORE ONLINE
  📍 PORT: ${PORT}
  🌍 ENV: ${process.env.NODE_ENV || 'development'}
  🔐 CORS: Multi-Origin Authorization (Cross-Domain)
  ================================================
  `);
});