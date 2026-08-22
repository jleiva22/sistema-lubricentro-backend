import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sequelize from './libs/sequelize.js';
import apiRouter from './server/index.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

apiRouter(app);
app.use(notFoundHandler);
app.use(errorHandler);

// Función con reintentos para autenticar Sequelize
const connectWithRetry = async (retries = 20, delay = 5000) => {
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente.');
      
      await sequelize.sync({ alter: true, logging: false });
      console.log('✅ Modelos sincronizados con la DB.');
      break;
    } catch (error) {
      retries -= 1;
      console.log(`⏳ Esperando a MySQL... Reintentos restantes: ${retries}`);
      if (retries === 0) {
        console.error('❌ Error crítico al conectar con la base de datos:', error);
      } else {
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
};

app.listen(PORT, async () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  await connectWithRetry();
});