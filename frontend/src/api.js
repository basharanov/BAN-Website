const API_BASE = "http://localhost:3000";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // Handle empty 204 responses (delete)
  if (res.status === 204) return null;

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  getUsers: () => request("/users"),
  createUser: (body) =>
    request("/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) =>
    request(`/users/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  // Projects
  getProjects: () => request("/projects"),
  createProject: (body) =>
    request("/projects", { method: "POST", body: JSON.stringify(body) }),
  updateProject: (id, body) =>
    request(`/projects/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: "DELETE" }),

  // Project types
  getProjectTypes: () => request("/project-types"),
  getProjectsByType: (typeId) => request(`/projects/by-type/${typeId}`),
};
