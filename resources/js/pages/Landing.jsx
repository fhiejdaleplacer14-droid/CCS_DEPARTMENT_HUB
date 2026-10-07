import Button from '../components/ui/Button';
import { IconBook, IconChat, IconMegaphone, IconSparkle } from '../components/icons';

const FEATURES = [
    {
        Icon: IconBook,
        title: 'Academic Reviewers',
        description:
            'Browse reviewers by subject and year level, then download what you need for your next exam.',
    },
    {
        Icon: IconSparkle,
        title: 'AI-Powered Screening',
        description:
            'Uploads are checked automatically before publishing, so the library stays relevant without a long wait.',
    },
    {
        Icon: IconChat,
        title: 'Student Concerns',
        description:
            'Report an issue with a classroom, laboratory or schedule and follow its status through to resolution.',
    },
    {
        Icon: IconMegaphone,
        title: 'Department Announcements',
        description:
            'Examination schedules, deadlines and notices in one place instead of scattered across group chats.',
    },
];

export default function Landing() {
    return (
        <>
            {/* Hero */}
            <section className="border-b border-slate-200">
                <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                            Your Department. One Central Hub.
                        </h1>
                        <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
                            Access academic resources, share reviewers with your batch, and submit department
                            concerns &mdash; without chasing links across different group chats.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <Button to="/reviewers" size="lg">
                                Explore Reviewers
                            </Button>
                            <Button to="/register" variant="secondary" size="lg">
                                Get Started
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="bg-slate-50">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                    <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                        Everything the department needs
                    </h2>
                    <p className="mt-1.5 text-sm text-slate-500">
                        Four things, done well, for students and administrators alike.
                    </p>

                    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {FEATURES.map(({ Icon, title, description }) => (
                            <div key={title} className="surface p-5">
                                <Icon className="h-6 w-6 text-navy-600" />
                                <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{title}</h3>
                                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
