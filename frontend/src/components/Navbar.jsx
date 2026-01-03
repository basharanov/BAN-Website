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

  const [pubTypes, setPubTypes] = useState([]);
  const [loadingPubTypes, setLoadingPubTypes] = useState(true);

  useEffect(() => {
    async function loadTypes() {
      setLoadingTypes(true);
      setLoadingPubTypes(true);
      try {
        const [projectTypes, publicationTypes] = await Promise.all([
          api.getProjectTypes(),
          api.getPublicationTypes(),
        ]);
        setTypes(projectTypes);
        setPubTypes(publicationTypes);
      } finally {
        setLoadingTypes(false);
        setLoadingPubTypes(false);
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

      {/* Publications dropdown (NEW) */}
      <div style={{ position: "relative" }} className="publications-dropdown">
        <NavLink to="/publications" style={linkStyle}>
          Publications
        </NavLink>

        <div
          className="publications-dropdown-menu"
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
          {loadingPubTypes ? (
            <div style={{ padding: 8 }}>Loading…</div>
          ) : pubTypes.length === 0 ? (
            <div style={{ padding: 8 }}>No types found.</div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              {pubTypes.map((t) => (
                <NavLink
                  key={t.id}
                  to={`/publications/type/${t.id}`}
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

      <NavLink to="/publications/create" style={linkStyle}>
        Create Publication
      </NavLink>
      <NavLink to="/e-library" style={linkStyle}>
        E-Library
      </NavLink>

      <NavLink to="/e-library/create" style={linkStyle}>
        Create E-Library Item
      </NavLink>

      {/* hover CSS */}
      <style>{`
        .projects-dropdown-menu {
          display: none;
        }
        .projects-dropdown:hover .projects-dropdown-menu {
          display: block;
        }

        .publications-dropdown-menu {
          display: none;
        }
        .publications-dropdown:hover .publications-dropdown-menu {
          display: block;
        }
      `}</style>
    </nav>
  );
}
