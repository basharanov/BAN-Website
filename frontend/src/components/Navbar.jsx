import { NavLink } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "black",
  border: "1px solid #ddd",
  background: isActive ? "#f2f2f2" : "white",
});

export default function Navbar() {
  return (
    <nav
      style={{
        display: "flex",
        gap: 10,
        padding: 16,
        borderBottom: "1px solid #eee",
      }}
    >
      <NavLink to="/users" style={linkStyle}>
        Users
      </NavLink>
      <NavLink to="/create" style={linkStyle}>
        Create User
      </NavLink>
    </nav>
  );
}
