import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { requestPasswordRecovery } from "../services/authService";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedEmail = email.trim();
      const result = await requestPasswordRecovery(normalizedEmail);

      // Conservamos el correo para que el usuario no tenga que volver a escribirlo.
      sessionStorage.setItem("resetPasswordEmail", normalizedEmail);

      // Después de solicitar el código, continuamos directamente al formulario.
      navigate("/restablecer-password", {
        replace: true,
        state: { requestMessage: result.message },
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos procesar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/login" className="auth-back">
          <ArrowLeft size={17} /> Volver al login
        </Link>

        <div className="auth-heading">
          <span>RECUPERÁ EL ACCESO</span>
          <h1>¿Olvidaste tu contraseña?</h1>
          <p>
            Ingresá tu correo y te enviaremos un código para
            restablecerla.
          </p>
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
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar código"}
          </button>
        </form>

        <p className="auth-switch">
          ¿Recordaste tu contraseña?
          <Link to="/login"> Iniciar sesión</Link>
        </p>

        <p className="auth-switch">
          ¿Ya recibiste el código?
          <Link to="/restablecer-password"> Restablecer contraseña</Link>
        </p>
      </section>
    </main>
  );
}
