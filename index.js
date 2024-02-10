import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import morgan from "morgan";
import cors from "cors";

import shoppingRoutes from "./routes/shopping-lists.js";
import { userRoutes } from "./routes/user.routes.js";
import { authRoutes } from "./routes/auth.routes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());

app.use(bodyParser.json());
app.use(morgan("combined"));

//routes
app.use("/shopping-lists", shoppingRoutes);
userRoutes(app);
authRoutes(app);

app.get("/", (req, res) => {
  console.log("test");

  res.send("from express");
});

app.listen(PORT, () => {
  console.log(`Backend is running on port ${PORT}`);
});
