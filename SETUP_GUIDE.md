# 🔥 DROPZONE COLLECTION — COMPLETE SETUP GUIDE (Windows)
## From Zero to Live Website — Free, Step by Step

---

## WHAT YOU'LL GET
- Full e-commerce website for Dropzone
- Node.js + Express backend
- MongoDB database (free)
- Razorpay payments
- Delhivery shipping
- Admin panel to manage products & orders
- Deployed free on Render.com

---

## STEP 1 — INSTALL REQUIRED SOFTWARE

### 1A. Install Node.js
1. Go to: https://nodejs.org
2. Click "LTS" (green button) → Download
3. Run the installer → Click Next until done
4. Open CMD and verify:
   ```
   node --version
   npm --version
   ```
   You should see version numbers.

### 1B. Install Git
1. Go to: https://git-scm.com/download/win
2. Download and install (all defaults are fine)
3. Verify: `git --version`

---

## STEP 2 — SET UP FREE MONGODB DATABASE

1. Go to: https://mongodb.com/atlas
2. Click "Try Free" → Create account (Google login works)
3. Choose "Free" plan (M0 cluster)
4. Pick any region → Click "Create"
5. When asked "How would you like to authenticate?":
   - Username: `dropzoneuser`
   - Password: create a strong password → SAVE IT
6. When asked "Where would you like to connect from?":
   - Add IP: `0.0.0.0/0` (allows all — fine for now)
7. Click "Connect" → "Drivers" → Copy the connection string
   It looks like: `mongodb+srv://dropzoneuser:PASSWORD@cluster0.xxxxx.mongodb.net/`
8. Replace `<password>` with your actual password
9. Add `/dropzone` at the end: `mongodb+srv://dropzoneuser:PASSWORD@cluster0.xxxxx.mongodb.net/dropzone`

---

## STEP 3 — SET UP RAZORPAY (FREE)

1. Go to: https://razorpay.com
2. Sign up with your business details
3. Go to Dashboard → Settings → API Keys
4. Click "Generate Test Key"
5. SAVE: Key ID and Key Secret

---

## STEP 4 — SET UP DELHIVERY (FREE)

1. Go to: https://www.delhivery.com/
2. Register as a business shipper
3. After approval, go to Settings → API
4. Get your API Token
5. Create a Warehouse/Pickup location
6. Save the warehouse name

---

## STEP 5 — CONFIGURE YOUR PROJECT

Open the file: `backend/.env`
Replace all placeholder values:

```
MONGO_URI=mongodb+srv://dropzoneuser:YOURPASSWORD@cluster0.xxxxx.mongodb.net/dropzone
JWT_SECRET=any_random_long_string_here_like_dropzone_super_secret_2026
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX
DELHIVERY_TOKEN=your_delhivery_token_here
DELHIVERY_WAREHOUSE_NAME=YourWarehouseName
FRONTEND_URL=http://localhost:5000
```

Also update `frontend/pages/checkout.html`:
- Find: `key: 'YOUR_RAZORPAY_KEY_ID'`
- Replace with your actual key: `key: 'rzp_test_XXXXXXXXXXXXXXXXX'`

---

## STEP 6 — RUN THE PROJECT LOCALLY

Open CMD (Win+R → type cmd → Enter)

```bash
# Go to backend folder
cd C:\Users\imaad\Downloads\DROPZONE1\backend

# Install packages (only first time)
npm install

# Add first product and admin account
node seed.js

# Start the server
npm start
```

Open browser: http://localhost:5000

✅ You should see the Dropzone website!

**Test login:**
- Email: admin@dropzone.com
- Password: dropzone123
- Go to /pages/admin.html to manage products

---

## STEP 7 — DEPLOY FREE ON RENDER.COM

### 7A. Push to GitHub (free)
1. Go to: https://github.com → Create account → New repository
2. Name it: `dropzone`
3. In CMD:
   ```bash
   cd C:\Users\imaad\Downloads\DROPZONE1
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/dropzone.git
   git push -u origin main
   ```

### 7B. Deploy on Render
1. Go to: https://render.com → Sign up with GitHub
2. Click "New" → "Web Service"
3. Connect your `dropzone` repo
4. Settings:
   - **Name**: dropzone-collection
   - **Root Directory**: backend
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables (same as your .env file):
   - MONGO_URI → your MongoDB URI
   - JWT_SECRET → your secret
   - RAZORPAY_KEY_ID → your key
   - RAZORPAY_KEY_SECRET → your secret
   - DELHIVERY_TOKEN → your token
   - DELHIVERY_WAREHOUSE_NAME → your warehouse
   - FRONTEND_URL → https://your-app-name.onrender.com
6. Click "Deploy"

🎉 Render gives you a free URL like: `https://dropzone-collection.onrender.com`

---

## STEP 8 — AFTER DEPLOYING

1. Update `FRONTEND_URL` in Render env vars to your Render URL
2. In `frontend/pages/checkout.html`:
   - Change Razorpay key from test to LIVE key (from Razorpay dashboard)
3. Run seed on production: use Render Shell → `node seed.js`

---

## FOLDER STRUCTURE EXPLAINED

```
DROPZONE1/
├── backend/
│   ├── server.js          ← Main server file
│   ├── seed.js            ← Run once to add first product
│   ├── .env               ← Your secret keys (NEVER share)
│   ├── models/
│   │   ├── User.js        ← User database schema
│   │   ├── Product.js     ← Product database schema
│   │   └── Order.js       ← Order database schema
│   ├── routes/
│   │   ├── auth.js        ← Login/register API
│   │   ├── products.js    ← Products API
│   │   ├── orders.js      ← Orders API
│   │   ├── payment.js     ← Razorpay API
│   │   └── shipping.js    ← Delhivery API
│   └── uploads/           ← Product images stored here
└── frontend/
    ├── index.html         ← Homepage
    ├── images/            ← Logo & product images
    ├── css/style.css      ← All styling
    ├── js/app.js          ← Shared JavaScript
    └── pages/
        ├── shop.html      ← All products
        ├── product.html   ← Single product page
        ├── cart.html      ← Shopping cart
        ├── checkout.html  ← Payment
        ├── login.html     ← Login
        ├── register.html  ← Register
        ├── orders.html    ← My orders
        └── admin.html     ← Admin panel
```

---

## TROUBLESHOOTING

**"npm is not recognized"** → Node.js not installed. Redo Step 1.

**"MongoServerError"** → Check your MONGO_URI in .env. Make sure password is correct.

**Website shows but no products** → Run `node seed.js` in the backend folder.

**Payment not working** → Make sure Razorpay key is in checkout.html. Use test keys first.

**Render deploy fails** → Check Root Directory is set to `backend`

---

## USEFUL COMMANDS

```bash
# Start development server
npm run dev

# Start production server  
npm start

# Add first product (run once)
node seed.js
```

---

## FREE LIMITS

| Service | Free Limit |
|---------|-----------|
| Render | 750 hrs/month (always on) |
| MongoDB Atlas | 512MB storage |
| Razorpay | No monthly fee, 2% per transaction |
| Delhivery | Pay per shipment only |

**Total monthly cost: ₹0** (until you scale up!)

---

Made with ❤️ for Dropzone Collection
