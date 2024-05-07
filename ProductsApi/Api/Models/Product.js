import mongoose from 'mongoose';

const { Schema, models, model } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    images: {
        type: [String],
    },
}, { timestamps: true });

export default models.Product || model('Product', productSchema);
