import express from 'express';
import cors from 'cors';
import statusRoutes from './routes/status.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Server is Running fine .........' });
});

app.use('/api', statusRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
