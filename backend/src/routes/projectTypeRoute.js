import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// GET /project-types -> list project types (only not soft-deleted)
router.get("/", async (_req, res) => {
  try {
    const types = await prisma.projectType.findMany({
      where: { deletedAt: null },
      orderBy: { id: "asc" },
    });

    return res.json(types);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
