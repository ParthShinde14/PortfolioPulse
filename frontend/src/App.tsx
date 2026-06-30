import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage    from './pages/DashboardPage';
import HoldingsPage     from './pages/HoldingsPage';
import TransactionsPage from './pages/TransactionsPage';
import WatchlistPage    from './pages/WatchlistPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import HealthCenterPage from './pages/HealthCenterPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/"             element={<DashboardPage />}    />
            <Route path="/holdings"     element={<HoldingsPage />}     />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/watchlist"    element={<WatchlistPage />}    />
            <Route path="/analytics"    element={<AnalyticsPage />}    />
            <Route path="/health"       element={<HealthCenterPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
