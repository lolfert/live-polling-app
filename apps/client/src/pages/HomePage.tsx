import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import CreatePollForm from '@/components/CreatePollForm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

function HomePage() {

        const navigate = useNavigate();

        const [shortCode, setShortCode] = useState('');

        const handleJoinPoll = () => {
                if (shortCode) {
                        navigate(`/poll/${shortCode}`);
                }
        };

        return (
                <div className="flex flex-col items-center pt-10 space-y-6">
                        <div className="w-full max-w-lg">
                                <Card className="w-full">
                                        <CardHeader>
                                                <CardTitle>Create a New Live Poll</CardTitle>
                                                <CardDescription>Enter your question and options below.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                                <CreatePollForm />
                                        </CardContent>
                                </Card>
                        </div>

                        <div className="w-full max-w-lg">
                                <Card className="w-full">
                                        <CardHeader>
                                                <CardTitle>Join a Poll</CardTitle>
                                                <CardDescription>Enter a code to join an existing poll.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                                <div className="flex space-x-2">
                                                        <Input
                                                                type="text"
                                                                placeholder="Enter Poll Code"
                                                                value={shortCode}
                                                                onChange={(e) => setShortCode(e.target.value)}
                                                        />
                                                        <Button onClick={handleJoinPoll}>Join</Button>
                                                </div>
                                        </CardContent>
                                </Card>
                        </div>
                </div>
        );
}

export default HomePage;