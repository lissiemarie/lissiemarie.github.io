import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const PetSchema = new Schema({
    petType: {
        type: String,
        required: true,
        enum: ['dog', 'cat']
    },
    petName: {
        type: String,
        required: true,
        trim: true,
        index: true            
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
        enum: ['bath', 'haircut', 'nails', 'teeth'],
        default: []
    },
    amountDue: {
        type: Number,
        required: true,
        min: 0
    },
    admittedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'waiting', 'checkedOut'],
        default: 'active',
        index: true             
    }
});

export const Pet = model('Pet', PetSchema);
