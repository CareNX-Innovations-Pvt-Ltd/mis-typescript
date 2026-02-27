import cors from "cors";
import express from "express";
import routes from "./routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "https://mongo-compatibility.web.app",
      "https://mis-typescript-1.onrender.com",
      "https://web.fetosense.com/login"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.use(express.json());
app.use("/api", routes);

export default app;