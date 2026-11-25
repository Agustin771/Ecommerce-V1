import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login({ email, password });

      const destination = location.state?.from || "/";
      navigate(destination, { replace: true });
    } catch (err) {
      const data = err.response?.data;

      if (data?.code === "ACCOUNT_NOT_VERIFIED") {
        sessionStorage.setItem("verificationEmail", email);
        navigate("/verificar-email");
        return;
      }

      setError(
        data?.message || "No pudimos iniciar sesión. Revisá tus datos."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <ShoppingBag size={27} />
          ecommerce.
        </Link>

        <div className="auth-heading">
          <span>QUÉ BUENO VERTE DE NUEVO</span>
          <h1>Iniciá sesión</h1>
          <p>Ingresá a tu cuenta para continuar comprando.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Correo electrónico
            <div className="auth-input">
              <Mail size={18} />
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </label>

          <label>
            Contraseña
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          <div className="auth-forgot">
            <Link to="/recuperar-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="auth-switch">
          ¿Todavía no tenés cuenta?
          <Link to="/registro"> Crear cuenta</Link>
        </p>
      </section>
    </main>
  );
}
