import { Link, NavLink } from "react-router-dom";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="logo">
        AUTO<span>DEALER</span>
      </Link>

      <nav>
        <NavLink to="/">Home</NavLink>
        <NavLink to="/vehicles">Vehicles</NavLink>
        <NavLink to="/book-service">Services</NavLink>
        <NavLink to="/profile">My Profile</NavLink>
        <NavLink to="/admin">Admin</NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
