import express from "express";
import cors from "cors";
import registerRoutes from "./routes.js"; // 👈 IMPORTAÇÃO CORRETA
import { createServer } from "http";

const app = express();

app.use(cors());
app.use(express.json());

async function start() {
  const httpServer = await registerRoutes(app);

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

start();
