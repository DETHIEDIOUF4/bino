import { Navigate, Route, Routes } from 'react-router-dom';
import { getAdminToken, getAdminUser } from './adminAuthStorage';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminDrivers from './pages/AdminDrivers';
import AdminUsers from './pages/AdminUsers';
import AdminTrips from './pages/AdminTrips';
import '../theme.css';
import './admin.css';

export default function AdminRoutes() {
  const token = getAdminToken();
  const user = getAdminUser();

  if (!token || !user) {
    return (
      <Routes>
        <Route index element={<AdminLogin />} />
        <Route path="*" element={<Navigate to="/adminbino" replace />} />
      </Routes>
    );
  }

  const isAdmin = user.role === 'admin';
  const home = isAdmin ? '/adminbino/tableau-de-bord' : '/adminbino/conducteurs';

  return (
    <Routes>
      <Route element={<AdminLayout user={user} />}>
        <Route index element={<Navigate to={home} replace />} />
        {isAdmin && <Route path="tableau-de-bord" element={<AdminDashboard />} />}
        <Route path="conducteurs" element={<AdminDrivers />} />
        {isAdmin && (
          <>
            <Route path="utilisateurs" element={<AdminUsers />} />
            <Route path="trajets" element={<AdminTrips />} />
          </>
        )}
        <Route path="*" element={<Navigate to={home} replace />} />
      </Route>
    </Routes>
  );
}
