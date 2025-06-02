import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { Pet } from "./server/models/Pet.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Registering middleware: express.json()");
app.use(express.json());

console.log("Registering middleware: express.static for", path.join(__dirname, "docs"));
app.use(express.static(path.join(__dirname, "docs")));

// Mongoose connection
import mongoose from "mongoose";

console.log("Connecting to MongoDB...");
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petbag', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

console.log("Registering route: GET /api/test");
app.get("/api/test", (req, res) => {
    res.json({ ok: true });
});

console.log("Registering route: GET /api/pets");
app.get("/api/pets", async (req, res) => {
    try {
        const { sort, search } = req.query;
        const filter = { status: "active" };

        if (search) {
            filter.petName = { $regex: search, $options: "i" };
        }

        let query = Pet.find(filter);
        const validSortFields = ["petName", "petAge", "daysStay"];
        if (sort && validSortFields.includes(sort)) {
            query = query.sort({ [sort]: 1 });
        }

        const pets = await query.exec();
        res.json(pets);
    } catch (err) {
        console.error("Error in GET /api/pets:", err);
        res.status(500).json({ error: "Failed to fetch pets." });
    }
});

console.log("Registering route: POST /api/pets");
app.post("/api/pets", async (req, res) => {
    try {
        console.log("POST /api/pets body:", req.body);
        const { petType, petName, petAge, daysStay, grooming = [], amountDue } = req.body;
        if (!petType || !petName || petAge == null || daysStay == null || amountDue == null) {
            return res.status(400).json({ error: "Missing required pet fields." });
        }
        const newPet = new Pet({ petType, petName, petAge, daysStay, grooming, amountDue, status: "active" });
        await newPet.save();
        res.status(201).json(newPet);
    } catch (err) {
        console.error("Error in POST /api/pets:", err);
        res.status(500).json({ error: "Failed to admit new pet." });
    }
});

console.log("Registering route: GET /api/pets/:id");
app.get("/api/pets/:id", async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) {
            return res.status(404).json({ error: "Pet not found." });
        }
        res.json(pet);
    } catch (err) {
        console.error("Error in GET /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to fetch pet." });
    }
});

console.log("Registering route: DELETE /api/pets/:id");
app.delete("/api/pets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const pet = await Pet.findById(id);
        if (!pet) {
            return res.status(404).json({ error: "Pet not found." });
        }
        pet.status = "checkedOut";
        await pet.save();
        res.json({ message: "Pet checked out." });
    } catch (err) {
        console.error("Error in DELETE /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to check out pet." });
    }
});

console.log("Registering route: PUT /api/pets/:id");
app.put("/api/pets/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const update = req.body;
        const pet = await Pet.findByIdAndUpdate(id, update, { new: true });
        if (!pet) {
            return res.status(404).json({ error: "Pet not found." });
        }
        res.json(pet);
    } catch (err) {
        console.error("Error in PUT /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to update pet." });
    }
});

console.log("Registering catch-all route: GET *");
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "docs", "index.html"));
});

console.log("Starting server...");
app.listen(PORT, () => {
    console.log("Server running at http://localhost:" + PORT);
});