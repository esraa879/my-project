// (1):

// const fs = require("fs");

// const readStream = fs.createReadStream("./big.txt", {
//   encoding: "utf-8"
// });

// readStream.on("data", (chunk) => {
//   console.log("Chunk received:");
//   console.log(chunk);
// });

// readStream.on("end", () => {
//   console.log("Finished reading file");
// });
// ------------------------------------------------------
// (2):

// const fs = require("fs");

// const readStream = fs.createReadStream("./source.txt");
// const writeStream = fs.createWriteStream("./desk.txt");

// readStream.pipe(writeStream);

// writeStream.on("finish", () => {
//   console.log("File copied using streams");
// });
// --------------------------------------------------------------
// (3):

// const fs = require("fs");
// const zlib = require("zlib");
// const { pipeline } = require("stream");

// pipeline(
//   fs.createReadStream("./data.txt"),
//   zlib.createGzip(),
//   fs.createWriteStream("./data.txt.gz"),
//   (err) => {
//     if (err) {
//       console.error("Pipeline failed", err);
//     } else {
//       console.log("File compressed successfully");
//     }
//   }
// );
// ----------------------------------------------------

const http = require("http");
const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "users.json");

const readUsers = () => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, "utf-8");
  return data ? JSON.parse(data) : [];
};

const writeUsers = (users) => {
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));
};

const server = http.createServer((req, res) => {
  const { method, url } = req;

  const sendJSON = (statusCode, obj) => {
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(obj));
  };

  // ===============================
  if (method === "POST" && url === "/user") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const newUser = JSON.parse(body);
        const users = readUsers();

        if (users.some(u => u.email === newUser.email)) {
          return sendJSON(400, { message: "Email already exists." });
        }

        newUser.id = users.length ? users[users.length - 1].id + 1 : 1;
        users.push(newUser);
        writeUsers(users);

        sendJSON(201, { message: "User added successfully." });
      } catch (err) {
        sendJSON(400, { message: "Invalid JSON." });
      }
    });
  }

  // ===============================
  else if (method === "PATCH" && url.startsWith("/user/")) {
    const id = parseInt(url.split("/")[2]);
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const updates = JSON.parse(body);
        const users = readUsers();
        const user = users.find(u => u.id === id);

        if (!user) return sendJSON(404, { message: "User ID not found." });

        Object.assign(user, updates);
        writeUsers(users);

        sendJSON(200, { message: "User updated successfully." });
      } catch (err) {
        sendJSON(400, { message: "Invalid JSON." });
      }
    });
  }

  // ===============================
  else if (method === "DELETE" && url.startsWith("/user/")) {
    const id = parseInt(url.split("/")[2]);
    const users = readUsers();

    const index = users.findIndex(u => u.id === id);
    if (index === -1) return sendJSON(404, { message: "User ID not found." });

    users.splice(index, 1);
    writeUsers(users);

    sendJSON(200, { message: "User deleted successfully." });
  }

  // ===============================
  else if (method === "GET" && url === "/user") {
    const users = readUsers();
    sendJSON(200, users);
  }

  // ===============================
  else if (method === "GET" && url.startsWith("/user/")) {
    const id = parseInt(url.split("/")[2]);
    const users = readUsers();

    const user = users.find(u => u.id === id);
    if (!user) return sendJSON(404, { message: "User not found." });

    sendJSON(200, user);
  }

  // ===============================
  else {
    sendJSON(404, { message: "Route not found" });
  }
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
