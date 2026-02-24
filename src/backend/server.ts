import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupEnhancedApi } from './enhanced_api';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Setup API Routes
setupEnhancedApi(app, io);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Kiln Backend running on port ${PORT}`);
});
