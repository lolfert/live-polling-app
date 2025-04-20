import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import pollRoutes from './routes/poll';
import { handleSocketConnection } from './sockets';

dotenv.config({ path: '../../.env' });

const server_urls = [
        process.env.FRONTEND_DEVELOPMENT_URL || '',
        process.env.FRONTEND_PRODUCTION_URL || ''
];

// HTTP Setup

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: server_urls, methods: ["GET", "POST", "PUT", "DELETE"] }));
app.use(express.json());

const server = http.createServer(app);

app.use('/api', pollRoutes);

app.get('/api/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket Setup

const io = new SocketIOServer(server, {
        cors: {
                origin: server_urls,
                methods: ["GET", "POST"]
        }
});

io.on('connection', handleSocketConnection)

// --- Start Server ---

server.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
});

export { io };