const socket = io();

// Check for geolocation support
if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit("send-location", { latitude, longitude });
        },
        (error) => {
            console.error("Geolocation error:", error);
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        }
    );
} else {
    console.error("Geolocation is not supported by this browser.");
}

// Initialize the map
const map = L.map("map").setView([0, 0], 2); // Default to world view initially

// Add OpenStreetMap tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "SumanthMap",
}).addTo(map);

const markers = {};

// Handle incoming location updates (when a client sends their location)
socket.on("receive-location", (data) => {
    const { id, latitude, longitude } = data;

    if (!markers[id]) {
        // Create a new marker for this user
        markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(`User: ${id}`);
    } else {
        // Update the existing marker's position
        markers[id].setLatLng([latitude, longitude]);
    }

    // Optionally, center the map to the latest user's location
    map.setView([latitude, longitude], 16);
});

// Handle the case where a user has disconnected
socket.on("user-disconnected", (id) => {
    if (markers[id]) {
        map.removeLayer(markers[id]); // Remove the marker from the map
        delete markers[id]; // Delete the marker from the markers object
    }
});

// Handle the case where the server sends all existing locations when the client connects
socket.on("all-locations", (locations) => {
    Object.keys(locations).forEach((id) => {
        const { latitude, longitude } = locations[id];
        if (!markers[id]) {
            markers[id] = L.marker([latitude, longitude]).addTo(map).bindPopup(`User: ${id}`);
        }
    });
});
