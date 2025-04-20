import CreatePollForm from '@/components/CreatePollForm';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

function HomePage() {
        return (
                <div className="flex justify-center items-start pt-10">
                        <Card className="w-full max-w-lg">
                                <CardHeader>
                                        <CardTitle>Create a New Live Poll</CardTitle>
                                        <CardDescription>Enter your question and options below.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                        <CreatePollForm />
                                </CardContent>
                        </Card>
                </div>
        );
}

export default HomePage;