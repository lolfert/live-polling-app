import express from 'express';
import { io } from '../index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();

interface CreatePollRequestBody {
        question: string;
        options: string[];
}

interface VoteRequestBody {
        optionId: string;
        pollId: string;
        voterId: string;
}

async function getOptionsWithCounts(pollId: string) {
        // Fetches options for a poll and includes the live vote count for each

        return await prisma.option.findMany({
                where: { pollId: pollId },
                include: { _count: { select: { votes: true }, }, }
        });

}

async function broadcastPollUpdates(pollId: string) {
        // Fetches latest option counts and total voter count, then broadcasts

        if (!pollId) return;

        try {
                const updatedOptions = await getOptionsWithCounts(pollId);
                const totalVoters = await prisma.vote.count({ where: { pollId: pollId } });

                const roomName = `poll-${pollId}`;

                io.to(roomName).emit('new-vote', {
                        options: updatedOptions,
                        voterCount: totalVoters
                });

                console.log(`Broadcast update for ${roomName}. Voters: ${totalVoters}`);
        }
        catch (error) {
                console.error(`Failed to broadcast updates for poll ${pollId}:`, error);
        }

}

// --- API Route Handlers ---

router.post('/polls', async (req: any, res: any) => {
        // POST /api/polls - Create a new poll
        console.debug('POST /api/polls', req.body);

        const { question, options } = req.body as CreatePollRequestBody;

        // Validation
        if (!question || typeof question !== 'string' || question.trim() === '') {
                return res.status(400).json({ message: 'Question must be a non-empty string.' });
        }
        if (!options || !Array.isArray(options) || options.length < 2 || options.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
                return res.status(400).json({ message: 'At least two valid, non-empty options are required.' });
        }

        try {
                const createdPoll = await prisma.poll.create({
                        data: {
                                question: question.trim(),
                                options: {
                                        create: options.map((option) => ({ text: option.trim() })),
                                },
                        }
                });
                res.status(201).json(createdPoll);
        }

        catch (error) {
                console.error('Failed to create poll:', error);
                res.status(500).json({ message: 'Internal Server Error: Could not create poll.' });
        }

        finally {
                await prisma.$disconnect();
        }

});

router.post('/polls/fetch', async (req: any, res: any) => {
        // POST /api/polls/fetch - Fetch a poll by id or shortCode

        console.debug('POST /api/polls/fetch', req.body);

        const { id, shortCode } = req.body;

        if (!id && !shortCode) {
                return res.status(400).json({ message: 'Either id or shortCode must be provided.' });
        }

        try {

                const poll = await prisma.poll.findFirst({
                        where: {
                                OR: [
                                        { id },
                                        { shortCode },
                                ],
                        }
                });

                if (!poll) {
                        return res.status(404).json({ message: 'Poll not found.' });
                }

                const optionsWithCounts = await getOptionsWithCounts(poll.id);
                const totalVoters = await prisma.vote.count({ where: { pollId: poll.id } });

                const responseData = {
                        ...poll,
                        options: optionsWithCounts,
                        voterCount: totalVoters,
                };

                res.status(200).json(responseData);
        } catch (error) {
                console.error('Failed to fetch poll:', error);
                res.status(500).json({ message: 'Internal Server Error: Could not fetch poll data.' });
        } finally {
                await prisma.$disconnect();
        }
});

router.post('/vote', async (req: any, res: any) => {
        // POST /api/vote - Submit or change a vote (anonymous)

        console.log('POST /api/vote', req.body);

        const { optionId, pollId, voterId } = req.body as VoteRequestBody;

        // Validation
        if (!optionId || !pollId || !voterId) {
                return res.status(400).json({ message: 'Missing required fields: optionId, pollId, voterIdentifier.' });
        }
        if (typeof optionId !== 'string' || typeof pollId !== 'string' || typeof voterId !== 'string') {
                return res.status(400).json({ message: 'Invalid data types provided.' });
        }

        let voteSuccessfullyProcessed = false;

        try {
                await prisma.vote.upsert({
                        where: { pollId_voterId: { pollId, voterId } },
                        update: { optionId },
                        create: { pollId, optionId, voterId }
                });
                voteSuccessfullyProcessed = true;
                res.status(200).json({ message: 'Vote processed successfully.' });
        }
        catch (error: any) {
                await prisma.$disconnect(); // Disconnect early on error
                console.error('Failed to process vote:', error);
                return res.status(500).json({ message: 'Internal Server Error: Could not process vote.' });
        }
        finally {
                await prisma.$disconnect();
        }

        if (voteSuccessfullyProcessed) {
                broadcastPollUpdates(pollId).catch(err => {
                        console.error(`Error during background broadcast trigger for poll ${pollId}:`, err);
                });
        }

});

export default router;