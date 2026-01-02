import { useEffect, useState } from "react";
import { useParams, NavLink } from "react-router-dom";
import { api } from "../api";

export default function PublicationsByTypePage() {
  const { typeId } = useParams();

  const [publications, setPublications] = useState([]);
  const [type, setType] = useState(null);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [pubs, types] = await Promise.all([
        api.getPublicationsByType(typeId),
        api.getPublicationTypes(),
      ]);
      setPublications(pubs);
      const t = types.find((x) => String(x.id) === String(typeId)) || null;
      setType(t);
    } catch (e) {
      setErr(e.message || "Failed to load publications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeId]);

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: 24,
        fontFamily: "system-ui, Arial",
      }}
    >
      <div
        style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
      >
        <h1 style={{ margin: 0 }}>
          {type ? `${type.name}` : `typeId=${typeId}`}
        </h1>

        <NavLink
          to="/publications"
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            textDecoration: "none",
            color: "black",
            border: "1px solid #ddd",
            background: "white",
            height: "fit-content",
          }}
        >
          View all
        </NavLink>
      </div>

      {err ? (
        <div
          style={{
            padding: 12,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
            marginTop: 12,
            marginBottom: 12,
          }}
        >
          <strong>Error:</strong> {err}
        </div>
      ) : null}

      <button onClick={load} disabled={loading} style={{ marginBottom: 16 }}>
        {loading ? "Loading..." : "Refresh"}
      </button>

      {loading ? <p>Loading…</p> : null}
      {!loading && publications.length === 0 ? (
        <p>За момента няма такива публикации.</p>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {publications.map((p) => {
          const authorNames =
            (p.authors || [])
              .slice()
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((x) => x.author?.fullName)
              .filter(Boolean) || [];

          return (
            <div
              key={p.id}
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
            >
              <div>
                <strong>#{p.id}</strong> — <strong>{p.year}</strong>
              </div>

              <div style={{ marginTop: 6 }}>
                <div>
                  <strong>Title:</strong> {p.title}
                </div>
                <div>
                  <strong>Authors:</strong>{" "}
                  {authorNames.length ? authorNames.join(", ") : <em>none</em>}
                </div>
                <div style={{ marginTop: 6 }}>
                  <strong>Description:</strong>{" "}
                  {p.description ? p.description : <em>none</em>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
