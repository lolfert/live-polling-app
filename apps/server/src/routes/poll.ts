import { io } from '../index';
import { PrismaClient } from '@prisma/client';
import * as express from "express";

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

function handleError(res: express.Response, error: unknown, message: string, statusCode: number = 500) {
        console.error(message, error);
        res.status(statusCode).json({ message });
}

// --- API Route Handlers ---

router.post('/polls/create', async (req: express.Request, res: express.Response): Promise<void> => {

        console.debug('POST /api/polls/create', req.body);

        const { question, options } = req.body as CreatePollRequestBody;

        // Validation
        if (!question || typeof question !== 'string' || question.trim() === '') {
                res.status(400).json({ message: 'Question must be a non-empty string.' });
                return
        }
        if (!options || !Array.isArray(options) || options.length < 2 || options.some(opt => typeof opt !== 'string' || opt.trim() === '')) {
                res.status(400).json({ message: 'At least two valid, non-empty options are required.' });
                return
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
                handleError(res, error, 'Failed to create poll.');
        }

        finally {
                await prisma.$disconnect();
        }

});


router.post('/polls/fetch', async (req: express.Request, res: express.Response): Promise<void> => {

        console.debug('POST /api/polls/fetch', req.body);

        const { id, shortCode } = req.body;

        if (!id && !shortCode) {
                res.status(400).json({ message: 'Either id or shortCode must be provided.' });
                return
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
                        res.status(404).json({ message: 'Poll not found.' });
                        return
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
                handleError(res, error, 'Failed to fetch poll.');
        } finally {
                await prisma.$disconnect();
        }
});


router.post('/vote', async (req: express.Request, res: express.Response): Promise<void> => {

        console.debug('POST /api/vote', req.body);

        const { optionId, pollId, voterId } = req.body as VoteRequestBody;

        // Validation
        if (!optionId || !pollId || !voterId) {
                res.status(400).json({ message: 'Missing required fields: optionId, pollId, voterIdentifier.' });
                return
        }
        if (typeof optionId !== 'string' || typeof pollId !== 'string' || typeof voterId !== 'string') {
                res.status(400).json({ message: 'Invalid data types provided.' });
                return
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
                handleError(res, error, 'Failed to process vote.');
                return
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