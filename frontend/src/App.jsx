import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import OrderResultPage from "./pages/OrderResultPage";

import "./styles/global.css";
import "./styles/authDesign.css";
import "./styles/adminDesign.css";
import "./styles/purchaseResult.css";

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/producto/:id" element={<ProductDetailPage />} />
        <Route path="/carrito" element={<CartPage />} />
        <Route path="/compra/resultado" element={<OrderResultPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route
          path="/recuperar-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/restablecer-password"
          element={<ResetPasswordPage />}
        />

        <Route element={<ProtectedRoute />}>
          {/* Acá agregaremos las futuras páginas privadas del usuario */}
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route
          path="*"
          element={
            <main className="state-message">
              <h1>Página no encontrada</h1>
              <a href="/">Volver al inicio</a>
            </main>
          }
        />
      </Routes>

      <footer className="footer">
        <p>© 2026 Ecommerce. Todos los derechos reservados.</p>
      </footer>
    </>
  );
}
