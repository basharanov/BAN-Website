import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";

const linkStyle = ({ isActive }) => ({
  padding: "8px 12px",
  borderRadius: 8,
  textDecoration: "none",
  color: "black",
  border: "1px solid #ddd",
  background: isActive ? "#f2f2f2" : "white",
  display: "inline-block",
});

export default function Navbar() {
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    async function loadTypes() {
      setLoadingTypes(true);
      try {
        const data = await api.getProjectTypes();
        setTypes(data);
      } finally {
        setLoadingTypes(false);
      }
    }
    loadTypes();
  }, []);

  return (
    <nav
      style={{
        display: "flex",
        gap: 10,
        padding: 16,
        borderBottom: "1px solid #eee",
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <NavLink to="/users" style={linkStyle}>
        Users
      </NavLink>

      <NavLink to="/users/create" style={linkStyle}>
        Create User
      </NavLink>

      {/* Projects dropdown */}
      <div style={{ position: "relative" }} className="projects-dropdown">
        <NavLink to="/projects" style={linkStyle}>
          Projects
        </NavLink>

        <div
          className="projects-dropdown-menu"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            minWidth: 320,
            background: "white",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 8,
            zIndex: 1000,
            boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
          }}
        >
          {/* <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>
            Filter by type
          </div> */}

          {loadingTypes ? (
            <div style={{ padding: 8 }}>Loading…</div>
          ) : types.length === 0 ? (
            <div style={{ padding: 8 }}>No types found.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {types.map((t) => (
                <NavLink
                  key={t.id}
                  to={`/projects/type/${t.id}`}
                  style={({ isActive }) => ({
                    padding: "8px 10px",
                    borderRadius: 8,
                    textDecoration: "none",
                    color: "black",
                    background: isActive ? "#f2f2f2" : "white",
                    border: "1px solid #eee",
                    display: "block",
                  })}
                >
                  {t.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </div>

      <NavLink to="/projects/create" style={linkStyle}>
        Create Project
      </NavLink>

      {/* hover CSS */}
      <style>{`
        .projects-dropdown-menu {
          display: none;
        }
        .projects-dropdown:hover .projects-dropdown-menu {
          display: block;
        }
      `}</style>
    </nav>
  );
}
