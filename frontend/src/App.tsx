import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage    from './pages/DashboardPage';
import HoldingsPage     from './pages/HoldingsPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import HealthCenterPage from './pages/HealthCenterPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/"             element={<DashboardPage />}    />
          <Route path="/holdings"     element={<HoldingsPage />}     />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/analytics"    element={<AnalyticsPage />}    />
          <Route path="/health"       element={<HealthCenterPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
