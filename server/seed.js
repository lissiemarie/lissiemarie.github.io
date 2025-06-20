// server/seed.js
import mongoose from 'mongoose';
import { Pet } from './models/Pet.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/petbag';

const samplePets = [
    { petType: 'dog', petName: 'Rex', petAge: 5, daysStay: 3, grooming: ['bath'], amountDue: 75.0 },
    { petType: 'cat', petName: 'Whiskers', petAge: 2, daysStay: 5, grooming: ['nails'], amountDue: 60.0 },
    { petType: 'dog', petName: 'Bella', petAge: 3, daysStay: 2, grooming: ['haircut'], amountDue: 50.0 },
    { petType: 'cat', petName: 'Snowball', petAge: 4, daysStay: 4, grooming: [], amountDue: 80.0 }
];

async function seed() {
    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const count = await Pet.countDocuments();
    if (count === 0) {
        console.log('No pets found, inserting sample data...');
        await Pet.insertMany(samplePets);
        console.log('Sample pets inserted.');
    } else {
        console.log('Database already has', count, 'pet(s); skipping seeding.');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
