import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage, fieldErrors } from '../../lib/api';
import { invalidate } from '../../lib/store';
import AnnouncementCard from '../../components/AnnouncementCard';
import PageHeader from '../../components/PageHeader';
import { IconMegaphone } from '../../components/icons';
import Alert from '../../components/ui/Alert';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import Field from '../../components/ui/Field';
import Input, { Textarea } from '../../components/ui/Input';
import { SkeletonList } from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

const EMPTY = { title: '', content: '' };

export default function AdminAnnouncements() {
    const [result, setResult] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [deleting, setDeleting] = useState(null);
    const [removing, setRemoving] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        setError(null);

        return api
            .get('/announcements', { params: { page } })
            .then(({ data }) => setResult(data))
            .catch((err) => setError(errorMessage(err, 'We could not load the announcements.')))
            .finally(() => setLoading(false));
    }, [page]);

    useEffect(() => {
        load();
    }, [load]);

    const openCreate = () => {
        setEditing('new');
        setForm(EMPTY);
        setErrors({});
    };

    const openEdit = (announcement) => {
        setEditing(announcement);
        setForm({ title: announcement.title, content: announcement.content });
        setErrors({});
    };

    const save = async (event) => {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setError(null);

        const isNew = editing === 'new';

        try {
            const { data } = isNew
                ? await api.post('/admin/announcements', form)
                : await api.put(`/admin/announcements/${editing.id}`, form);

            invalidate('/announcements', '/dashboard');
            setFlash(data.message);
            setEditing(null);
            await load();
        } catch (err) {
            setErrors(fieldErrors(err));
            setError(errorMessage(err, 'The announcement could not be saved.'));
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        setRemoving(true);
        setError(null);

        try {
            const { data } = await api.delete(`/admin/announcements/${deleting.id}`);

            invalidate('/announcements', '/dashboard');
            setFlash(data.message);
            setDeleting(null);
            await load();
        } catch (err) {
            setError(errorMessage(err, 'The announcement could not be deleted.'));
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            <PageHeader
                title="Announcements"
                description="Publish notices to the department notice board."
                action={
                    <Button size="sm" onClick={openCreate}>
                        New Announcement
                    </Button>
                }
            />

            {flash && (
                <Alert tone="success" className="mb-6">
                    {flash}
                </Alert>
            )}

            {error && !editing && (
                <Alert tone="error" className="mb-6">
                    {error}
                </Alert>
            )}

            {loading && !result ? (
                <SkeletonList count={3} />
            ) : result?.data.length === 0 ? (
                <Card>
                    <EmptyState
                        icon={<IconMegaphone className="h-8 w-8" />}
                        title="No announcements available."
                        description="Publish the first notice for your students."
                        action={
                            <Button size="sm" onClick={openCreate}>
                                New announcement
                            </Button>
                        }
                    />
                </Card>
            ) : (
                <>
                    <div className={`space-y-4 ${loading ? 'opacity-60 transition-opacity' : ''}`}>
                        {result.data.map((announcement) => (
                            <AnnouncementCard
                                key={announcement.id}
                                announcement={announcement}
                                action={
                                    <div className="flex shrink-0 gap-2">
                                        <Button variant="secondary" size="sm" onClick={() => openEdit(announcement)}>
                                            Edit
                                        </Button>
                                        <Button variant="danger" size="sm" onClick={() => setDeleting(announcement)}>
                                            Delete
                                        </Button>
                                    </div>
                                }
                            />
                        ))}
                    </div>

                    <div className="surface mt-6">
                        <Pagination meta={result.meta} onChange={setPage} />
                    </div>
                </>
            )}

            <Modal
                open={Boolean(editing)}
                onClose={() => setEditing(null)}
                title={editing === 'new' ? 'New announcement' : 'Edit announcement'}
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditing(null)}>
                            Cancel
                        </Button>
                        <Button type="submit" form="announcement-form" loading={saving}>
                            {editing === 'new' ? 'Publish' : 'Save changes'}
                        </Button>
                    </>
                }
            >
                <form id="announcement-form" onSubmit={save} className="space-y-5" noValidate>
                    {error && <Alert tone="error">{error}</Alert>}

                    <Field label="Title" htmlFor="announcement-title" error={errors.title} required>
                        <Input
                            id="announcement-title"
                            value={form.title}
                            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                            invalid={Boolean(errors.title)}
                            placeholder="e.g. Midterm Examination Schedule Released"
                            required
                        />
                    </Field>

                    <Field
                        label="Content"
                        htmlFor="announcement-content"
                        error={errors.content}
                        hint="Leave a blank line between paragraphs."
                        required
                    >
                        <Textarea
                            id="announcement-content"
                            rows={8}
                            value={form.content}
                            onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                            invalid={Boolean(errors.content)}
                            required
                        />
                    </Field>
                </form>
            </Modal>

            <Modal
                open={Boolean(deleting)}
                onClose={() => setDeleting(null)}
                title="Delete this announcement?"
                size="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleting(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" loading={removing} onClick={remove}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-slate-600">
                    <span className="font-medium text-slate-900">{deleting?.title}</span> will be removed from the
                    notice board. This cannot be undone.
                </p>
            </Modal>
        </>
    );
}
