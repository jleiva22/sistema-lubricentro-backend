import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sequelize from './libs/sequelize.js';
import apiRouter from './server/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.URL_ORIGIN,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

apiRouter(app);
app.use(notFoundHandler);
app.use(errorHandler);

// Función con reintentos para autenticar Sequelize
const connectWithRetry = async (retries = 5, delay = 3000) => {
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente.');

      await sequelize.sync();
      console.log('✅ Modelos sincronizados con la DB.');
      break;
    } catch (error) {
      retries -= 1;
      console.error(`⚠️ Error en la conexión/sincronización con la DB: ${error.message}`);
      console.log(`⏳ Reintentos restantes: ${retries}`);
      if (retries === 0) {
        console.error('❌ Error crítico al conectar con la base de datos:', error);
      } else {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en ${PORT}`);
  await connectWithRetry();
});