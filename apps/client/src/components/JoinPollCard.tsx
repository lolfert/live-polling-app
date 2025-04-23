import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';

function JoinPollCard() {
    const navigate = useNavigate();
    const [shortCode, setShortCode] = useState('');

    const handleJoinPoll = () => {
        if (shortCode) {
            navigate(`/poll/${shortCode}`);
        }
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Join a Live Poll</CardTitle>
                <CardDescription>Enter a code to join an existing poll.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col justify-center align-items-stretch items-center-safe gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className='w-full'>Enter Code</Button>
                        </DialogTrigger>
                        <DialogContent className="w-fit">
                            <DialogHeader>
                                <DialogTitle>Enter Poll Code</DialogTitle>
                            </DialogHeader>
                            <InputOTP
                                className="text-lg"
                                maxLength={6}
                                pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
                                value={shortCode}
                                onChange={(sc) => setShortCode(sc.toUpperCase())}
                            >
                                <InputOTPGroup>
                                    {[...Array(6)].map((_, index) => (
                                        <InputOTPSlot
                                            key={index}
                                            index={index}
                                            className="h-12 w-12 text-center text-lg font-semibold"
                                        />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            <Button className='w-full mt-4' onClick={handleJoinPoll}>Join Poll</Button>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}

export default JoinPollCard;