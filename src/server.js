// 🔥 MUST BE FIRST – loads .env before any other imports
import "./config/env.js";

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import initSocket from "./config/socket.js";

const server = http.createServer(app);
/* -------------------- TRUST PROXY (IMPORTANT FOR RENDER) -------------------- */
app.set("trust proxy", 1);

/* -------------------- DATABASE -------------------- */
connectDB();
console.log("Connected to DB:", mongoose.connection.name);
console.log("Mongo URI:", process.env.MONGO_URI);
/* -------------------- SOCKET -------------------- */
initSocket(server);

/* -------------------- SERVER -------------------- */
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



