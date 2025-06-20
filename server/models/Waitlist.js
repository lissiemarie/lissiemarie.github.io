// server/models/Waitlist.js
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const WaitlistSchema = new Schema({
    petType: {
        type: String,
        required: true,
        enum: ['dog', 'cat']
    },
    petName: {
        type: String,
        required: true,
        trim: true
    },
    petAge: {
        type: Number,
        required: true,
        min: 0
    },
    daysStay: {
        type: Number,
        required: true,
        min: 1
    },
    grooming: {
        type: [String],
        default: []
    },
    amountDue: {
        type: Number,
        required: true,
        min: 0
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    requestedAt: {
        type: Date,
        default: Date.now
    }
});

export const Waitlist = model('Waitlist', WaitlistSchema);
