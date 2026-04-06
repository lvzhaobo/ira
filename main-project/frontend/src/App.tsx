import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import MarketingLayout from "./components/MarketingLayout";
import RequireAuth from "./components/RequireAuth";
import ConsoleLayout from "./components/ConsoleLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Workbench from "./pages/Workbench";
import ResearchQA from "./pages/ResearchQA";
import MultiAgent from "./pages/MultiAgent";
import Compliance from "./pages/Compliance";
import Lineage from "./pages/Lineage";
import Sentiment from "./pages/Sentiment";
import StockAnalysis from "./pages/StockAnalysis";
import Knowledge from "./pages/Knowledge";
import Messages from "./pages/Messages";
import NotifyChannels from "./pages/NotifyChannels";
import NotifyTemplatesRules from "./pages/NotifyTemplatesRules";
import NotifyDispatch from "./pages/NotifyDispatch";
import NotifyHistory from "./pages/NotifyHistory";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Skills from "./pages/Skills";

function PublicLanding() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/workbench" replace />;
  return <Landing />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<MarketingLayout />}>
        <Route path="/" element={<PublicLanding />} />
        <Route path="/login" element={<Login />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<ConsoleLayout />}>
          <Route path="/workbench" element={<Workbench />} />
          <Route path="/research-qa" element={<ResearchQA mode="mvp" />} />
          <Route path="/research-qa-change" element={<ResearchQA mode="change" />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/lineage" element={<Lineage />} />
          <Route path="/stock-analysis" element={<StockAnalysis />} />
          <Route path="/multi-agent-stock" element={<MultiAgent />} />
          <Route path="/sentiment" element={<Sentiment />} />
          <Route path="/knowledge" element={<Knowledge />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/channels" element={<NotifyChannels />} />
          <Route path="/messages/rules" element={<NotifyTemplatesRules />} />
          <Route path="/messages/dispatch" element={<NotifyDispatch />} />
          <Route path="/messages/history" element={<NotifyHistory />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/workbench" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
