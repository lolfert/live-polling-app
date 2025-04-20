import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import PollResults from '@/components/PollResults';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

interface Option {
        id: string;
        text: string;
        _count?: { votes: number };
}

interface PollData {
        id: string;
        question: string;
        options: Option[];
        voterCount: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8000';

const VOTER_ID_KEY = 'pollAppVoterId';

function PollPage() {

        const navigate = useNavigate();

        const { pollId } = useParams<{ pollId: string }>();

        const [pollData, setPollData] = useState<PollData | null>(null);
        const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => getInitialVotedOption(pollId));
        const [participantCount, setParticipantCount] = useState<number>(0);

        const [isVoting, setIsVoting] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);

        const socketRef = useRef<Socket | null>(null);
        const voterIdRef = useRef<string>(getVoterId());

        // Fetch Initial Data Effect
        useEffect(() => {

                if (!pollId) {
                        setError("Invalid Poll ID.");
                        setIsLoading(false);
                        return;
                }

                setIsLoading(true);

                fetch(`${API_BASE_URL}/polls/${pollId}`)
                        .then(async (res) => {
                                if (!res.ok) {
                                        const errData = await res.json().catch(() => ({}));
                                        throw new Error(errData.message || `Error fetching poll: ${res.statusText}`);
                                }
                                return res.json();
                        })
                        .then((data: PollData) => {
                                setPollData(data);
                                setError(null);
                        })
                        .catch((err) => {
                                console.error("Fetch error:", err);
                                const errorMsg = err.message || "Could not load poll data.";
                                setError(errorMsg);
                                // Use sonner toast API
                                toast.error("Error Loading Poll", { description: errorMsg });
                        })
                        .finally(() => setIsLoading(false));

        }, [pollId]);

        // WebSocket Connection & Listeners Effect
        useEffect(() => {

                if (!pollId) return;

                const socket = io(WEBSOCKET_URL, {
                        reconnectionAttempts: 5, // Example: Limit reconnection attempts
                        reconnectionDelay: 2500, // Example: Delay before retry
                });

                socketRef.current = socket;

                socket.on('connect', () => {
                        console.debug('Socket connected:', socket.id);
                        socket.emit('joinPoll', `poll-${pollId}`);
                        toast.success("Connected for live updates!");
                });

                socket.on('disconnect', (reason) => {
                        console.debug('Socket disconnected:', reason);
                        toast.warning("Disconnected", { description: `Real-time updates paused (${reason}).` });
                });

                socket.on('connect_error', (err) => {
                        console.error('Socket connection error:', err);
                        const errorMsg = 'Could not connect for real-time updates.';
                        setError(errorMsg);
                        toast.error("Connection Error", { description: errorMsg });
                });

                socket.on('new-vote', (data: { options: Option[]; voterCount: number }) => {
                        console.log('Received new-vote event:', data);
                        setPollData(prevData => prevData ? ({ ...prevData, options: data.options, voterCount: data.voterCount }) : null);
                });

                socket.on('participant-update', (data: { participantCount: number }) => {
                        console.log('Received participant-update event:', data);
                        setParticipantCount(data.participantCount);
                });

                return () => {
                        if (socketRef.current) {
                                console.log('Disconnecting socket...');
                                socketRef.current.disconnect();
                                socketRef.current = null;
                        }
                };

        }, [pollId]);

        // Handle Voting Callback
        const handleVote = useCallback(async (optionId: string) => {

                console.debug('Submitting vote for option:', { pollId, optionId, voterId: voterIdRef.current });

                if (!pollId || isVoting) return;

                setIsVoting(true);
                setSelectedOptionId(optionId);

                try {

                        const response = await fetch(`${API_BASE_URL}/vote`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                        pollId,
                                        optionId,
                                        voterId: voterIdRef.current,
                                }),
                        });

                        if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.message || `Failed to submit vote: ${response.statusText}`);
                        }

                        storeLastVotedOption(pollId, optionId)
                        console.log('Vote submitted successfully for option:', optionId);
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

        }, [pollId, isVoting]); // Dependencies

        // Render Logic
        if (isLoading) return <p className="text-center pt-10">Loading poll...</p>;
        if (error && !pollData) return <p className="text-red-600 text-center pt-10">Error: {error}</p>; // Show only error if no data at all
        if (!pollData) return <p className="text-center pt-10">Poll not found.</p>;

        return (
                <div className="space-y-6">
                        <Card>
                                <CardHeader>
                                        <CardTitle className="text-xl md:text-2xl">{pollData.question}</CardTitle>
                                        <CardDescription>
                                                Select an option below to cast your vote. Results update live.
                                        </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                        {pollData.options.map((option) => (
                                                <Button
                                                        key={option.id}
                                                        variant={selectedOptionId === option.id ? "default" : "outline"} // Highlight selected
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
                                        <span>{voterIdRef.current}</span>
                                        <span>Total voters: {pollData.voterCount}</span>
                                </CardFooter>
                        </Card>

                        <Card>
                                <CardHeader>
                                        <CardTitle>Live Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <PollResults options={pollData.options} />
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