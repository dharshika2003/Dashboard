import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Productspage from "./pages/Products";
import Releases from "./pages/Releases";
import Clients from "./pages/Clients";
import Updates from "./pages/Updates";
import Licenses from "./pages/Licenses";
import Settings from "./pages/Settings";
import { AnimatePresence } from "framer-motion";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Productspage />} />
        <Route path="/releases" element={<Releases />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="/licenses" element={<Licenses />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <div className="flex">
        <Sidebar />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App;
