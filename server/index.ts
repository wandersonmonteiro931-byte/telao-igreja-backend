import express from "express";
import cors from "cors";
import { registerRoutes } from "./routes.js";

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json({ limit: "10mb" }));

const PORT = process.env.PORT || 3000;

registerRoutes(app).then((server) => {
  server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
});
