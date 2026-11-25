import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound, Mail, LockKeyhole, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (form.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      sessionStorage.setItem(
        "verificationEmail",
        form.email.trim()
      );

      navigate("/verificar-email");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "No pudimos crear tu cuenta. Intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card auth-card-wide">
        <Link to="/" className="auth-brand">
          <ShoppingBag size={27} />
          ecommerce.
        </Link>

        <div className="auth-heading">
          <span>SUMATE A NUESTRA TIENDA</span>
          <h1>Crear cuenta</h1>
          <p>Completá tus datos para comenzar.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-two-columns">
            <label>
              Nombre
              <div className="auth-input">
                <UserRound size={18} />
                <input
                  name="name"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={handleChange}
                  maxLength={80}
                  required
                  autoComplete="given-name"
                />
              </div>
            </label>

            <label>
              Apellido
              <div className="auth-input">
                <UserRound size={18} />
                <input
                  name="lastName"
                  placeholder="Tu apellido"
                  value={form.lastName}
                  onChange={handleChange}
                  maxLength={80}
                  required
                  autoComplete="family-name"
                />
              </div>
            </label>
          </div>

          <label>
            Correo electrónico
            <div className="auth-input">
              <Mail size={18} />
              <input
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={form.email}
                onChange={handleChange}
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
                name="password"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
                required
                autoComplete="new-password"
              />
            </div>
          </label>

          <label>
            Confirmar contraseña
            <div className="auth-input">
              <LockKeyhole size={18} />
              <input
                name="confirmPassword"
                type="password"
                placeholder="Repetí tu contraseña"
                value={form.confirmPassword}
                onChange={handleChange}
                minLength={8}
                maxLength={72}
                required
                autoComplete="new-password"
              />
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button className="auth-submit" disabled={loading}>
            {loading ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>
        </form>

        <p className="auth-switch">
          ¿Ya tenés una cuenta?
          <Link to="/login"> Iniciar sesión</Link>
        </p>
      </section>
    </main>
  );
}
