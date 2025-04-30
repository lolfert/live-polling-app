import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import PollResults from '@/components/PollResults';

interface Option {
        id: string;
        text: string;
        _count?: { votes: number };
}

interface PollData {
        id: string;
        shortCode: string;
        question: string;
        options: Option[];
        voterCount: number;
}
const VOTER_ID_KEY = 'pollAppVoterId';

function PollPage() {

        const navigate = useNavigate();

        const { shortCode } = useParams<{ shortCode: string }>();

        const [poll, setPoll] = useState<PollData | null>(null);
        const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => getInitialVotedOption(shortCode));
        const [participantCount, setParticipantCount] = useState<number>(0);

        const [isVoting, setIsVoting] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        const socketRef = useRef<Socket | null>(null);
        const voterIdRef = useRef<string>(getVoterId());

        const { id: pollId } = poll || {};

        // Fetch Initial Data Effect
        useEffect(() => {

                if (!shortCode) {
                        setError("Invalid Poll ShortCode.");
                        setIsLoading(false);
                        return;
                }

                setIsLoading(true);

                fetch(`/api/polls/fetch`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ shortCode }),
                })
                        .then(async (res) => {
                                if (!res.ok) {
                                        const errData = await res.json().catch(() => ({}));
                                        throw new Error(errData.message || `Error fetching poll: ${res.statusText}`);
                                }
                                return res.json();
                        })
                        .then((data: PollData) => {
                                setPoll(data);
                                setError(null);
                        })
                        .catch((err) => {
                                console.error("Fetch error:", err);
                                const errorMsg = err.message || "Could not load poll data.";
                                setError(errorMsg);
                                toast.error("Error Loading Poll", { description: errorMsg });
                        })
                        .finally(() => setIsLoading(false));

        }, [shortCode]);

        // WebSocket Connection & Listeners Effect
        useEffect(() => {

                if (!pollId || socketRef.current) return;

                console.debug('Setting up WebSocket connection...');

                const socket = io({
                        path: '/socket.io',
                        reconnectionAttempts: 5,
                        reconnectionDelay: 2500
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                        console.debug('Socket connected:', socket.id);
                        if (pollId) {
                                socket.emit('joinPoll', `poll-${pollId}`);
                        }
                        toast.success("Connected for live updates!");
                });

                socket.on('disconnect', (reason) => {
                        console.debug('Socket disconnected:', reason);
                        toast.warning("Disconnected", { description: `Real-time updates paused.` });
                });

                socket.on('connect_error', (err) => {
                        console.error('Socket connection error:', err);
                        const errorMsg = 'Could not connect for real-time updates.';
                        setError(errorMsg);
                        toast.error("Connection Error", { description: errorMsg });
                });

                socket.on('new-vote', (data: { options: Option[]; voterCount: number }) => {
                        console.debug('Received new-vote event:', data);
                        setPoll(prevData => prevData ? ({ ...prevData, options: data.options, voterCount: data.voterCount }) : null);
                });

                socket.on('participant-update', (data: { participantCount: number }) => {
                        console.debug('Received participant-update event:', data);
                        setParticipantCount(data.participantCount);
                });

                return () => {
                        if (socketRef.current) {
                                console.debug('Disconnecting socket...');
                                socketRef.current.disconnect();
                                socketRef.current = null;
                        }
                };

        }, [pollId]);

        // Handle Voting Callback
        const handleVote = useCallback(async (optionId: string) => {

                if (poll === null || isVoting) return;

                const { id, shortCode } = poll;

                console.debug('Submitting vote for option:', { id, shortCode, optionId, voterId: voterIdRef.current });

                setIsVoting(true);
                setSelectedOptionId(optionId);

                try {

                        const response = await fetch(`/api/vote`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        pollId: poll.id,
                                        optionId,
                                        voterId: voterIdRef.current,
                                }),
                        });

                        if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.message || `Failed to submit vote: ${response.statusText}`);
                        }

                        storeLastVotedOption(shortCode, optionId)
                        console.debug('Vote submitted successfully for option:', optionId);
                        toast.success("Vote registered!");

                }
                catch (error) {
                        console.error("Voting error:", error);
                        toast.error("Voting Error", { description: "Could not submit vote. Please try again." });
                        setSelectedOptionId(null);
                }
                finally {
                        setIsVoting(false);
                }

        }, [poll, isVoting]);

        // Render Logic
        if (isLoading) return <p className="text-center pt-10">Loading poll...</p>;
        if (error && !poll) return <p className="text-red-600 text-center pt-10">Error: {error}</p>; // Show only error if no data at all
        if (!poll) return <p className="text-center pt-10">Poll not found.</p>;

        return (
                <div className="space-y-6">
                        <Card>
                                <CardHeader>
                                        <CardTitle className="text-xl md:text-2xl">{poll.question}</CardTitle>
                                        <CardDescription>
                                                Select an option below to cast your vote. Results update live.
                                        </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                        <div className="text-center text-sm text-muted-foreground mb-4">
                                                Poll Code: <span className="font-semibold text-primary">{poll.shortCode}</span>
                                        </div>
                                        {poll.options.sort((a, b) => a.text.localeCompare(b.text)).map((option) => (
                                                <Button
                                                        key={option.id}
                                                        variant={selectedOptionId === option.id ? "default" : "outline"}
                                                        className="w-full justify-start text-left h-auto py-3"
                                                        onClick={() => handleVote(option.id)}
                                                        disabled={isVoting}
                                                >
                                                        {option.text}
                                                </Button>
                                        ))}
                                </CardContent>
                                <CardFooter className="text-sm text-muted-foreground flex justify-between">
                                        <span>Live participants: {participantCount}</span>
                                        <span>Total voters: {poll.voterCount}</span>
                                </CardFooter>
                        </Card>

                        <Card>
                                <CardHeader>
                                        <CardTitle>Live Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <PollResults options={poll.options} />
                                </CardContent>
                        </Card>

                        <Button variant="secondary" onClick={() => navigate('/')}>
                                Create Another Poll
                        </Button>
                </div>
        );
}

const getVoterId = (): string => {
        let id = localStorage.getItem(VOTER_ID_KEY);
        if (!id) {
                id = uuidv4();
                localStorage.setItem(VOTER_ID_KEY, id);
        }
        return id;
};

const getLastVotedOptionKey = (pollId: string): string => `poll-${pollId}-lastVote`;

const getInitialVotedOption = (pollId: string | undefined): string | null => {
        if (!pollId) return null;
        try {
                return localStorage.getItem(getLastVotedOptionKey(pollId));
        } catch (error) {
                console.error("Could not read last vote from localStorage:", error);
                return null;
        }
};

const storeLastVotedOption = (pollId: string | undefined, optionId: string) => {
        if (!pollId) return;
        try {
                localStorage.setItem(getLastVotedOptionKey(pollId), optionId);
        } catch (error) {
                console.error("Could not save last vote to localStorage:", error);
        }
};

export default PollPage;