import { Progress } from '@/components/ui/progress';

interface Option {
        id: string;
        text: string;
        _count?: { votes: number };
}

interface PollResultsProps {
        options: Option[];
}

function PollResults({ options }: PollResultsProps) {

        const totalVotes = options.reduce((sum, option) => sum + (option._count?.votes || 0), 0);

        return (
                <div className="space-y-4">
                        {options.length > 0 ? (
                                options.sort((a, b) => (b._count?.votes || 0) - (a._count?.votes || 0)).map((option) => {
                                        const voteCount = option._count?.votes || 0;
                                        const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

                                        return (
                                                <div key={option.id} className="space-y-1">
                                                        <div className="flex justify-between text-sm font-medium">
                                                                <span>{option.text}</span>
                                                                <span>{voteCount} vote(s) ({percentage}%)</span>
                                                        </div>
                                                        <Progress value={percentage} className="h-3" />
                                                </div>
                                        );
                                })
                        ) : (
                                <p className="text-muted-foreground">No results yet.</p>
                        )}
                </div>
        );
}

export default PollResults;