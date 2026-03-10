const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Order = require('../models/Order');
const { protect, adminOnly } = require('../middleware/auth');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.BREVO_USER,
    pass: process.env.BREVO_PASS,
  },
});

async function notifyAdmin(order) {
  try {
    await transporter.sendMail({
      from: `"Dropzone Collection" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `🛒 New Order #${order._id.toString().slice(-8).toUpperCase()} — ₹${order.totalAmount}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:30px;border-radius:8px">
          <h1 style="color:#a02040;text-align:center">DROPZONE</h1>
          <p style="text-align:center;color:#888">New Order Received!</p>
          <div style="background:#1a1a1a;padding:20px;border-radius:6px;margin-bottom:16px">
            <h2 style="color:#c8a951">Order #${order._id.toString().slice(-8).toUpperCase()}</h2>
            <p style="color:#ccc"><strong style="color:#fff">Date:</strong> ${new Date(order.createdAt).toLocaleString('en-IN')}</p>
            <p style="color:#ccc"><strong style="color:#fff">Total:</strong> <span style="color:#c8a951;font-size:18px">₹${order.totalAmount}</span></p>
          </div>
          <div style="background:#1a1a1a;padding:20px;border-radius:6px;margin-bottom:16px">
            <h3 style="color:#fff">Items Ordered</h3>
            ${order.items.map(i => `<p style="color:#ccc;border-bottom:1px solid #333;padding:8px 0">${i.name} (Size: ${i.size}) x${i.quantity} — <span style="color:#c8a951">₹${i.price * i.quantity}</span></p>`).join('')}
          </div>
          <div style="background:#1a1a1a;padding:20px;border-radius:6px;margin-bottom:16px">
            <h3 style="color:#fff">Shipping Address</h3>
            <p style="color:#ccc">${order.shippingAddress.name} | ${order.shippingAddress.phone}</p>
            <p style="color:#ccc">${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          </div>
          <div style="text-align:center">
            <a href="${process.env.FRONTEND_URL}/pages/admin.html" style="background:#a02040;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">VIEW IN ADMIN PANEL</a>
          </div>
        </div>
      `
    });
    console.log('Admin notified');
  } catch (err) {
    console.error('Admin email failed:', err.message);
  }
}

async function notifyCustomer(order, userEmail, userName) {
  try {
    await transporter.sendMail({
      from: `"Dropzone Collection" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `✅ Order Confirmed — #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:30px;border-radius:8px">
          <h1 style="color:#a02040;text-align:center">DROPZONE</h1>
          <div style="text-align:center;margin:24px 0">
            <div style="font-size:48px">✅</div>
            <h2>Order Confirmed!</h2>
            <p style="color:#888">Hey ${userName}, your order is placed!</p>
          </div>
          <div style="background:#1a1a1a;padding:20px;border-radius:6px;margin-bottom:16px">
            <h3 style="color:#c8a951">Order #${order._id.toString().slice(-8).toUpperCase()}</h3>
            ${order.items.map(i => `<p style="color:#ccc;border-bottom:1px solid #333;padding:8px 0">${i.name} (Size: ${i.size}) x${i.quantity} — <span style="color:#c8a951">₹${i.price * i.quantity}</span></p>`).join('')}
            <p style="font-size:18px;text-align:right;color:#c8a951"><strong>Total: ₹${order.totalAmount}</strong></p>
          </div>
          <div style="background:#1a1a1a;padding:20px;border-radius:6px;margin-bottom:16px">
            <h3 style="color:#fff">Delivering To</h3>
            <p style="color:#ccc">${order.shippingAddress.name} | ${order.shippingAddress.phone}</p>
            <p style="color:#ccc">${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          </div>
          <div style="background:#1a1a1a;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #a02040">
            <p style="color:#ccc;margin:0">🚚 We will send tracking details once your order ships via Delhivery.</p>
          </div>
          <div style="text-align:center">
            <a href="${process.env.FRONTEND_URL}/pages/orders.html" style="background:#a02040;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold;display:inline-block">TRACK MY ORDER</a>
          </div>
          <p style="text-align:center;color:#444;font-size:12px;margin-top:24px">© 2026 Dropzone Collection</p>
        </div>
      `
    });
    console.log('Customer notified:', userEmail);
  } catch (err) {
    console.error('Customer email failed:', err.message);
  }
}

router.post('/', protect, async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;
    const order = await Order.create({ user: req.user._id, items, shippingAddress, totalAmount });
    notifyAdmin(order);
    notifyCustomer(order, req.user.email, req.user.name);
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: req.body.status, trackingId: req.body.trackingId }, { new: true });
    if (req.body.status === 'shipped' && order) {
      const pop = await Order.findById(order._id).populate('user', 'name email');
      if (pop?.user?.email) {
        transporter.sendMail({
          from: `"Dropzone Collection" <${process.env.EMAIL_USER}>`,
          to: pop.user.email,
          subject: `🚚 Your Order Has Shipped!`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;padding:30px;border-radius:8px">
              <h1 style="color:#a02040;text-align:center">DROPZONE</h1>
              <div style="text-align:center;margin:24px 0">
                <div style="font-size:48px">🚚</div>
                <h2>Your Order Has Shipped!</h2>
                <p style="color:#888">Order #${order._id.toString().slice(-8).toUpperCase()}</p>
              </div>
              ${req.body.trackingId ? `
                <div style="background:#1a1a1a;padding:20px;border-radius:6px;text-align:center">
                  <p style="color:#888">Tracking Number</p>
                  <p style="color:#c8a951;font-size:22px;font-weight:bold">${req.body.trackingId}</p>
                  <a href="https://www.delhivery.com/track/package/${req.body.trackingId}" style="display:inline-block;margin-top:16px;background:#a02040;color:#fff;padding:12px 28px;text-decoration:none;border-radius:4px">TRACK ON DELHIVERY</a>
                </div>
              ` : ''}
              <p style="text-align:center;color:#444;font-size:12px;margin-top:24px">© 2026 Dropzone Collection</p>
            </div>
          `
        }).catch(e => console.error('Shipping email failed:', e.message));
      }
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
