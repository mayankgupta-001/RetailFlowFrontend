# RetailFlow Frontend

Modern web interface for **RetailFlow**, a retail inventory and point-of-sale management system.

RetailFlow provides a unified interface for managing products, inventory, sales, checkout, invoices, barcode workflows, and sales analytics.

> **Backend:** [RetailFlowBackend](https://github.com/mayankgupta-001/RetailFlowBackend)

---

## Overview

RetailFlow Frontend is a responsive React application designed for retail operations.

It communicates with the RetailFlow REST API to provide an interactive interface for:

- Product management
- Inventory management
- Point-of-sale checkout
- Sales and invoice management
- Barcode scanning and generation
- Sales analytics and reporting
- Authentication and protected application routes

The frontend is built with **React, TypeScript, Vite, and Tailwind CSS**, with a focus on usability, responsive design, and maintainable component architecture.

---

## Features

### Authentication

- Secure login flow
- JWT-based authentication
- Protected application routes
- Persistent authentication state
- Automatic authorization headers for API requests
- Logout functionality

### Product Management

- View products
- Add new products
- Edit product information
- Delete products
- Search and filter products
- Product category management
- Stock information
- Barcode information

### Inventory Management

- View current stock
- Adjust inventory
- Track inventory changes
- Monitor stock levels
- Inventory history

### Point of Sale

- Search products
- Barcode-based product lookup
- Add products to cart
- Update quantities
- Remove products
- Apply discounts
- Select payment methods
- Validate checkout information
- Complete sales transactions

### Sales & Invoices

- View completed sales
- View invoice details
- View transaction information
- Void eligible sales
- Track payment methods
- Restore inventory when applicable

### Barcode

- Display product barcodes
- Barcode lookup
- Barcode image generation
- Print barcode functionality
- Camera-based barcode scanning

### Analytics

- Sales summaries
- Revenue information
- Sales trends
- Product-related statistics
- Visual charts for business insights

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React | UI development |
| TypeScript | Type-safe development |
| Vite | Development and build tooling |
| Tailwind CSS | Styling and responsive UI |
| React Router | Client-side routing |
| Lucide React | UI icons |
| React Icons | Additional icons |
| Chart.js | Data visualization |
| react-chartjs-2 | React integration for Chart.js |
| Fetch API | Backend communication |

---

## Architecture

```text
┌──────────────────────────────┐
│        RetailFlow UI         │
│       React + TypeScript     │
└──────────────┬───────────────┘
               │
               │ HTTP / REST API
               │ JWT Authorization
               ▼
┌──────────────────────────────┐
│      RetailFlow Backend      │
│       Spring Boot API        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│         PostgreSQL           │
│          Database            │
└──────────────────────────────┘
```

The frontend is intentionally separated from the backend so that each application can be developed, tested, deployed, and maintained independently.

---

## Project Structure

```text
src/
├── api/
│   └── api.ts
│
├── assets/
│
├── components/
│   ├── AddProductForm.tsx
│   ├── CameraScanner.tsx
│   ├── Navbar.tsx
│   └── ...
│
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── ProductList.tsx
│   ├── CheckoutPage.tsx
│   ├── SalesPage.tsx
│   └── ...
│
├── App.tsx
├── main.tsx
└── index.css
```

The exact structure may evolve as the application grows.

---

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 20+
- npm
- Git
- RetailFlow Backend

Verify your Node.js installation:

```bash
node --version
npm --version
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/mayankgupta-001/RetailFlowFrontend.git
```

Navigate into the project:

```bash
cd RetailFlowFrontend
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Environment variable

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the RetailFlow backend | `http://localhost:8080` |

> Do not commit `.env` files containing secrets or private configuration.

---

## Running the Application

Start the development server:

```bash
npm run dev
```

The application will normally be available at:

```text
http://localhost:5173
```

Make sure the RetailFlow backend is running before using features that require API access.

---

## Production Build

Create an optimized production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## API Communication

All backend communication is centralized through the frontend API layer.

Example:

```text
React Component
       │
       ▼
   API Layer
       │
       ▼
RetailFlow REST API
       │
       ▼
   PostgreSQL
```

Authenticated requests include the JWT access token in the `Authorization` header:

```http
Authorization: Bearer <token>
```

This keeps authentication handling consistent across API requests.

---

## Authentication Flow

```text
User
 │
 ▼
Login Page
 │
 ▼
POST /api/auth/login
 │
 ▼
Backend validates credentials
 │
 ▼
JWT returned
 │
 ▼
Frontend stores authentication state
 │
 ▼
Protected API requests
 │
 ▼
Backend validates JWT
```

Routes requiring authentication are protected on the frontend and backend.

> Backend authorization remains the source of truth for application security. Frontend route protection should not be considered a security boundary by itself.

---

## Product Workflow

```text
Products
   │
   ├── View Products
   │
   ├── Add Product
   │
   ├── Edit Product
   │
   ├── Delete Product
   │
   └── Barcode
          │
          ├── Lookup
          ├── Display
          └── Print
```

---

## Checkout Workflow

```text
Select Product
      │
      ▼
Add to Cart
      │
      ▼
Update Quantity
      │
      ▼
Apply Discount
      │
      ▼
Select Payment Method
      │
      ▼
Validate Checkout
      │
      ▼
Complete Sale
      │
      ▼
Invoice / Sale Record
```

The backend remains responsible for authoritative business rules such as stock availability, transaction validation, discount validation, and sale creation.

---

## Barcode Workflow

RetailFlow supports barcode-based product workflows.

```text
Barcode
   │
   ├── Manual Entry
   │
   ├── Camera Scanner
   │
   └── Product Barcode Image
          │
          ▼
     Backend API
          │
          ▼
     Product Lookup
```

Barcode scanning can be used during checkout to quickly identify products.

---

## UI & Design

The interface is designed around:

- Responsive layouts
- Clear navigation
- Consistent spacing
- Reusable components
- Accessible controls
- Mobile-friendly interfaces
- Simple retail workflows
- Data-focused dashboards

The UI uses Tailwind CSS for responsive styling and utility-based component design.

---

## Development

Start the development server:

```bash
npm run dev
```

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Before submitting a pull request, make sure the project builds successfully:

```bash
npm run build
```

---

## Backend Repository

RetailFlow Frontend requires the RetailFlow backend for API functionality.

**RetailFlow Backend**

https://github.com/mayankgupta-001/RetailFlowBackend

The backend provides:

- Authentication
- Product APIs
- Inventory APIs
- Checkout APIs
- Sales APIs
- Invoice APIs
- Barcode APIs
- Reporting APIs

---

## Open Source Development

Development work is tracked through GitHub Issues and pull requests.

If you want to contribute:

1. Check existing issues.
2. Look for an issue that interests you.
3. Discuss larger changes before implementation.
4. Fork the repository.
5. Create a feature branch.
6. Make your changes.
7. Run the production build.
8. Open a pull request.

Example:

```bash
git checkout -b feature/product-search
```

After making your changes:

```bash
git add .
git commit -m "feat: improve product search"
git push origin feature/product-search
```

Then open a pull request against the `main` branch.

---

## Reporting Bugs

If you find a bug, please open a GitHub issue with:

- Clear description of the problem
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser and operating system
- Relevant screenshots or console errors
- Related API/backend errors if applicable

Avoid posting passwords, access tokens, API keys, or other sensitive information.

---

## Security

Please do not report security vulnerabilities through public GitHub issues.

Use the repository's security reporting mechanism when reporting vulnerabilities or sensitive security issues.

Do not commit:

```text
.env
API keys
JWT secrets
Passwords
Private credentials
Access tokens
```

---

## Related Repository

### RetailFlow Backend

Spring Boot REST API powering the RetailFlow application.

https://github.com/mayankgupta-001/RetailFlowBackend

---

## Author

**Mayank Gupta**

GitHub:  
https://github.com/mayankgupta-001

---

## RetailFlow

A modern retail management system focused on inventory, point-of-sale operations, sales management, and business visibility.
