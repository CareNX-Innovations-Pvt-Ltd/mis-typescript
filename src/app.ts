import cors from "cors";
import express from "express";
import routes from "./routes.js";

const app = express();
app.use(cors()); 

app.use(express.json()); // also re-enable this

app.use("/api", routes);

export default app; 