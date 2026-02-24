// 🔥 MUST BE FIRST – loads .env before any other imports
import "./config/env.js";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import initSocket from "./config/socket.js";

const server = http.createServer(app);

/* -------------------- DATABASE -------------------- */
connectDB();

/* -------------------- SOCKET -------------------- */
initSocket(server);

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

