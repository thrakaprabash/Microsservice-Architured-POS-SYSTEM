const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'lkr' },
    method: { type: String, enum: ['cash', 'card'], required: true },
    stripePaymentIntentId: { type: String, default: null },
    stripeClientSecret: { type: String, default: null },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    cashReceived: { type: Number, default: null },
    changeGiven: { type: Number, default: null },
    processedBy: {
      id: { type: String },
      name: { type: String },
    },
    metadata: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
