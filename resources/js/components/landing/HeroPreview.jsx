import { useEffect, useState } from 'react';
import { IconCheck, IconDocument, IconMegaphone, IconSearch, IconSparkle, IconUpload } from '../icons';
import Badge from '../ui/Badge';
import StatusBadge from '../ui/StatusBadge';

const PHASES = [
    { key: 'uploading', ms: 1700 },
    { key: 'screening', ms: 2800 },
    { key: 'approved', ms: 4400 },
];

const PHASE_COPY = {
    uploading: 'Uploading…',
    screening: 'AI is reading the document…',
    approved: 'Approved · 97% confidence',
};

const LIBRARY = [
    { title: 'Normalization and SQL Joins', subject: 'Database Systems', year: '2nd Year' },
    { title: 'Process Scheduling Summary', subject: 'Operating Systems', year: '3rd Year' },
];

function prefersReducedMotion() {
    return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

function useScreeningLoop() {
    const [reduced] = useState(prefersReducedMotion);
    // With reduced motion the preview rests on its finished state.
    const [index, setIndex] = useState(reduced ? PHASES.length - 1 : 0);

    useEffect(() => {
        if (reduced) return undefined;

        const timer = setTimeout(() => setIndex((current) => (current + 1) % PHASES.length), PHASES[index].ms);

        return () => clearTimeout(timer);
    }, [index, reduced]);

    return PHASES[index].key;
}

function PhaseIcon({ phase }) {
    if (phase === 'approved') return <IconCheck className="h-4 w-4 text-emerald-600" />;
    if (phase === 'screening') return <IconSparkle className="h-4 w-4 text-navy-600 motion-safe:animate-pulse" />;

    return <IconUpload className="h-4 w-4 text-navy-600" />;
}

function PhaseBar({ phase }) {
    if (phase === 'screening') {
        return <div className="h-full w-1/3 rounded-full bg-navy-400 motion-safe:animate-shimmer" />;
    }

    const tone = phase === 'approved' ? 'bg-emerald-500' : 'bg-navy-500';
    const motion = phase === 'uploading' ? 'origin-left motion-safe:animate-fill' : '';

    return <div className={`h-full w-full rounded-full ${tone} ${motion}`} />;
}

function UploadRow({ phase }) {
    const approved = phase === 'approved';

    return (
        <div
            className={`rounded-lg border p-3.5 transition-colors duration-500 ${
                approved ? 'border-emerald-200 bg-emerald-50/60' : 'border-navy-200 bg-navy-50/60'
            }`}
        >
            <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white ring-1 ring-slate-200">
                    <PhaseIcon phase={phase} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">Linked Lists and Trees.pdf</p>
                        <StatusBadge status={approved ? 'APPROVED' : 'PENDING'} className="shrink-0" />
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{PHASE_COPY[phase]}</p>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white ring-1 ring-slate-200/80">
                        <PhaseBar key={phase} phase={phase} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LibraryRow({ title, subject, year }) {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 ring-1 ring-slate-200">
                <IconDocument className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{title}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge tone="navy">{subject}</Badge>
                    <Badge>{year}</Badge>
                </div>
            </div>
            <StatusBadge status="APPROVED" className="hidden shrink-0 sm:inline-flex" />
        </div>
    );
}

export default function HeroPreview() {
    const phase = useScreeningLoop();

    return (
        <div aria-hidden="true" className="relative mx-auto w-full max-w-lg select-none lg:max-w-none">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-navy-100/70 via-white to-navy-50 blur-2xl" />

            <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-navy-900/10">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <span className="ml-3 flex-1 truncate rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200">
                        CCS Department Hub &middot; Reviewers
                    </span>
                </div>

                <div className="space-y-3 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-900">Reviewer Library</p>
                        <span className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1 text-xs text-slate-400">
                            <IconSearch className="h-3.5 w-3.5" />
                            Search reviewers
                        </span>
                    </div>

                    <UploadRow phase={phase} />

                    {LIBRARY.map((item) => (
                        <LibraryRow key={item.title} {...item} />
                    ))}
                </div>
            </div>

            <div className="absolute -bottom-12 left-3 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-xl shadow-navy-900/10 motion-safe:animate-float sm:-left-10">
                <div className="flex items-start gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-600">
                        <IconMegaphone className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Announcement</p>
                        <p className="mt-0.5 text-xs font-medium leading-snug text-slate-800">
                            Midterm examination schedule is now posted
                        </p>
                    </div>
                </div>
            </div>

            <div className="absolute right-3 -top-5 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-xl shadow-navy-900/10 motion-safe:animate-float [animation-delay:-3.5s] sm:-right-6">
                <p className="text-xs font-medium text-slate-700">Lab 2 projector</p>
                <StatusBadge status="RESOLVED" />
            </div>
        </div>
    );
}
