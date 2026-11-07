import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import VehicleListing from "./pages/VehicleListing";
import VehicleDetails from "./pages/VehicleDetails";
import ServiceBooking from "./pages/ServiceBooking";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

import "./styles/global.css";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vehicles" element={<VehicleListing />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/book-service" element={<ServiceBooking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </BrowserRouter>
  );
}

export default App;
