import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/poll';
import { handleSocketConnection } from './sockets';

dotenv.config({ path: '../../.env' });

// HTTP Setup

const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

app.use('/api', pollRoutes);

app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket Setup

const io = new SocketIOServer(server, {
        cors: {
                origin: 'http://localhost:3000',
                methods: ['GET', 'POST'],
                credentials: true
        }
});

io.on('connection', handleSocketConnection)

// --- Start Server ---

server.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
});

export { io };