import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import CreateUserPage from "./pages/CreateUserPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import CreateProjectPage from "./pages/CreateProjectPage.jsx";
import ProjectsByTypePage from "./pages/ProjectsByTypePage.jsx";

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/create" element={<CreateUserPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/type/:typeId" element={<ProjectsByTypePage />} />
        <Route path="/projects/create" element={<CreateProjectPage />} />
        <Route
          path="*"
          element={<div style={{ padding: 24 }}>Not found</div>}
        />
      </Routes>
    </div>
  );
}
