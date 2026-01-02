import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import usersRoutes from "./routes/userRoute.js";
import projectRoute from "./routes/projectRoute.js";
import projectTypeRoute from "./routes/projectTypeRoute.js";
import publicationTypeRoute from "./routes/publicationTypeRoute.js";
import publicationRoute from "./routes/publicationRoute.js";
import authorRoute from "./routes/authorRoute.js";

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/users", usersRoutes);
app.use("/projects", projectRoute);
app.use("/project-types", projectTypeRoute);
app.use("/publication-types", publicationTypeRoute);
app.use("/publications", publicationRoute);
app.use("/authors", authorRoute);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
