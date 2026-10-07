import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { invalidate } from '../../lib/store';
import PageHeader from '../../components/PageHeader';
import { IconDocument } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Field from '../../components/ui/Field';
import Input, { Select, Textarea } from '../../components/ui/Input';
import { fileSize } from '../../lib/format';

export default function SubmitConcern() {
    const navigate = useNavigate();
    const fileInput = useRef(null);

    const [form, setForm] = useState({ title: '', category: '', description: '', location: '' });
    const [attachment, setAttachment] = useState(null);
    const [options, setOptions] = useState({
        categories: [],
        allowed_extensions: [],
        max_attachment_size_kb: 5120,
    });

    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api.get('/concerns/categories')
            .then(({ data }) => setOptions(data))
            .catch(() => setMessage('The form options could not be loaded. Please refresh the page.'));
    }, []);

    const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage(null);

        const payload = new FormData();

        Object.entries(form).forEach(([key, value]) => payload.append(key, value));

        if (attachment) {
            payload.append('attachment', attachment);
        }

        try {
            const { data } = await api.post('/concerns', payload);

            invalidate('/concerns', '/dashboard');
            navigate(`/concerns/${data.concern.id}`, { replace: true, state: { flash: data.message } });
        } catch (error) {
            setErrors(fieldErrors(error));
            setMessage(errorMessage(error, 'Your concern could not be submitted.'));
        } finally {
            setSubmitting(false);
        }
    };

    const maxMb = (options.max_attachment_size_kb / 1024).toFixed(0);
    const accept = options.allowed_extensions.map((extension) => `.${extension}`).join(',');

    return (
        <>
            <PageHeader
                title="Submit a Concern"
                description="Tell the department about an issue so it can be looked into."
                backTo="/concerns"
                backLabel="Back to concerns"
            />

            {message && (
                <Alert tone="error" className="mb-6">
                    {message}
                </Alert>
            )}

            <Card className="max-w-3xl p-5 sm:p-6">
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <Field label="Title" htmlFor="title" error={errors.title} required>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={update('title')}
                            invalid={Boolean(errors.title)}
                            placeholder="e.g. Internet connection problem"
                            disabled={submitting}
                            required
                        />
                    </Field>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Category" htmlFor="category" error={errors.category} required>
                            <Select
                                id="category"
                                value={form.category}
                                onChange={update('category')}
                                invalid={Boolean(errors.category)}
                                disabled={submitting}
                                required
                            >
                                <option value="">Select a category</option>
                                {options.categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        <Field
                            label="Location"
                            htmlFor="location"
                            error={errors.location}
                            hint="Optional. Where is the issue?"
                        >
                            <Input
                                id="location"
                                value={form.location}
                                onChange={update('location')}
                                invalid={Boolean(errors.location)}
                                placeholder="e.g. Computer Laboratory 2"
                                disabled={submitting}
                            />
                        </Field>
                    </div>

                    <Field
                        label="Description"
                        htmlFor="description"
                        error={errors.description}
                        hint="Describe what is happening, and when it started."
                        required
                    >
                        <Textarea
                            id="description"
                            rows={6}
                            value={form.description}
                            onChange={update('description')}
                            invalid={Boolean(errors.description)}
                            disabled={submitting}
                            required
                        />
                    </Field>

                    <Field
                        label="Attachment"
                        htmlFor="attachment"
                        error={errors.attachment}
                        hint={`Optional. ${options.allowed_extensions.join(', ').toUpperCase()} up to ${maxMb} MB.`}
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <label
                                htmlFor="attachment"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                <IconDocument className="h-4 w-4 text-slate-400" />
                                {attachment ? 'Replace file' : 'Choose file'}
                                <input
                                    id="attachment"
                                    ref={fileInput}
                                    type="file"
                                    accept={accept}
                                    className="sr-only"
                                    disabled={submitting}
                                    onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
                                />
                            </label>

                            {attachment && (
                                <div className="flex min-w-0 items-center gap-2 text-sm">
                                    <span className="truncate font-medium text-slate-900">{attachment.name}</span>
                                    <span className="shrink-0 text-slate-500">{fileSize(attachment.size)}</span>
                                    <button
                                        type="button"
                                        className="shrink-0 text-slate-400 hover:text-red-600"
                                        onClick={() => {
                                            setAttachment(null);

                                            if (fileInput.current) fileInput.current.value = '';
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                    </Field>

                    <div className="flex gap-3 border-t border-slate-100 pt-5">
                        <Button type="submit" size="lg" loading={submitting}>
                            {submitting ? 'Submitting concern...' : 'Submit concern'}
                        </Button>
                        <Button variant="secondary" size="lg" to="/concerns">
                            Cancel
                        </Button>
                    </div>
                </form>
            </Card>
        </>
    );
}
