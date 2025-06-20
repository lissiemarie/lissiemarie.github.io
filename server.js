import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import { Pet } from "./server/models/Pet.js";
import { Waitlist } from "./server/models/Waitlist.js";

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "docs")));

// MongoDB connection
mongoose
    .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/petbag", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

// --- Routes ---

// Health check
app.get("/api/test", (req, res) => {
    res.json({ ok: true });
});

// List active pets
app.get("/api/pets", async (req, res) => {
    console.log("GET /api/pets query:", req.query);
    try {
        const { sort, search, petType } = req.query;
        const filter = { status: "active" };

        if (search) filter.petName = { $regex: search, $options: "i" };
        if (petType && ["dog", "cat"].includes(petType)) filter.petType = petType;

        let query = Pet.find(filter);
        const validSort = ["petName", "petAge", "daysStay"];
        if (sort && validSort.includes(sort)) query = query.sort({ [sort]: 1 });

        const pets = await query.exec();
        res.json(pets);
    } catch (err) {
        console.error("Error in GET /api/pets:", err);
        res.status(500).json({ error: "Failed to fetch pets." });
    }
});

// Get a single pet
app.get("/api/pets/:id", async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ error: "Pet not found." });
        res.json(pet);
    } catch (err) {
        console.error("Error in GET /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to fetch pet." });
    }
});

// Admit a new pet
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

// Update a pet
app.put("/api/pets/:id", async (req, res) => {
    try {
        const update = req.body;
        const pet = await Pet.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!pet) return res.status(404).json({ error: "Pet not found." });
        res.json(pet);
    } catch (err) {
        console.error("Error in PUT /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to update pet." });
    }
});

// Check out a pet
app.delete("/api/pets/:id", async (req, res) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ error: "Pet not found." });
        pet.status = "checkedOut";
        await pet.save();
        res.json({ message: "Pet checked out." });
    } catch (err) {
        console.error("Error in DELETE /api/pets/:id:", err);
        res.status(500).json({ error: "Failed to check out pet." });
    }
});

// Get waitlist entries
app.get("/api/waitlist", async (req, res) => {
    try {
        const list = await Waitlist.find().sort({ requestedAt: 1 }).exec();
        res.json(list);
    } catch (err) {
        console.error("Error in GET /api/waitlist:", err);
        res.status(500).json({ error: "Failed to fetch waitlist." });
    }
});

// Add to waitlist
app.post("/api/waitlist", async (req, res) => {
    try {
        console.log("POST /api/waitlist body:", req.body);
        const entry = new Waitlist(req.body);
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        console.error("Error in POST /api/waitlist:", err);
        res.status(500).json({ error: "Failed to add to waitlist." });
    }
});

// Remove a waitlist entry
app.delete("/api/waitlist/:id", async (req, res) => {
    try {
        await Waitlist.findByIdAndDelete(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        console.error("Error in DELETE /api/waitlist/:id:", err);
        res.status(500).json({ error: "Failed to remove waitlist entry." });
    }
});

// Admit from waitlist (move to active + delete from waitlist)
app.post("/api/waitlist/:id/admit", async (req, res) => {
    try {
        const entry = await Waitlist.findById(req.params.id);
        if (!entry) return res.status(404).json({ error: "Waitlist entry not found." });

        // Create a new Pet
        const pet = new Pet({
            petType: entry.petType,
            petName: entry.petName,
            petAge: entry.petAge,
            daysStay: entry.daysStay,
            grooming: entry.grooming,
            amountDue: entry.amountDue,
            status: "active",
        });
        await pet.save();

        // Remove from waitlist
        await entry.deleteOne();

        res.json(pet);
    } catch (err) {
        console.error("Error in POST /api/waitlist/:id/admit:", err);
        res.status(500).json({ error: "Failed to admit from waitlist." });
    }
});

// Catch-all
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "docs", "index.html"));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
