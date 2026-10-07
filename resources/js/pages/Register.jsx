import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../lib/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Input from '../components/ui/Input';
import Logo from '../components/layout/Logo';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [message, setMessage] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setErrors({});
        setMessage(null);

        try {
            await register(form);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            setErrors(fieldErrors(error));
            setMessage(errorMessage(error, 'We could not create your account. Please try again.'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12">
            <div className="mx-auto w-full max-w-sm">
                <div className="flex justify-center">
                    <Logo />
                </div>

                <div className="surface mt-6 p-6 sm:p-8">
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Create your account</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Register to upload reviewers and submit department concerns.
                    </p>

                    {message && (
                        <Alert tone="error" className="mt-5">
                            {message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                        <Field label="Full name" htmlFor="name" error={errors.name} required>
                            <Input
                                id="name"
                                name="name"
                                autoComplete="name"
                                value={form.name}
                                onChange={update('name')}
                                invalid={Boolean(errors.name)}
                                required
                            />
                        </Field>

                        <Field label="Email address" htmlFor="email" error={errors.email} required>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={update('email')}
                                invalid={Boolean(errors.email)}
                                placeholder="you@school.edu"
                                required
                            />
                        </Field>

                        <Field
                            label="Password"
                            htmlFor="password"
                            error={errors.password}
                            hint="At least 8 characters."
                            required
                        >
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                value={form.password}
                                onChange={update('password')}
                                invalid={Boolean(errors.password)}
                                required
                            />
                        </Field>

                        <Field
                            label="Confirm password"
                            htmlFor="password_confirmation"
                            error={errors.password_confirmation}
                            required
                        >
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                value={form.password_confirmation}
                                onChange={update('password_confirmation')}
                                invalid={Boolean(errors.password_confirmation)}
                                required
                            />
                        </Field>

                        <Button type="submit" loading={submitting} className="w-full" size="lg">
                            {submitting ? 'Creating account...' : 'Create account'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        Already registered?{' '}
                        <Link to="/login" className="font-medium text-navy-700 hover:text-navy-800">
                            Sign in
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-sm">
                    <Link to="/" className="text-slate-500 hover:text-slate-900">
                        Back to home
                    </Link>
                </p>
            </div>
        </div>
    );
}
