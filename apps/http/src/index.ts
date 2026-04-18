import express from "express";
import cors from "cors";
import dashboardRoutes from "./routes/dashboard";
import tokenRoutes from "./routes/tokens";
import { prisma } from "@autosol/db";

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());

// Main routers
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/tokens", tokenRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "autosol-backend" });
});

app.get("/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: "ready", service: "autosol-backend" });
  } catch (error) {
    console.error("[HTTP Backend] readiness probe failed:", error);
    res.status(503).json({ status: "degraded", service: "autosol-backend" });
  }
});

const server = app.listen(PORT, () => {
  console.log(`[HTTP Backend] AutoSol backend listening on port ${PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`[HTTP Backend] received ${signal}, shutting down...`);
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
