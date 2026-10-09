import { Link } from 'react-router-dom';
import HeroPreview from '../components/landing/HeroPreview';
import {
    IconArrowRight,
    IconBook,
    IconChat,
    IconCheck,
    IconMegaphone,
    IconSparkle,
    IconUpload,
} from '../components/icons';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Reveal from '../components/ui/Reveal';
import Skeleton from '../components/ui/Skeleton';
import StatusBadge from '../components/ui/StatusBadge';
import { useAuth } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import { longDate } from '../lib/format';

const HIGHLIGHTS = [
    'PDF, Word, PowerPoint and text files',
    'Screened automatically before publishing',
    'A person reviews anything uncertain',
];

const STEPS = [
    {
        Icon: IconUpload,
        title: 'Upload a reviewer',
        description: 'Share your notes with a title, subject and year level so classmates can find them.',
    },
    {
        Icon: IconSparkle,
        title: 'It gets screened',
        description: 'The document itself is read and checked to confirm it is real study material.',
    },
    {
        Icon: IconBook,
        title: 'It reaches the library',
        description: 'Most uploads are published within seconds. Anything uncertain goes to an administrator first.',
    },
];

const OUTCOMES = [
    { status: 'APPROVED', text: 'Clearly study material. Published right away.' },
    { status: 'FLAGGED', text: 'Uncertain. An administrator takes a quick look.' },
    { status: 'REJECTED', text: 'Not a reviewer. Kept out of the library.' },
];

const SUBJECTS = ['Data Structures and Algorithms', 'Database Systems', 'Web Development'];

const CONCERN_TRAIL = ['SUBMITTED', 'UNDER REVIEW', 'IN PROGRESS', 'RESOLVED'];

const CARD_HOVER =
    'transition duration-300 hover:border-slate-300 hover:shadow-lg hover:shadow-navy-900/5 motion-safe:hover:-translate-y-1';

function SectionHeading({ eyebrow, title, description, className = '' }) {
    return (
        <div className={className}>
            {eyebrow && (
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-navy-600">{eyebrow}</p>
            )}
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
            {description && <p className="mt-2.5 text-base text-slate-500">{description}</p>}
        </div>
    );
}

function Hero() {
    return (
        <section className="relative overflow-hidden border-b border-slate-200">
            <div aria-hidden="true" className="bg-grid pointer-events-none absolute inset-0" />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-48 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-navy-100/70 blur-3xl"
            />

            <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:px-8 lg:pb-28 lg:pt-24">
                <div className="min-w-0">
                    <p className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white/80 px-3 py-1 text-xs font-medium text-navy-700 motion-safe:animate-fade-up">
                        <IconSparkle className="h-3.5 w-3.5" />
                        AI-screened reviewer library
                    </p>

                    <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-slate-900 motion-safe:animate-fade-up [animation-delay:80ms] sm:text-5xl lg:text-[3.4rem]">
                        Your Department. <span className="text-navy-700 sm:block">One Central Hub.</span>
                    </h1>

                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 motion-safe:animate-fade-up [animation-delay:160ms] sm:text-lg">
                        Access academic resources, share reviewers with your batch, and submit department
                        concerns &mdash; without chasing links across different group chats.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3 motion-safe:animate-fade-up [animation-delay:240ms]">
                        <Button to="/reviewers" size="lg" className="group shadow-sm shadow-navy-900/20">
                            Explore Reviewers
                            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Button>
                        <Button to="/register" variant="secondary" size="lg">
                            Get Started
                        </Button>
                    </div>

                    <ul className="mt-8 space-y-2 motion-safe:animate-fade-up [animation-delay:320ms]">
                        {HIGHLIGHTS.map((item) => (
                            <li key={item} className="flex items-center gap-2.5 text-sm text-slate-600">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <IconCheck className="h-3 w-3" />
                                </span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="min-w-0 motion-safe:animate-fade-up [animation-delay:300ms]">
                    <HeroPreview />
                </div>
            </div>
        </section>
    );
}

function HowItWorks() {
    return (
        <section className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="How it works"
                        title="From your notes to the whole batch"
                        description="Sharing a reviewer takes a minute. The checking happens on its own."
                        className="mx-auto max-w-2xl text-center"
                    />
                </Reveal>

                <div className="relative mt-12 grid gap-10 sm:grid-cols-3 sm:gap-6">
                    <div
                        aria-hidden="true"
                        className="absolute left-[16.67%] right-[16.67%] top-6 hidden h-px bg-gradient-to-r from-slate-200 via-navy-200 to-slate-200 sm:block"
                    />

                    {STEPS.map(({ Icon, title, description }, index) => (
                        <Reveal key={title} delay={index * 120} className="relative text-center">
                            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-navy-200 bg-white text-navy-700 shadow-sm">
                                <Icon className="h-5 w-5" />
                            </span>
                            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Step {index + 1}
                            </p>
                            <h3 className="mt-1 text-base font-semibold text-slate-900">{title}</h3>
                            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-slate-500">
                                {description}
                            </p>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Features() {
    return (
        <section className="bg-slate-50">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <Reveal>
                    <SectionHeading
                        eyebrow="What's inside"
                        title="Everything the department needs"
                        description="Four things, done well, for students and administrators alike."
                    />
                </Reveal>

                <div className="mt-10 grid gap-4 lg:grid-cols-3">
                    <Reveal className="lg:col-span-2">
                        <div className="relative h-full overflow-hidden rounded-card bg-navy-900 p-6 text-white sm:p-8">
                            <div aria-hidden="true" className="bg-grid-inverse pointer-events-none absolute inset-0" />
                            <div className="relative grid gap-8 sm:grid-cols-2 sm:items-center">
                                <div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                                        <IconSparkle className="h-5 w-5 text-navy-200" />
                                    </span>
                                    <h3 className="mt-5 text-xl font-semibold tracking-tight">AI-Powered Screening</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-navy-200">
                                        Uploads are checked automatically before publishing, so the library stays
                                        relevant without a long wait.
                                    </p>
                                </div>

                                <ul className="space-y-2.5">
                                    {OUTCOMES.map(({ status, text }) => (
                                        <li
                                            key={status}
                                            className="flex items-start gap-3 rounded-lg bg-white/5 p-3 ring-1 ring-white/10"
                                        >
                                            <StatusBadge status={status} className="mt-0.5 shrink-0" />
                                            <span className="text-sm leading-snug text-navy-100">{text}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Reveal>

                    <Reveal delay={100}>
                        <div className={`surface h-full p-6 ${CARD_HOVER}`}>
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                                <IconBook className="h-5 w-5" />
                            </span>
                            <h3 className="mt-5 text-base font-semibold text-slate-900">Academic Reviewers</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                                Browse reviewers by subject and year level, then download what you need for your
                                next exam.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {SUBJECTS.map((subject) => (
                                    <Badge key={subject} tone="navy">
                                        {subject}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </Reveal>

                    <Reveal>
                        <div className={`surface h-full p-6 ${CARD_HOVER}`}>
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                                <IconMegaphone className="h-5 w-5" />
                            </span>
                            <h3 className="mt-5 text-base font-semibold text-slate-900">Department Announcements</h3>
                            <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                                Examination schedules, deadlines and notices in one place instead of scattered
                                across group chats.
                            </p>
                        </div>
                    </Reveal>

                    <Reveal delay={100} className="lg:col-span-2">
                        <div className={`surface h-full p-6 ${CARD_HOVER}`}>
                            <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
                                <div>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                                        <IconChat className="h-5 w-5" />
                                    </span>
                                    <h3 className="mt-5 text-base font-semibold text-slate-900">Student Concerns</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                                        Report an issue with a classroom, laboratory or schedule and follow its
                                        status through to resolution.
                                    </p>
                                </div>

                                <ol className="space-y-2">
                                    {CONCERN_TRAIL.map((status, index) => (
                                        <li key={status} className="flex items-center gap-3">
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-500">
                                                {index + 1}
                                            </span>
                                            <StatusBadge status={status} />
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

function AnnouncementPreview({ announcement }) {
    return (
        <Link to="/announcements" className={`surface group flex h-full flex-col p-5 ${CARD_HOVER}`}>
            <p className="text-xs text-slate-400">{longDate(announcement.created_at)}</p>
            <h3 className="mt-2 text-[15px] font-semibold text-slate-900">{announcement.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{announcement.content}</p>
            <span className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-navy-700">
                Read more
                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
        </Link>
    );
}

function LatestAnnouncements() {
    const { data, loading } = useApi('/announcements', { params: { per_page: 3 } });
    const announcements = data?.data ?? [];

    // A public page has nothing useful to say about an empty or failed list.
    if (!loading && announcements.length === 0) return null;

    return (
        <section className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                <Reveal className="flex flex-wrap items-end justify-between gap-4">
                    <SectionHeading eyebrow="Notice board" title="Latest from the department" />
                    <Link
                        to="/announcements"
                        className="group inline-flex items-center gap-1.5 text-sm font-medium text-navy-700 hover:text-navy-900"
                    >
                        View all announcements
                        <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                </Reveal>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {loading
                        ? [0, 1, 2].map((index) => (
                              <div key={index} className="surface p-5">
                                  <Skeleton className="h-3 w-24" />
                                  <Skeleton className="mt-3 h-4 w-3/4" />
                                  <Skeleton className="mt-3 h-3.5 w-full" />
                                  <Skeleton className="mt-2 h-3.5 w-5/6" />
                              </div>
                          ))
                        : announcements.map((announcement, index) => (
                              <Reveal key={announcement.id} delay={index * 100}>
                                  <AnnouncementPreview announcement={announcement} />
                              </Reveal>
                          ))}
                </div>
            </div>
        </section>
    );
}

function ClosingCta() {
    const { isAuthenticated, isAdmin } = useAuth();

    const primary =
        'inline-flex items-center justify-center gap-2 rounded-md bg-white px-5 py-2.5 text-base font-medium text-navy-900 transition-colors hover:bg-navy-50';
    const secondary =
        'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-base font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/10';

    return (
        <section className="relative overflow-hidden bg-navy-900">
            <div aria-hidden="true" className="bg-grid-inverse pointer-events-none absolute inset-0" />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-40 left-1/2 h-80 w-[44rem] -translate-x-1/2 rounded-full bg-navy-500/30 blur-3xl"
            />

            <Reveal className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-8">
                <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    Bring your batch&rsquo;s notes together
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-navy-200">
                    Create an account to browse the library, share your own reviewers and raise concerns with
                    the department.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {isAuthenticated ? (
                        <Link to={isAdmin ? '/admin' : '/dashboard'} className={`group ${primary}`}>
                            Go to dashboard
                            <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    ) : (
                        <>
                            <Link to="/register" className={`group ${primary}`}>
                                Get Started
                                <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link to="/login" className={secondary}>
                                Sign in
                            </Link>
                        </>
                    )}
                </div>
            </Reveal>
        </section>
    );
}

export default function Landing() {
    return (
        <>
            <Hero />
            <HowItWorks />
            <Features />
            <LatestAnnouncements />
            <ClosingCta />
        </>
    );
}
