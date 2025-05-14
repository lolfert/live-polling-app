import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import PollResults from '@/components/PollResults';
import { Clipboard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

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
        endTime: string | null;
}
const VOTER_ID_KEY = 'pollAppVoterId';

function PollPage() {

        const navigate = useNavigate();

        const { shortCode } = useParams<{ shortCode: string }>();

        const [poll, setPoll] = useState<PollData | null>(null);
        const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => getInitialVotedOption(shortCode));
        const [participantCount, setParticipantCount] = useState<number>(0);
        const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
        const [isPollActive, setIsPollActive] = useState<boolean>(true);

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

        // Poll Status and Time Remaining Effect
        useEffect(() => {
                if (!poll || !poll.endTime) return;

                const checkPollStatus = () => {
                        const now = new Date();
                        const endTime = new Date(poll.endTime as string);

                        // Check if poll has ended
                        if (now >= endTime) {
                                setIsPollActive(false);
                                setTimeRemaining(null);
                                return;
                        }

                        // Calculate remaining time
                        const remainingMs = endTime.getTime() - now.getTime();
                        const remainingSeconds = Math.floor(remainingMs / 1000);

                        if (remainingSeconds <= 0) {
                                setIsPollActive(false);
                                setTimeRemaining(null);
                                return;
                        }

                        // Format time remaining
                        const minutes = Math.floor(remainingSeconds / 60);
                        const seconds = remainingSeconds % 60;

                        if (minutes > 0) {
                                setTimeRemaining(`${minutes}m ${seconds}s`);
                        } else {
                                setTimeRemaining(`${seconds}s`);
                        }

                        setIsPollActive(true);
                };

                // Check immediately
                checkPollStatus();

                // Set interval to update every second
                const intervalId = setInterval(checkPollStatus, 1000);

                // Clean up interval on unmount
                return () => clearInterval(intervalId);
        }, [poll]);

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

        const handleCopyToClipboard = () => {
                if (poll?.shortCode) {
                        navigator.clipboard.writeText(poll.shortCode)
                                .then(() => {
                                        toast.success("Copied to clipboard!");
                                })
                                .catch((err) => {
                                        console.error("Could not copy text: ", err);
                                        toast.error("Copy Error", { description: "Could not copy to clipboard. Please try again." });
                                });
                }
        };

        if (isLoading || error || !poll) {
                return (
                        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                                {isLoading ? (
                                        <Spinner size="medium" />
                                ) : error ? (
                                        <p className="text-red-600 text-center">Error: {error}</p>
                                ) : (
                                        <p className="text-center">Poll not found.</p>
                                )}
                        </div>
                );
        }

        return (
                <div className="space-y-4">

                        {poll.endTime && (
                                <div className="text-sm flex justify-between items-center">
                                        <Badge variant={isPollActive ? "default" : "destructive"} className={`text-sm px-3 py-1 rounded-md inline-block ${isPollActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'}`}>
                                                {isPollActive ? (
                                                        <>Poll Open • Closes in {timeRemaining}</>
                                                ) : (
                                                        <>Poll closed</>
                                                )}
                                        </Badge>
                                        <div className="flex items-center space-x-2">
                                                <span className="text-sm">Join Code: <span className="font-semibold text-primary">{poll.shortCode}</span></span>
                                                <Button variant="outline" size="icon" onClick={handleCopyToClipboard} className="text-sm w-7 h-7 p-1">
                                                        <Clipboard className="w-2 h-2" />
                                                </Button>
                                        </div>
                                </div>
                        )}

                        <Card>
                                <CardHeader>
                                        <CardTitle className="text-xl md:text-2xl">{poll.question}</CardTitle>
                                        <CardDescription>
                                                {isPollActive ? (
                                                        <>Select an option below to cast your vote. Results update live.</>
                                                ) : (
                                                        <>This poll has ended. No more votes can be submitted.</>
                                                )}
                                        </CardDescription>
                                </CardHeader>
                        </Card>

                        <Card>
                                <CardHeader>
                                        <CardTitle>Options</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-6">
                                        {poll.options.sort((a, b) => a.text.localeCompare(b.text)).map((option) => (
                                                <Button
                                                        key={option.id}
                                                        variant={selectedOptionId === option.id ? "default" : "outline"}
                                                        className="w-full justify-start text-left h-auto py-3"
                                                        onClick={() => handleVote(option.id)}
                                                        disabled={isVoting || !isPollActive}
                                                >
                                                        {option.text}
                                                </Button>
                                        ))}
                                </CardContent>
                        </Card>

                        <Card>
                                <CardHeader>
                                        <CardTitle>Results</CardTitle>
                                </CardHeader>
                                <CardContent>
                                        <PollResults options={poll.options} />
                                </CardContent>
                                <CardFooter className="text-sm font-semibold flex justify-between">
                                        <span>People Here Now: {participantCount}</span>
                                        <span>Total Votes: {poll.voterCount}</span>
                                </CardFooter>
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