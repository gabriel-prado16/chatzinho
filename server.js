const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const bcrypt = require("bcrypt");
const multer = require("multer");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const upload = multer({ dest: "uploads/" });

function readDB() {
  return JSON.parse(fs.readFileSync("database.json"));
}

function writeDB(data) {
  fs.writeFileSync("database.json", JSON.stringify(data, null, 2));
}

// REGISTER
app.post("/register", async (req, res) => {
  const db = readDB();
  const { username, password } = req.body;

  if (db.users.find(u => u.username === username)) {
    return res.json({ error: "Usuário já existe" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.users.push({
    username,
    password: hash,
    avatar: ""
  });

  writeDB(db);
  res.json({ success: true });
});

// LOGIN
app.post("/login", async (req, res) => {
  const db = readDB();
  const { username, password } = req.body;

  const user = db.users.find(u => u.username === username);
  if (!user) return res.json({ error: "Erro" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.json({ error: "Erro" });

  res.json({ success: true });
});

// USERS LIST
app.get("/users", (req, res) => {
  const db = readDB();
  res.json(db.users.map(u => ({
    username: u.username,
    avatar: u.avatar
  })));
});

// UPLOAD
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: `/uploads/${req.file.filename}` });
});

// HISTÓRICO
app.get("/messages/:u1/:u2", (req, res) => {
  const db = readDB();
  const { u1, u2 } = req.params;

  const msgs = db.messages.filter(m =>
    (m.from === u1 && m.to === u2) ||
    (m.from === u2 && m.to === u1)
  );

  res.json(msgs);
});

// SOCKET
io.on("connection", (socket) => {

  socket.on("join", (user) => {
    socket.join(user);
  });

  socket.on("privateMessage", (data) => {
    const db = readDB();

    db.messages.push(data);
    writeDB(db);

    io.to(data.to).emit("privateMessage", data);
    io.to(data.from).emit("privateMessage", data);
  });

});

server.listen(3000, () => console.log("http://localhost:3000"));