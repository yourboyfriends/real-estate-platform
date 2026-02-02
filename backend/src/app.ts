import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import routes from './routes/routes index';
import { notFound, errorMiddleware } from './utils/errorHandler';

const app: Application = express();

// ============================================
// MIDDLEWARES
// ============================================

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Request logging (development)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
      userId: req.headers['user-id']
    });
    next();
  });
}

// ============================================
// ROUTES
// ============================================

// Welcome route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Welcome to Real Estate API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      properties: '/api/properties',
      categories: '/api/categories',
      blog: '/api/blog'
    }
  });
});

// API Routes
app.use('/api', routes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorMiddleware);

export default app;