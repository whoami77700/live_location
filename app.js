const express = require("express");
const app = express();
const http = require("http");
const path = require("path");

const socketio = require("socket.io");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = socketio(server);

// Set EJS as the template engine
app.set("view engine", "ejs");

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// Store users' locations in an object (for simplicity)
const userLocations = {};

// Handle socket connections
io.on("connection", function (socket) {
    console.log("Client connected:", socket.id);

    // Send all users' locations to the new client
    socket.emit("all-locations", userLocations);

    // Handle receiving location
    socket.on("send-location", function (data) {
        // Save the user's location
        userLocations[socket.id] = data;
        io.emit("receive-location", { id: socket.id, ...data });
    });

    // Handle client disconnection
    socket.on("disconnect", function () {
        console.log("Client disconnected:", socket.id);
        delete userLocations[socket.id]; // Remove the user's location
        io.emit("user-disconnected", socket.id); // Notify all clients
    });
});

// Render the homepage
app.get("/", function (req, res) {
    res.render("index");
});

// Start the server
server.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
