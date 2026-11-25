import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { resetUserPassword } from "../services/authService";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(
    sessionStorage.getItem("resetPasswordEmail") || ""
  );

  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      const result = await resetUserPassword({
        email,
        token,
        newPassword,
      });

      sessionStorage.removeItem("resetPasswordEmail");
      setMessage(result.message);

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos restablecer tu contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-heading">
          <span>RECUPERACIÓN DE CUENTA</span>
          <h1>Nueva contraseña</h1>
          <p>Ingresá el código que recibiste y elegí una contraseña nueva.</p>
          {location.state?.requestMessage && (
            <p className="auth-success">{location.state.requestMessage}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Correo electrónico
            <input
              className="auth-plain-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Código de recuperación
            <input
              className="auth-code-input"
              value={token}
              onChange={(event) =>
                setToken(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </label>

          <label>
            Nueva contraseña
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          <label>
            Repetir contraseña
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button
            className="auth-submit"
            disabled={loading || token.length !== 6}
          >
            {loading ? "Actualizando..." : "Cambiar contraseña"}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login">Volver al inicio de sesión</Link>
        </p>
      </section>
    </main>
  );
}
