import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../lib/api';
import { invalidate } from '../../lib/store';
import PageHeader from '../../components/PageHeader';
import { IconChat } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import { Select, Textarea } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/ui/StatusBadge';
import { relativeDate } from '../../lib/format';

export default function AdminConcerns() {
    const [result, setResult] = useState(null);
    const [options, setOptions] = useState({ statuses: [], categories: [] });
    const [status, setStatus] = useState('');
    const [category, setCategory] = useState('');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);

    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ status: '', admin_response: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get('/concerns/categories')
            .then(({ data }) => setOptions(data))
            .catch(() => {
            });
    }, []);

    useEffect(() => setPage(1), [status, category]);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);

        const params = { page };

        if (status) params.status = status;
        if (category) params.category = category;

        return api
            .get('/admin/concerns', { params })
            .then(({ data }) => setResult(data))
            .catch((err) => setError(errorMessage(err, 'We could not load the concerns.')))
            .finally(() => setLoading(false));
    }, [page, status, category]);

    useEffect(() => {
        load();
    }, [load]);

    const openEditor = (concern) => {
        setEditing(concern);
        setForm({ status: concern.status, admin_response: concern.admin_response ?? '' });
    };

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const { data } = await api.put(`/admin/concerns/${editing.id}`, form);

            invalidate('/concerns', '/dashboard');
            setFlash(data.message);
            setEditing(null);
            await load();
        } catch (err) {
            setError(errorMessage(err, 'The concern could not be updated.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Student Concerns"
                description="Review and move concerns through to resolution."
            />

            {flash && (
                <Alert tone="success" className="mb-6">
                    {flash}
                </Alert>
            )}

            {error && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            <div className="surface mb-6 grid gap-3 p-4 sm:grid-cols-2">
                <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
                    <option value="">All statuses</option>
                    {options.statuses.map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </Select>

                <Select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    aria-label="Filter by category"
                >
                    <option value="">All categories</option>
                    {options.categories.map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </Select>
            </div>

            {loading && !result ? (
                <SkeletonRows count={6} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconChat className="h-8 w-8" />}
                        title="No concerns found."
                        description={
                            status || category
                                ? 'No concerns match the current filters.'
                                : 'Nothing has been submitted yet.'
                        }
                        action={
                            (status || category) && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        setStatus('');
                                        setCategory('');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            )
                        }
                    />
                </Card>
            ) : (
                <Card className={loading ? 'opacity-60 transition-opacity' : ''}>
                    <ul className="divide-y divide-slate-100">
                        {result.data.map((concern) => (
                            <li key={concern.id} className="px-5 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link
                                                to={`/admin/concerns/${concern.id}`}
                                                className="text-sm font-medium text-slate-900 hover:text-navy-700"
                                            >
                                                {concern.title}
                                            </Link>
                                            <StatusBadge status={concern.status} />
                                        </div>

                                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                            {concern.description}
                                        </p>

                                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                                            <Badge>{concern.category}</Badge>
                                            {concern.location && <span>{concern.location}</span>}
                                            <span>{concern.submitted_by?.name}</span>
                                            <span>{relativeDate(concern.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => openEditor(concern)}>
                                            Update
                                        </Button>
                                        <Button variant="ghost" size="sm" to={`/admin/concerns/${concern.id}`}>
                                            View
                                        </Button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div className="border-t border-slate-200">
                        <Pagination meta={result.meta} onChange={setPage} />
                    </div>
                </Card>
            )}

            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title="Update concern"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="update-concern" loading={saving}>
                            Save changes
                        </Button>
                    </>
                }
            >
                {editing && (
                    <form id="update-concern" onSubmit={save} className="space-y-5">
                        <div>
                            <p className="text-sm font-medium text-slate-900">{editing.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                                {editing.category} &middot; {editing.submitted_by?.name}
                            </p>
                        </div>

                        <Field label="Status" htmlFor="concern-status" required>
                            <Select
                                id="concern-status"
                                value={form.status}
                                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                                required
                            >
                                {options.statuses.map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </Select>
                        </Field>

                        <Field
                            label="Response to the student"
                            htmlFor="admin-response"
                            hint="Optional. Shown on the student's concern page."
                        >
                            <Textarea
                                id="admin-response"
                                rows={4}
                                value={form.admin_response}
                                onChange={(event) =>
                                    setForm((current) => ({ ...current, admin_response: event.target.value }))
                                }
                                placeholder="Maintenance has been notified and will check the access point."
                            />
                        </Field>
                    </form>
                )}
            </Modal>
        </>
    );
}
