const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
    },
    barcode: {
      type: String,
      sparse: true,
    },
    image: {
      type: String,
      default: '', // URL or emoji fallback
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    unit: {
      type: String,
      enum: ['piece', 'pcs', 'kg', 'g', 'liter', 'litre', 'ml', 'box', 'pack'],
      default: 'piece',
    },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
