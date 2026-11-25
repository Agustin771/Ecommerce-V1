import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Store,
  UserRound,
  LogOut,
} from "lucide-react";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, isAdmin, logout, loadingAuth } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand">
          <Store size={25} />
          <span>
            ecommerce<span className="brand-highlight">.</span>
          </span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/">Inicio</NavLink>
          <a href="/#catalogo">Productos</a>
        </nav>

        <div className="nav-actions">
          <Link to="/carrito" className="cart-link">
            <ShoppingCart size={21} />
            <span>Carrito</span>
            {totalItems > 0 && (
              <span className="cart-count">{totalItems}</span>
            )}
          </Link>

          {!loadingAuth && (
            user ? (
              <div className="nav-user">
                <span className="nav-user-name">
                  <UserRound size={17} />
                  {user.name}
                </span>

                {isAdmin && (
                  <Link to="/admin" className="nav-admin-link">
                    Administración
                  </Link>
                )}

                <button
                  className="nav-logout"
                  onClick={handleLogout}
                  title="Cerrar sesión"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <div className="nav-auth-links">
                <Link to="/login" className="nav-login">
                  Iniciar sesión
                </Link>
                <Link to="/registro" className="nav-register">
                  Crear cuenta
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
