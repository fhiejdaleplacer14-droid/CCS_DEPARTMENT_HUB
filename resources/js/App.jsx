import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import AppLayout from './components/layout/AppLayout';
import PublicLayout from './components/layout/PublicLayout';
import AdminRoute from './routes/AdminRoute';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import RouteFallback from './components/RouteFallback';

import Landing from './pages/Landing';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import AnnouncementsRoute from './pages/AnnouncementsRoute';
import Dashboard from './pages/student/Dashboard';
import Reviewers from './pages/student/Reviewers';

const ReviewerDetails = lazy(() => import('./pages/student/ReviewerDetails'));
const UploadReviewer = lazy(() => import('./pages/student/UploadReviewer'));
const Concerns = lazy(() => import('./pages/student/Concerns'));
const SubmitConcern = lazy(() => import('./pages/student/SubmitConcern'));
const ConcernDetails = lazy(() => import('./pages/student/ConcernDetails'));
const Profile = lazy(() => import('./pages/student/Profile'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminReviewers = lazy(() => import('./pages/admin/Reviewers'));
const FlaggedReviewers = lazy(() => import('./pages/admin/FlaggedReviewers'));
const AdminConcerns = lazy(() => import('./pages/admin/Concerns'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Suspense fallback={<RouteFallback />}>
                    <Routes>
                        <Route element={<PublicLayout />}>
                            <Route path="/" element={<Landing />} />
                        </Route>

                        <Route path="/announcements" element={<AnnouncementsRoute />} />

                        <Route element={<GuestRoute />}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Route>

                        <Route element={<ProtectedRoute />}>
                            <Route element={<AppLayout />}>
                                <Route path="/dashboard" element={<Dashboard />} />

                                <Route path="/reviewers" element={<Reviewers />} />
                                <Route path="/reviewers/upload" element={<UploadReviewer />} />
                                <Route path="/reviewers/:id" element={<ReviewerDetails />} />

                                <Route path="/concerns" element={<Concerns />} />
                                <Route path="/concerns/new" element={<SubmitConcern />} />
                                <Route path="/concerns/:id" element={<ConcernDetails />} />

                                <Route path="/profile" element={<Profile />} />

                                <Route element={<AdminRoute />}>
                                    <Route path="/admin" element={<AdminDashboard />} />
                                    <Route path="/admin/reviewers" element={<AdminReviewers />} />
                                    <Route path="/admin/reviewers/flagged" element={<FlaggedReviewers />} />
                                    <Route path="/admin/concerns" element={<AdminConcerns />} />
                                    <Route path="/admin/concerns/:id" element={<ConcernDetails />} />
                                    <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                                    <Route path="/admin/users" element={<AdminUsers />} />
                                </Route>
                            </Route>
                        </Route>

                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}
