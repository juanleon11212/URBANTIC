const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const notificationRoutes = require('./routes/notification.routes');
const errorHandler = require('./middleware/error.middleware');

const app = express();
const frontendOriginPatterns = env.frontendUrl
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map((origin) => {
    const escaped = origin
      .split('*')
      .map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&'))
      .join('[^.]+');

    return new RegExp(`^${escaped}$`);
  });

app.use(cors({
  origin: (origin, callback) => {
    const allowed = !origin || frontendOriginPatterns.some((pattern) => pattern.test(origin));
    callback(null, allowed);
  },
  credentials: true
}));
app.use(express.json({ limit: '40mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'URBANTIC API funcionando.',
    data: {
      status: 'ok'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada.',
    errors: []
  });
});

app.use(errorHandler);

module.exports = app;
