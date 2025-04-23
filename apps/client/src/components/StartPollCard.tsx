import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import CreatePollForm from '@/components/CreatePollForm';

function StartPollCard() {
    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Start a Live Poll</CardTitle>
                <CardDescription>Enter your question and options below.</CardDescription>
            </CardHeader>
            <CardContent>
                <CreatePollForm />
            </CardContent>
        </Card>
    );
}

export default StartPollCard;