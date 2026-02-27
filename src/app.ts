import cors from "cors";
import express from "express";
import routes from "./routes.js";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:8080",
    //   "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);

app.options("*", cors());

app.use(express.json());

app.use("/api", routes);

export default app;