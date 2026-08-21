# ShopEasy — Basic React Ecommerce

A simple ecommerce demo with:

- **Home** – Hero + featured products
- **Products** – Listing with category filter & sorting
- **Product Detail** – Full product view + Add to Basket
- **Basket (Cart)** – Quantity controls, totals, free shipping over $50
- **Login / Register** – Demo auth (any email + password)
- **Payment** – Shipping + card form (requires login, demo only)
- **Confirmation** – Order success page

## Quick Start

```bash
cd ecommerce-app
npm install
npm run dev
```

Open http://localhost:5173

## Login (demo)

- Use **any email** and a password of **at least 4 characters**
- No real backend — state is stored in `localStorage`
- Checkout (`/payment`) requires you to be logged in

## Tech

- React 19 + Vite
- React Router
- Context API for cart + auth (both persisted in localStorage)
- Plain CSS (no UI library)

## Notes

- Product images use Unsplash (requires internet)
- Payment is simulated — no real charges
- Cart and login survive page refresh via localStorage
