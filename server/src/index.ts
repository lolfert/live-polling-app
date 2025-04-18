import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- HTTP Server Setup ---
const server = http.createServer(app);

// --- Socket Server Setup ---
const io = new SocketIOServer(server, {
        cors: {
                origin: "*",
                methods: ["GET", "POST"]
        }
});

io.on('connection', (socket) => {

        console.log('user connected:', socket.id);

        socket.on('disconnect', () => {

                console.log('user disconnected:', socket.id);

        });

});

// --- API Routes ---
app.get('/api/health', (req, res) => {

        res.status(200).json({ status: 'OK' });

});


// --- Start Server ---
server.listen(port, () => {
        console.log(`Server listening on http://localhost:${port}`);
});

export { io };