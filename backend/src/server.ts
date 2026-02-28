import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST']
}));

app.get('/', (req, res) => {
    res.send('Sangam WebSocket Server is Live 🚀');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
    });

    socket.on('draw-line', ({ roomId, data }) => {
        socket.to(roomId).emit('draw-line', data);
    });

    socket.on('clear', (roomId) => {
        io.in(roomId).emit('clear');
    });

    socket.on('send-message', ({ roomId, message }) => {
        socket.to(roomId).emit('receive-message', message);
    });

    socket.on('cursor-move', ({ roomId, username, x, y }) => {
        socket.to(roomId).emit('cursor-move', {
            username,
            x,
            y,
            socketId: socket.id
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});