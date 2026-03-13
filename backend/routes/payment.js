const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { protect } = require('../middleware/auth');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DELHIVERY_BASE = 'https://track.delhivery.com';

// Auto-create Delhivery shipment
async function createDelhiveryShipment(order) {
  try {
    const shipmentData = {
      format: 'json',
      data: JSON.stringify({
        shipments: [{
          name: order.shippingAddress.name,
          add: order.shippingAddress.street,
          pin: order.shippingAddress.pincode,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          country: 'India',
          phone: order.shippingAddress.phone,
          order: order._id.toString(),
          payment_mode: 'Prepaid',
          return_pin: '',
          return_city: '',
          return_phone: '',
          return_add: '',
          return_state: '',
          return_country: 'India',
          products_desc: order.items.map(i => i.name).join(', '),
          hsn_code: '',
          cod_amount: '0',
          order_date: new Date(order.createdAt).toISOString(),
          total_amount: order.totalAmount,
          seller_add: '',
          seller_name: 'Dropzone Collection',
          seller_inv: '',
          quantity: order.items.reduce((a, b) => a + b.quantity, 0),
          waybill: '',
          shipment_width: 30,
          shipment_height: 5,
          weight: 300,
          seller_gst_tin: '',
          shipping_mode: 'Surface',
          address_type: 'home'
        }],
        pickup_location: { name: process.env.DELHIVERY_WAREHOUSE_NAME }
      })
    };

    const response = await fetch(`${DELHIVERY_BASE}/api/cmu/create.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.DELHIVERY_TOKEN}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams(shipmentData)
    });

    const data = await response.json();

    if (data.packages && data.packages[0] && data.packages[0].waybill) {
      const waybill = data.packages[0].waybill;
      await Order.findByIdAndUpdate(order._id, {
        delhiveryWaybill: waybill,
        orderStatus: 'shipped',
        trackingId: waybill
      });
      console.log('✅ Delhivery shipment created automatically! Waybill:', waybill);
      return waybill;
    } else {
      console.error('❌ Delhivery shipment failed:', JSON.stringify(data));
      return null;
    }
  } catch (err) {
    console.error('❌ Delhivery auto-shipment error:', err.message);
    return null;
  }
}

// Create Razorpay order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Verify payment + auto create shipment
router.post('/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Update order as paid
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'paid',
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        orderStatus: 'confirmed'
      },
      { new: true }
    );

    // Auto create Delhivery shipment
    const waybill = await createDelhiveryShipment(order);

    res.json({
      success: true,
      message: 'Payment verified',
      waybill: waybill || null,
      autoShipped: !!waybill
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
