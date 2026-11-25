import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MailCheck, RefreshCw } from "lucide-react";
import {
  getVerificationStatus,
  resendVerification,
  verifyAccount,
} from "../services/authService";

export default function VerifyEmailPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    sessionStorage.getItem("verificationEmail") || ""
  );

  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) return;

    let cancelled = false;

    async function loadStatus() {
      try {
        const data = await getVerificationStatus(email);

        if (!cancelled) {
          setRemaining(data.remainingSeconds);
        }
      } catch (err) {
        console.error("No se pudo consultar el estado:", err);
      }
    }

    loadStatus();

    return () => {
      cancelled = true;
    };
  }, [email]);

  useEffect(() => {
    if (remaining <= 0) return;

    const timer = setTimeout(() => {
      setRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [remaining]);

  async function handleVerify(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      await verifyAccount({ email, code });

      sessionStorage.removeItem("verificationEmail");

      setMessage("¡Tu cuenta fue verificada correctamente!");

      setTimeout(() => navigate("/login"), 1400);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "El código no es válido o ya venció."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setMessage("");

    try {
      const result = await resendVerification(email);
      setMessage(result.message);

      const status = await getVerificationStatus(email);
      setRemaining(status.remainingSeconds);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos reenviar el código."
      );

      if (err.response?.data?.remainingSeconds != null) {
        setRemaining(err.response.data.remainingSeconds);
      }
    }
  }

  if (!email) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <h1>Verificación de cuenta</h1>
          <p>No encontramos un email pendiente de verificación.</p>
          <Link to="/registro" className="auth-submit auth-submit-link">
            Crear cuenta
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-icon">
          <MailCheck size={32} />
        </div>

        <div className="auth-heading">
          <span>UN ÚLTIMO PASO</span>
          <h1>Verificá tu email</h1>
          <p>
            Enviamos un código de 6 dígitos a
            <strong> {email}</strong>.
          </p>
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <label>
            Código de verificación
            <input
              className="auth-code-input"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              required
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-success">{message}</p>}

          <button
            className="auth-submit"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verificando..." : "Verificar cuenta"}
          </button>
        </form>

        <div className="auth-resend">
          <button
            onClick={handleResend}
            disabled={remaining > 0}
          >
            <RefreshCw size={16} />
            {remaining > 0
              ? `Podrás reenviar en ${remaining}s`
              : "Reenviar código"}
          </button>
        </div>
      </section>
    </main>
  );
}
