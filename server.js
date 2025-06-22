// server.js

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xssClean from 'xss-clean';
import hpp from 'hpp';
import cors from 'cors';

import { Pet } from './server/models/Pet.js';
import { Waitlist } from './server/models/Waitlist.js';

const app = express();
const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MAX_DOGS = 5;
const MAX_CATS = 5;

// 1) Trust proxy for HTTPS detection
app.enable('trust proxy');

// 2) Redirect HTTP to HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.secure) return next();
        res.redirect('https://' + req.headers.host + req.url);
    });
}

// 3) Security headers and middleware
app.use(helmet());
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com']
        }
    })
);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(mongoSanitize());
app.use(xssClean());
app.use(hpp());
app.use(
    cors({
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    })
);
app.disable('x-powered-by');

// 4) JSON body parsing and static file serving
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// 5) Health check route
app.get('/api/test', (req, res) => {
    res.json({ ok: true });
});

// 6) List active pets with optional sort/search/type filter
app.get('/api/pets', async (req, res, next) => {
    try {
        const { sort, search, petType } = req.query;
        const filter = { status: 'active' };
        if (search) filter.petName = { $regex: search, $options: 'i' };
        if (petType) filter.petType = petType;
        let query = Pet.find(filter);
        const validFields = ['petName', 'petAge', 'daysStay'];
        if (sort && validFields.includes(sort)) {
            query = query.sort({ [sort]: 1 });
        }
        const pets = await query.exec();
        res.json(pets);
    } catch (err) {
        next(err);
    }
});

// 7) Get single pet by ID
app.get('/api/pets/:id', async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });
        res.json(pet);
    } catch (err) {
        next(err);
    }
});

// 8) Admit a new pet
app.post('/api/pets', async (req, res, next) => {
    try {
        const { petType, petName, petAge, daysStay, grooming = [], amountDue } = req.body;
        if (!petType || !petName || petAge == null || daysStay == null || amountDue == null) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }
        const pet = new Pet({
            petType,
            petName,
            petAge,
            daysStay,
            grooming,
            amountDue,
            status: 'active'
        });
        await pet.save();
        res.status(201).json(pet);
    } catch (err) {
        next(err);
    }
});

// 9) Update an existing pet
app.put('/api/pets/:id', async (req, res, next) => {
    try {
        const pet = await Pet.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });
        res.json(pet);
    } catch (err) {
        next(err);
    }
});

// 10) Check out (mark pet as checkedOut)
app.delete('/api/pets/:id', async (req, res, next) => {
    try {
        const pet = await Pet.findById(req.params.id);
        if (!pet) return res.status(404).json({ error: 'Pet not found.' });
        pet.status = 'checkedOut';
        await pet.save();
        res.json({ message: 'Pet checked out.' });
    } catch (err) {
        next(err);
    }
});

// 11) List waitlist entries
app.get('/api/waitlist', async (req, res, next) => {
    try {
        const list = await Waitlist.find().sort({ requestedAt: 1 }).exec();
        res.json(list);
    } catch (err) {
        next(err);
    }
});

// 12) Add to waitlist
app.post('/api/waitlist', async (req, res, next) => {
    try {
        const entry = new Waitlist(req.body);
        await entry.save();
        res.status(201).json(entry);
    } catch (err) {
        next(err);
    }
});

// 13) Remove a waitlist entry
app.delete('/api/waitlist/:id', async (req, res, next) => {
    try {
        await Waitlist.findByIdAndDelete(req.params.id);
        res.sendStatus(204);
    } catch (err) {
        next(err);
    }
});

// 14) Admit from waitlist into active pets (with capacity check)
app.post('/api/waitlist/:id/admit', async (req, res, next) => {
    try {
        const entry = await Waitlist.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ error: 'Waitlist entry not found.' });
        }

        // Check capacity limits
        const limit = entry.petType === 'dog' ? MAX_DOGS : MAX_CATS;
        const activeCount = await Pet.countDocuments({
            petType: entry.petType,
            status: 'active'
        });
        if (activeCount >= limit) {
            return res.status(400).json({
                error: `Cannot admit: active ${entry.petType} capacity full`
            });
        }

        // Create new pet from waitlist entry
        const pet = new Pet({
            petType: entry.petType,
            petName: entry.petName,
            petAge: entry.petAge,
            daysStay: entry.daysStay,
            grooming: entry.grooming,
            amountDue: entry.amountDue,
            status: 'active'
        });
        await pet.save();
        await entry.deleteOne();

        res.json(pet);
    } catch (err) {
        next(err);
    }
});

// 15) Catch-all to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});

// 16) Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    const message =
        process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message;
    res.status(500).json({ error: message });
});

// 17) Connect to MongoDB and start server
mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petbag', {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
