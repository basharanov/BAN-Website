import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";

export default function ProjectsByTypePage() {
  const { typeId } = useParams();
  const numericTypeId = Number(typeId);

  const [projects, setProjects] = useState([]);
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const typeName = useMemo(() => {
    const t = types.find((x) => x.id === numericTypeId);
    return t ? t.name : `Type #${numericTypeId}`;
  }, [types, numericTypeId]);

  async function load() {
    setErr("");
    setLoading(true);
    try {
      const [t, p] = await Promise.all([
        api.getProjectTypes(),
        api.getProjectsByType(numericTypeId),
      ]);
      setTypes(t);
      setProjects(p);
    } catch (e) {
      setErr(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!Number.isInteger(numericTypeId)) {
      setErr("Invalid project type id");
      setLoading(false);
      return;
    }
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
      <h1>Projects — {typeName}</h1>

      {err ? (
        <div
          style={{
            padding: 12,
            background: "#ffe5e5",
            border: "1px solid #ffb3b3",
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

      {!loading && !err && projects.length === 0 ? (
        <p style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          За момента няма такива проекти.
        </p>
      ) : null}

      <div style={{ display: "grid", gap: 12 }}>
        {projects.map((p) => (
          <div
            key={p.id}
            style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
          >
            <div>
              <strong>#{p.id}</strong> — <strong>{p.type?.name}</strong>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>
                <strong>Start:</strong>{" "}
                {p.startDate ? new Date(p.startDate).toLocaleDateString() : "-"}
              </div>
              <div>
                <strong>End:</strong>{" "}
                {p.endDate ? (
                  new Date(p.endDate).toLocaleDateString()
                ) : (
                  <em>none</em>
                )}
              </div>
              <div>
                <strong>Website:</strong>{" "}
                {p.websiteUrl ? (
                  <a href={p.websiteUrl} target="_blank" rel="noreferrer">
                    {p.websiteUrl}
                  </a>
                ) : (
                  <em>none</em>
                )}
              </div>
              <div>
                <strong>Description:</strong> {p.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
