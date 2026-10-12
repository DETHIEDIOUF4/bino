import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DriverRoute from './components/DriverRoute';
import AppShell from './components/AppShell';
import DriverShell from './components/DriverShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterDriver from './pages/RegisterDriver';
import ShareMyCar from './pages/ShareMyCar';
import ProposeTrip from './pages/ProposeTrip';
import ClientHome from './pages/ClientHome';
import Search from './pages/Search';
import MyBookings from './pages/MyBookings';
import BookingDetail from './pages/BookingDetail';
import DriverHome from './pages/DriverHome';
import DriverTrips from './pages/DriverTrips';
import DriverRequests from './pages/DriverRequests';
import Track from './pages/Track';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/rechercher" element={<Search />} />
      <Route path="/partager-ma-voiture" element={<ShareMyCar />} />
      <Route path="/proposer" element={<ProposeTrip />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/inscription-conducteur" element={<RegisterDriver />} />
      <Route path="/suivi/:bookingId/:token" element={<Track />} />
      <Route path="/app/rechercher" element={<Navigate to="/rechercher" replace />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ClientHome />} />
        <Route path="mes-trajets" element={<MyBookings />} />
        <Route path="trajet/:id" element={<BookingDetail />} />
      </Route>

      <Route
        path="/conducteur"
        element={
          <DriverRoute>
            <DriverShell />
          </DriverRoute>
        }
      >
        <Route index element={<DriverHome />} />
        <Route path="trajets" element={<DriverTrips />} />
        <Route path="demandes" element={<DriverRequests />} />
      </Route>
    </Routes>
  );
}
