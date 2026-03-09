// Run this ONCE to set up your first product and admin account
// Command: node seed.js

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const User = require('./models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Create admin user
    const existingAdmin = await User.findOne({ email: 'admin@dropzone.com' });
    if (!existingAdmin) {
      await User.create({
        name: 'Admin',
        email: 'admin@dropzone.com',
        password: 'dropzone123',  // Change this!
        isAdmin: true
      });
      console.log('✅ Admin created: admin@dropzone.com / dropzone123');
    } else {
      console.log('ℹ️  Admin already exists');
    }

    // Create first product
    const existingProduct = await Product.findOne({ name: 'Diamond Polo Tee' });
    if (!existingProduct) {
      await Product.create({
        name: 'Diamond Polo Tee',
        description: 'Premium half-zip polo in olive. Diamond jacquard texture, clean cuts. The kind of piece that turns heads without trying. Limited stock.',
        price: 100,
        images: ['/images/tshirt1.jpeg'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Olive'],
        stock: 10,
        category: 'T-Shirt'
      });
      console.log('✅ First product added: Diamond Polo Tee — ₹100');
    } else {
      console.log('ℹ️  Product already exists');
    }

    console.log('\n🎉 Seed complete! Visit http://localhost:5000');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
