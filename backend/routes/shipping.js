const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const Order = require('../models/Order');

const DELHIVERY_BASE = 'https://track.delhivery.com';

// Check serviceability by pincode
router.get('/check/:pincode', async (req, res) => {
  try {
    const response = await fetch(
      `${DELHIVERY_BASE}/c/api/pin-codes/json/?filter_codes=${req.params.pincode}`,
      { headers: { 'Authorization': `Token ${process.env.DELHIVERY_TOKEN}` } }
    );
    const data = await response.json();
    const serviceable = data.delivery_codes && data.delivery_codes.length > 0;
    res.json({ serviceable, data: data.delivery_codes?.[0] || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create shipment (admin)
router.post('/create', protect, adminOnly, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user');
    if (!order) return res.status(404).json({ message: 'Order not found' });

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

    if (data.packages && data.packages[0]) {
      const waybill = data.packages[0].waybill;
      await Order.findByIdAndUpdate(orderId, { delhiveryWaybill: waybill, orderStatus: 'shipped' });
      res.json({ success: true, waybill });
    } else {
      res.status(400).json({ success: false, data });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Track shipment
router.get('/track/:waybill', async (req, res) => {
  try {
    const response = await fetch(
      `${DELHIVERY_BASE}/api/v1/packages/json/?waybill=${req.params.waybill}`,
      { headers: { 'Authorization': `Token ${process.env.DELHIVERY_TOKEN}` } }
    );
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
