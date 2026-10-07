import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage, fieldErrors } from '../lib/api';
import Alert from '../components/ui/Alert';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import Input from '../components/ui/Input';
import Logo from '../components/layout/Logo';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({ email: '', password: '' });
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
            const user = await login(form);
            const intended = location.state?.from;
            const home = user.role === 'admin' ? '/admin' : '/dashboard';

            navigate(intended && intended !== '/login' ? intended : home, { replace: true });
        } catch (error) {
            setErrors(fieldErrors(error));
            setMessage(errorMessage(error, 'We could not sign you in. Please try again.'));
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
                    <h1 className="text-lg font-semibold tracking-tight text-slate-900">Sign in</h1>
                    <p className="mt-1 text-sm text-slate-500">Welcome back. Use your department account.</p>

                    {message && (
                        <Alert tone="error" className="mt-5">
                            {message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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

                        <Field label="Password" htmlFor="password" error={errors.password} required>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="current-password"
                                value={form.password}
                                onChange={update('password')}
                                invalid={Boolean(errors.password)}
                                required
                            />
                        </Field>

                        <Button type="submit" loading={submitting} className="w-full" size="lg">
                            {submitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        No account yet?{' '}
                        <Link to="/register" className="font-medium text-navy-700 hover:text-navy-800">
                            Register
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
