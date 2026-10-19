# Diva — E-Commerce Store

A complete, production-ready e-commerce web application for **Diva** — a women's gifting and accessories store selling Korean earrings, cute jewellery, scrunchies, hair accessories, and gift hampers.

## Technology Stack

- **Frontend / Backend**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS (custom brand palette)
- **Database**: MongoDB + Mongoose
- **Authentication**: Custom JWT (jose) with secure HTTP-only cookies
- **Payments**: Admin-uploaded static UPI QR code with manual verification
- **Images**: Server filesystem (`public/uploads/`) — no external CDN required
- **Validation**: Zod + server-side magic-byte file validation

---

## Quick Start

### 1. Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- A server/host with **persistent writable storage** (see Deployment section)

### 2. Clone & Install

```bash
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env.local
```

**Required:**
```env
MONGODB_URI=mongodb://localhost:27017/Diva
JWT_SECRET=your-random-32-char-jwt-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Optional — upload directory overrides (defaults shown):**
```env
UPLOAD_DIR=public/uploads
PRIVATE_UPLOAD_DIR=uploads/payment-proofs
MAX_PRODUCT_IMAGE_SIZE_MB=5
MAX_QR_IMAGE_SIZE_MB=3
MAX_PAYMENT_PROOF_SIZE_MB=5
```

### 4. Seed Initial Admin

```bash
npm run seed:admin
```

Uses `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, and `ADMIN_SEED_NAME` from `.env.local`.

> **⚠️ Change the password after first login!**

### 5. (Optional) Seed Demo Products

```bash
npm run seed:demo
```

### 6. Start Development Server

```bash
npm run dev
```

Visit:
- **Store**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/login

---

## Image Uploads

All images are stored on the **server filesystem**, not in any external service.

### Upload directories

| Category       | Path                        | Access             |
|----------------|-----------------------------|--------------------|
| Product images | `public/uploads/products/`  | Public URL         |
| QR codes       | `public/uploads/qr/`        | Public URL         |
| Payment proofs | `uploads/payment-proofs/`   | **Admin-only API** |

Payment proofs are stored **outside `public/`** and served only through the authenticated route `GET /api/admin/payment-proof/[filename]`. Customers cannot access them directly.

### Filename safety

The server generates a cryptographically random filename for every upload. The original client-supplied filename is never used on disk. File type is validated via magic bytes, not the `Content-Type` header.

---

## Payment

The store uses a **static UPI QR code** with manual admin verification. There is no payment gateway.

### Setup

1. Go to **Admin → Settings → Payments**
2. Upload your UPI QR code image (PNG, JPG, or WebP, max 3 MB)
3. Enter your UPI ID and any payment instructions for customers
4. Click **Save Payment Settings**

Download your QR image from Google Pay, PhonePe, Paytm, or your bank's merchant portal.

### Payment flow

1. Customer fills in delivery details and places the order
2. Checkout displays your uploaded QR code and the exact amount to pay
3. Customer scans the QR with any UPI app (GPay, PhonePe, Paytm, BHIM…)
4. Customer uploads a screenshot of the successful payment, plus an optional UTR reference
5. Order status becomes **Verification Required**
6. Admin opens the order in the dashboard, views the screenshot, and checks the actual payment in the bank/UPI merchant console
7. Admin clicks **Verify & Confirm** (requires an explicit confirmation dialog)
8. Order status becomes **Paid → Confirmed** and inventory is deducted

> **⚠️ Never trust a screenshot alone** — always verify in your bank or UPI merchant app before confirming.

---

## MongoDB Setup

### Local MongoDB

```bash
docker run -d -p 27017:27017 --name mongo mongo:7
```

Set `MONGODB_URI=mongodb://localhost:27017/Diva`

> **Note:** MongoDB transactions for atomic stock deduction require a replica set. Use Atlas in production, or start local MongoDB with `mongod --replSet rs0` and run `rs.initiate()`.

### MongoDB Atlas (Recommended)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist your IP
3. Copy the connection string to `MONGODB_URI`

---

## Admin Panel

### Key Features

- **Dashboard**: Live stats — orders, revenue, inventory alerts
- **Products**: Add/edit products with multiple server-uploaded images
- **Categories**: Create and manage product categories
- **Orders**: View all orders, verify QR payments, update fulfilment status
- **Customers**: View customer list and purchase history
- **Coupons**: Percentage or fixed discount codes
- **Settings → Payments**: Upload UPI QR code, set UPI ID and instructions
- **Settings → Shipping**: Free shipping threshold, delivery charges

---

## Deployment Requirements

> **⚠️ Local filesystem uploads require persistent writable storage.**

The application writes uploaded images to the server's local filesystem. This works correctly with:

- Self-managed VPS or dedicated servers
- Managed hosting with persistent disk volumes
- Docker containers with a mounted volume for `public/uploads/` and `uploads/`

**Not suitable for:**

- **Vercel Serverless** — read-only filesystem; writes are lost between deployments
- **AWS Lambda** or similar FaaS platforms without a mounted EFS volume
- Any serverless platform that does not provide persistent disk storage

If you deploy to a serverless host, swap the upload backend for object storage (e.g. AWS S3, Cloudflare R2) by replacing `saveUploadedFile` / `deleteUploadedFile` in `src/lib/upload.ts`. This application does not do that automatically — the choice of storage backend is yours.

### Production environment variables

```env
MONGODB_URI=...
JWT_SECRET=...              # at least 32 random characters
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production
```

### Build

```bash
npm run build
npm start
```

---

## Security Notes

- Admin routes protected by JWT middleware (Edge Runtime)
- Passwords hashed with bcrypt (12 rounds)
- Payment confirmation requires explicit admin action and a confirmation dialog
- Prices are always calculated server-side; client-submitted totals are ignored
- File uploads validated by magic bytes — MIME type and filename from the client are not trusted
- Generated random filenames prevent enumeration attacks
- Payment proof files stored outside `public/` — inaccessible without admin auth
- Stock deduction is atomic and idempotent (prevents overselling)
- Login rate-limited to 10 attempts per 15 minutes per IP

---

## Project Structure

```
src/
├── app/
│   ├── (storefront)/               # Customer-facing pages
│   │   ├── page.tsx                # Homepage
│   │   ├── products/               # Product listing & detail
│   │   ├── cart/                   # Cart page
│   │   ├── checkout/               # Checkout flow
│   │   └── order-confirmation/     # Post-order status page
│   ├── admin/                      # Admin dashboard
│   └── api/
│       ├── admin/
│       │   ├── upload/             # Image upload endpoint
│       │   ├── upload/delete/      # Image deletion endpoint
│       │   ├── payment-proof/      # Authenticated proof viewer
│       │   ├── products/
│       │   ├── orders/
│       │   └── settings/
│       ├── orders/                 # Order creation
│       ├── payments/
│       │   └── qr-proof/           # Payment screenshot submission
│       └── store/                  # Public store data
├── components/
│   ├── admin/
│   │   ├── ProductForm.tsx         # Server-upload product images
│   │   ├── PaymentSettingsForm.tsx # QR image upload & UPI config
│   │   └── AdminOrderActions.tsx   # Payment verify/reject actions
│   └── checkout/
│       ├── CheckoutPage.tsx        # Two-step checkout form
│       └── QRPaymentStep.tsx       # QR display + proof upload
├── contexts/
│   └── CartContext.tsx
├── lib/
│   ├── auth.ts                     # JWT utilities
│   ├── inventory.ts                # Atomic stock management
│   ├── mongodb.ts                  # DB connection
│   ├── pricing.ts                  # Server-side order totals
│   ├── upload.ts                   # Server-side upload utility
│   └── utils.ts
├── models/                         # Mongoose schemas
└── middleware.ts                   # Route protection
public/
└── uploads/
    ├── products/                   # Product images (public)
    └── qr/                         # QR code images (public)
uploads/
└── payment-proofs/                 # Payment proofs (private)
```

---

## License

Private — Diva Store. All rights reserved.
