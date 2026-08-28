const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const uploadRoutes = require("./routes/upload.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/upload", uploadRoutes);

app.use(errorMiddleware);

module.exports = app;
