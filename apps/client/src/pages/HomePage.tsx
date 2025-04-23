import StartPollCard from '@/components/StartPollCard';
import JoinPollCard from '@/components/JoinPollCard';

function HomePage() {
        return (
                <div className="flex flex-col items-center pt-10 space-y-6">
                        <div className="w-full max-w-lg">
                                <StartPollCard />
                        </div>
                        <div className="w-full max-w-lg">
                                <JoinPollCard />
                        </div>
                </div>
        );
}

export default HomePage;