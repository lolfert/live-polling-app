import { Socket } from "socket.io";
import { io } from ".";

const handleSocketConnection = (socket: Socket) => {

        console.log('User connected:', socket.id);

        const broadcastParticipantCount = (pollId: string) => {
                if (!pollId) return;
                const roomName = `poll-${pollId}`;
                // Ensure io instance is available
                const count = io.sockets.adapter.rooms.get(roomName)?.size || 0;
                io.to(roomName).emit('participant-update', { participantCount: count });
                console.log(`Broadcast participant count for ${roomName}: ${count}`);
        }

        const handleJoinPollEvent = (pollId: string) => {
                if (typeof pollId === 'string' && pollId.startsWith('poll-')) { // Expect format 'poll-XYZ'
                        console.log(`Socket ${socket.id} joining poll ${pollId}`);
                        socket.join(pollId);
                        broadcastParticipantCount(pollId.replace('poll-', '')); // Broadcast after joining
                } else {
                        console.warn(`Socket ${socket.id} tried to join invalid room: ${pollId}`)
                }
        }

        const handleDisconnectingEvent = () => {
                console.log(`Socket ${socket.id} disconnecting...`);
                // Broadcast participant count updates for rooms the socket was in
                for (const room of socket.rooms) {
                        if (room !== socket.id && room.startsWith('poll-')) {
                                // Use timeout to allow socket to fully leave before counting
                                setTimeout(() => broadcastParticipantCount(room.replace('poll-', '')), 0);
                        }
                }
        }

        const handleDisconnectEvent = () => {
                console.log('User disconnected:', socket.id);
        }

        socket.on('joinPoll', handleJoinPollEvent);
        socket.on('disconnecting', handleDisconnectingEvent);
        socket.on('disconnect', handleDisconnectEvent);

};

export { handleSocketConnection }