const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: [{ type: String }],
  sizes: [{ type: String, enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] }],
  colors: [{ type: String }],
  category: { type: String, default: 'T-Shirt' },
  stock: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
