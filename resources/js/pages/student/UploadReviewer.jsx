import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { invalidate } from '../../lib/store';
import PageHeader from '../../components/PageHeader';
import { IconDocument, IconSparkle, IconUpload } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Input, { Select, Textarea } from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import { fileSize } from '../../lib/format';

const EMPTY = { title: '', description: '', subject: '', year_level: '' };

export default function UploadReviewer() {
    const navigate = useNavigate();
    const fileInput = useRef(null);

    const [form, setForm] = useState(EMPTY);
    const [file, setFile] = useState(null);
    const [options, setOptions] = useState({
        subjects: [],
        year_levels: [],
        allowed_extensions: [],
        max_file_size_kb: 10240,
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [stage, setStage] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        api.get('/reviewers/filters')
            .then(({ data }) => setOptions(data))
            .catch(() => setMessage('The upload options could not be loaded. Please refresh the page.'));
    }, []);

    const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setMessage(null);

        if (!file) {
            setErrors({ file: 'Choose a file to upload.' });

            return;
        }

        const payload = new FormData();

        payload.append('title', form.title);
        payload.append('description', form.description);
        payload.append('subject', form.subject);
        payload.append('year_level', form.year_level);
        payload.append('file', file);

        setStage('uploading');

        try {
            const { data } = await api.post('/reviewers', payload, {
                onUploadProgress: (event) => {
                    if (event.total && event.loaded >= event.total) {
                        setStage('analyzing');
                    }
                },
            });

            invalidate('/reviewers', '/dashboard');
            setResult(data);
            setForm(EMPTY);
            setFile(null);

            if (fileInput.current) fileInput.current.value = '';
        } catch (error) {
            setErrors(fieldErrors(error));
            setMessage(errorMessage(error, 'Your reviewer could not be uploaded.'));
        } finally {
            setStage(null);
        }
    };

    const busy = stage !== null;
    const maxMb = (options.max_file_size_kb / 1024).toFixed(0);
    const accept = options.allowed_extensions.map((extension) => `.${extension}`).join(',');

    if (result) {
        const status = result.reviewer.status;
        const tone = status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'warning';

        return (
            <>
                <PageHeader title="Upload complete" backTo="/reviewers" backLabel="Back to reviewers" />

                <Card className="p-6">
                    <Alert tone={tone} title={result.message} />

                    {result.reviewer.ai?.reason && (
                        <div className="mt-5 flex items-start gap-3 rounded-md bg-slate-50 p-4">
                            <IconSparkle className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
                            <div>
                                <p className="text-sm font-medium text-slate-900">AI screening note</p>
                                <p className="mt-1 text-sm text-slate-600">{result.reviewer.ai.reason}</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button to={`/reviewers/${result.reviewer.id}`}>View reviewer</Button>
                        <Button variant="secondary" onClick={() => setResult(null)}>
                            Upload another
                        </Button>
                        <Button variant="ghost" to="/reviewers?mine=1">
                            My uploads
                        </Button>
                    </div>
                </Card>
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Upload Reviewer"
                description="Share study material with the department. Uploads are screened automatically before publishing."
                backTo="/reviewers"
                backLabel="Back to reviewers"
            />

            {message && (
                <Alert tone="error" className="mb-6">
                    {message}
                </Alert>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 p-5 sm:p-6">
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                        <Field label="Title" htmlFor="title" error={errors.title} required>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={update('title')}
                                invalid={Boolean(errors.title)}
                                placeholder="e.g. Database Systems Midterm Reviewer"
                                disabled={busy}
                                required
                            />
                        </Field>

                        <Field
                            label="Description"
                            htmlFor="description"
                            error={errors.description}
                            hint="Optional. A short note on what the reviewer covers."
                        >
                            <Textarea
                                id="description"
                                value={form.description}
                                onChange={update('description')}
                                invalid={Boolean(errors.description)}
                                placeholder="Covers normalization, SQL joins and ERD basics."
                                disabled={busy}
                            />
                        </Field>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field label="Subject" htmlFor="subject" error={errors.subject} required>
                                <Select
                                    id="subject"
                                    value={form.subject}
                                    onChange={update('subject')}
                                    invalid={Boolean(errors.subject)}
                                    disabled={busy}
                                    required
                                >
                                    <option value="">Select a subject</option>
                                    {options.subjects.map((subject) => (
                                        <option key={subject} value={subject}>
                                            {subject}
                                        </option>
                                    ))}
                                </Select>
                            </Field>

                            <Field label="Year level" htmlFor="year_level" error={errors.year_level} required>
                                <Select
                                    id="year_level"
                                    value={form.year_level}
                                    onChange={update('year_level')}
                                    invalid={Boolean(errors.year_level)}
                                    disabled={busy}
                                    required
                                >
                                    <option value="">Select a year level</option>
                                    {options.year_levels.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        </div>

                        <Field
                            label="File"
                            htmlFor="file"
                            error={errors.file}
                            hint={`${options.allowed_extensions.join(', ').toUpperCase()} up to ${maxMb} MB.`}
                            required
                        >
                            <label
                                htmlFor="file"
                                className={`flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed px-5 py-8 text-center transition-colors ${
                                    errors.file
                                        ? 'border-red-300 bg-red-50/40'
                                        : 'border-slate-300 bg-slate-50/60 hover:border-navy-300 hover:bg-navy-50/40'
                                }`}
                            >
                                {file ? (
                                    <>
                                        <IconDocument className="h-6 w-6 text-navy-600" />
                                        <p className="mt-2 text-sm font-medium text-slate-900">{file.name}</p>
                                        <p className="text-xs text-slate-500">{fileSize(file.size)} &middot; Click to replace</p>
                                    </>
                                ) : (
                                    <>
                                        <IconUpload className="h-6 w-6 text-slate-400" />
                                        <p className="mt-2 text-sm font-medium text-slate-700">
                                            Choose a file to upload
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {options.allowed_extensions.join(', ').toUpperCase()}
                                        </p>
                                    </>
                                )}
                                <input
                                    id="file"
                                    ref={fileInput}
                                    type="file"
                                    accept={accept}
                                    className="sr-only"
                                    disabled={busy}
                                    onChange={(event) => {
                                        setFile(event.target.files?.[0] ?? null);
                                        setErrors((current) => ({ ...current, file: undefined }));
                                    }}
                                />
                            </label>
                        </Field>

                        {busy ? (
                            <div className="flex items-center gap-3 rounded-md bg-navy-50 px-4 py-3 text-sm text-navy-800">
                                <Spinner className="h-4 w-4" />
                                {stage === 'uploading' ? 'Uploading your file...' : 'Analyzing reviewer...'}
                            </div>
                        ) : (
                            <div className="flex gap-3">
                                <Button type="submit" size="lg">
                                    Upload reviewer
                                </Button>
                                <Button variant="secondary" size="lg" to="/reviewers">
                                    Cancel
                                </Button>
                            </div>
                        )}
                    </form>
                </Card>

                <aside>
                    <Card className="p-5">
                        <h2 className="text-sm font-semibold text-slate-900">How screening works</h2>
                        <ol className="mt-3 space-y-3 text-sm text-slate-600">
                            {[
                                'Your file is validated and stored securely.',
                                'AI screening checks that it is academic review material.',
                                'The department publishes it, or holds it for a quick manual check.',
                            ].map((step, index) => (
                                <li key={step} className="flex gap-3">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-100 text-xs font-medium text-navy-800">
                                        {index + 1}
                                    </span>
                                    {step}
                                </li>
                            ))}
                        </ol>
                        <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500">
                            Most uploads are published within seconds. You can follow the status under{' '}
                            <Link to="/reviewers?mine=1" className="font-medium text-navy-700 hover:text-navy-800">
                                My uploads
                            </Link>
                            .
                        </p>
                    </Card>
                </aside>
            </div>
        </>
    );
}
