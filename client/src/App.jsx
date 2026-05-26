import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./store/authStore";
import PrivateRoute from "./components/shared/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import StrategyEditorPage from "./pages/StrategyEditorPage";
import BacktestPage from "./pages/BacktestPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/strategies/new" element={<StrategyEditorPage />} />
            <Route path="/strategies/:id/backtest" element={<BacktestPage />} />
            <Route path="/strategies/:id" element={<StrategyEditorPage />} />
            <Route path="/results/:backtestId" element={<ResultsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
