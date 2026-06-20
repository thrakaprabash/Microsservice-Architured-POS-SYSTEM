const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    cashier: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },
    paymentId: { type: String, default: null },
    paymentMethod: { type: String, enum: ['cash', 'card', null], default: null },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

orderSchema.pre('save', function (next) {
  if (this.isNew) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9000) + 1000;
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
