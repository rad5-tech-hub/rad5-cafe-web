# RAD5 Café - Vite React Web Version Design Specification

This document details the layout, design system, component hierarchy, visual assets, and integration logic of the RAD5 Café application. It serves as a comprehensive blueprint to replicate the mobile Expo-router codebase into a modern, responsive **Vite + React** web application.

---

## 1. Technical Stack & Architecture Mappings

| Feature / Service | React Native / Expo Mobile Stack | Vite React Web Stack (Recommended) |
| :--- | :--- | :--- |
| **Framework & Build** | Expo SDK 56 + Metro | **Vite** + **React 19** + **TypeScript** |
| **Routing** | Expo Router (File-based stack/tabs) | **React Router v6** or **TanStack Router** |
| **Styling** | React Native `StyleSheet` / CSS variables | **Tailwind CSS v4** + CSS Custom Properties |
| **Animations** | `react-native-reanimated` | **Framer Motion** or standard Tailwind transitions |
| **Icons** | `@expo/vector-icons` (MaterialCommunityIcons) | **Lucide React** or **React Icons** (Material Design) |
| **Database & Auth** | Firebase JS SDK (v12) | Firebase JS SDK (v12) (Web client) |
| **Payment Integration**| Custom `WebView` + Paystack Standard Redirect | **Paystack Inline JS Popup SDK** (Seamless on-page overlay) |
| **Push Notifications** | Expo Notifications + API tokens | Web Push API (Firebase Cloud Messaging + Service Worker) |

---

## 2. Design System & Global Theme

Replicate these styles using CSS Custom Properties inside `index.css` (or Tailwind theme configurations):

### A. Colors (Dark & Light Mode Palette)

```css
:root {
  /* Light Mode Variables */
  --color-text: #1A1A2E;
  --color-background: #F8F9FA;
  --color-background-element: #FFFFFF;
  --color-background-selected: #E8E8EE;
  --color-text-secondary: #6B7280;
  --color-tint: #003D99;            /* Primary brand blue */
  --color-accent: #8B0000;          /* Highlight red */
  --color-card: #FFFFFF;
  --color-border: #E5E7EB;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-error: #DC2626;

  /* Fonts */
  --font-sans: 'Spline Sans', 'Inter', system-ui, sans-serif;
  --font-rounded: 'SF Pro Rounded', system-ui, sans-serif;
  --font-mono: ui-monospace, Consolas, monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark Mode Variables Override */
    --color-text: #F3F4F6;
    --color-background: #0F172A;     /* Sleek slate-900 background */
    --color-background-element: #1E293B; /* Slate-800 element background */
    --color-background-selected: #334155;
    --color-text-secondary: #94A3B8;
    --color-tint: #3B82F6;          /* Bright electric blue */
    --color-accent: #DC2626;
    --color-card: #1E293B;
    --color-border: #334155;
    --color-success: #10B981;
    --color-warning: #F59E0B;
    --color-error: #EF4444;
  }
}
```

### B. Typography Presets
* **Title (Splash/Auth Title)**: `font-size: 3rem (48px)`, `font-weight: 700`, `line-height: 1.1`, font: Rounded/Sans
* **Subtitle (Section Headers)**: `font-size: 2rem (32px)`, `font-weight: 600`, `line-height: 1.35`
* **Heading (Card Titles)**: `font-size: 1.25rem (20px)`, `font-weight: 700`
* **Default Body**: `font-size: 1rem (16px)`, `font-weight: 500`, `line-height: 1.5`
* **Small / Caption**: `font-size: 0.875rem (14px)`, `font-weight: 500`, `line-height: 1.4`
* **Code / Monospace**: `font-size: 0.75rem (12px)`, `font-family: var(--font-mono)`

### C. Spacing & Border Radius
* **Spacing Scale**:
  * `0.5`: `2px` | `1`: `4px` | `2`: `8px` | `3`: `16px` | `4`: `24px` | `5`: `32px` | `6`: `64px`
* **Border Radius Scale**:
  * `sm`: `6px` | `md`: `12px` | `lg`: `20px` | `xl`: `28px` | `full`: `9999px`

---

## 3. Global Reusable UI Components

These components form the basis of the entire application. In Vite React, implement them using pure React + Tailwind:

### 1. `Card` (`src/components/ui/card.tsx`)
A styled surface container.
* **Props**: `padded: boolean (default true)`, `children`, `className`
* **Styles**:
  * Background: `var(--color-card)`
  * Border Radius: `var(--radius-lg)` (20px)
  * Padding: If padded, `var(--spacing-4)` (24px), else `0`
  * Borders: Border of `1px solid var(--color-border)`

### 2. `Input` (`src/components/ui/input.tsx`)
A labeled form input field with error reporting.
* **Props**: `label: string`, `error: string`, `labelStyle`, input attributes
* **Styles**:
  * Container: Flex column, gap `var(--spacing-1)`
  * Label: `font-size: 14px`, `font-weight: 600`, color `var(--color-text)`
  * Input Field: Background `var(--color-background-element)`, border `1.5px solid var(--color-border)`, border-radius `12px`, padding `10px 16px`, text size `16px`
  * Focus State: Border color becomes `var(--color-tint)` (blue)
  * Error State: Border color becomes `var(--color-error)` (red)

### 3. `Button` (`src/components/ui/button.tsx`)
Standard action trigger.
* **Props**: `variant` (primary, secondary, outline, ghost, danger), `size` (sm, md, lg), `fullWidth: boolean`, `disabled`, `children`
* **Design Presets**:
  * **Primary**: Background: `tint`, Text: `#FFFFFF`
  * **Secondary**: Background: `accent`, Text: `#FFFFFF`
  * **Outline**: Background: `transparent`, Border: `1.5px solid tint`, Text: `tint`
  * **Ghost**: Background: `transparent`, Text: `tint`
  * **Danger**: Background: `error`, Text: `#FFFFFF`
  * **Sizes**:
    * `sm`: Padding `4px 12px`, Font Size `14px`
    * `md`: Padding `8px 16px`, Font Size `16px`
    * `lg`: Padding `16px 24px`, Font Size `18px`

### 4. `AnimatedButton` (`src/components/ui/animated-button.tsx`)
An interactive button with a glowing background animation when `loading` is set to true.
* **Web Implementation (Tailwind/Framer Motion)**:
  Instead of native SVG stroke-dash offsets (which are used on mobile to achieve 60fps), web browsers can easily achieve this using a CSS rotating gradient overlay and box-shadow blurs.
  * When `loading=true`, append a rotating background gradient wrapper under the button.
  * Structure:
    ```html
    <div class="relative overflow-visible group">
      <!-- Glow Layer (Hidden when not loading) -->
      <div class="absolute inset-[-4px] rounded-xl bg-gradient-to-r from-blue-400 via-red-500 to-blue-400 opacity-75 blur-md animate-spin-slow"></div>
      <!-- Actual Button -->
      <button class="relative z-10 w-full rounded-xl bg-tint px-6 py-3 font-semibold text-white">...</button>
    </div>
    ```

### 5. `Badge` (`src/components/ui/badge.tsx`)
Small chip indicators.
* **Props**: `label: string`, `variant` (default, info, success, warning, error)
* **Styles**:
  * Default: Background: `backgroundSelected`, Text: `textSecondary`
  * Info: Background: `tint` + opacity (or light blue), Text: `tint`
  * Success: Background: `success` + 15% opacity, Text: `success`
  * Warning: Background: `warning` + 15% opacity, Text: `warning`
  * Error: Background: `error` + 15% opacity, Text: `error`
  * Padding: `4px 12px`, border-radius `9999px` (fully rounded), `font-size: 12px`, `font-weight: 700`

### 6. `BottomSheet` (`src/components/ui/bottom-sheet.tsx` / Sheets UI)
Bottom drawer on mobile, represented as **Modals or Slide-over Drawer panels** on the Web.
* **Web Design**: On screens larger than 768px, render these sheets as beautiful floating center Modals or Side Drawers (e.g. Slide-over Cart) using Framer Motion (`initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}`). On mobile viewport sizes, they can slide up from the bottom of the viewport.

---

## 4. Visual Assets & Images Directory

The following images and categories are used in the application. In the Vite project, place public images inside `/public/assets/` or reference remote paths:

### A. Background Slideshow (Authentication Background)
The Auth screens run a loop slideshow of three high-definition coffee/cafe-themed images, fading every 3 seconds:
1. `https://images.pexels.com/photos/29445730/pexels-photo-29445730.jpeg` (Coffee pouring / cup art)
2. `https://images.pexels.com/photos/10885488/pexels-photo-10885488.jpeg` (Espresso extraction)
3. `https://images.pexels.com/photos/34932768/pexels-photo-34932768.jpeg` (Barista working)
* **Gradient Overlay (Bottom to Top)**: Overlay a linear gradient with positions:
  * `0%` (Top): `transparent`
  * `55%` (Mid): `rgba(30, 64, 175, 0.35)` (tinted dark blue)
  * `100%` (Bottom): `rgba(30, 58, 138, 0.95)` (solid deep navy blue)

### B. Cafe Banner Image
* Featured hero image on the Café Page header (30% viewport height banner):
  `https://www.africanrecipes.com.ng/wp-content/uploads/2025/07/meat-pie-featured-nigerian-snack.png.webp` (Nigeria meat pies layout)
* **Gradient Tint**: Overlay a fading black gradient `linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.85))` to ensure text and status indicators are readable.

### C. Cafe Menu / Product Images
Pre-defined products mapped to high-quality crop food/drinks photography:
* **Espresso / Coffee**: `https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=200&h=200&fit=crop`
* **Croissant**: `https://images.unsplash.com/photo-1555507036-ab1f4038028a?w=200&h=200&fit=crop`
* **Caffè Latte**: `https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=200&h=200&fit=crop`
* **Muffin / Puff Puff**: `https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=200&h=200&fit=crop`
* **Coca Cola**: `https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=200&fit=crop`
* **Bottled Water**: `https://images.unsplash.com/photo-1600959909624-3c837a9f1df8?w=200&h=200&fit=crop`
* **Meat Pie**: `https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=200&h=200&fit=crop`
* **Chicken Pie**: `https://images.unsplash.com/photo-1625225233840-695456021cde?w=200&h=200&fit=crop`
* **Jollof Rice**: `https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=200&h=200&fit=crop`
* **Fried Rice**: `https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=200&h=200&fit=crop`
* **Samosa**: `https://images.unsplash.com/photo-1601050690597-df0568f70950?w=200&h=200&fit=crop`
* **Chin Chin**: `https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=200&h=200&fit=crop`

---

## 5. Screen-by-Screen Layout & Feature Specifications

### 1. Root / Layout Wrappers
* **Structure**: Context provider hierarchy:
  `AuthProvider` → `CartProvider` → `NotificationProvider` → `ConfirmProvider` → `ToastProvider`.
* **State Management**: Use React context for Auth state (current Firebase user) and Cart state (shopping items, quantities, clear cart operations).

---

### GROUP A: AUTHENTICATION FLOW (Transparent overlay screens on sliding image background)

#### 1. Login Screen (`/(auth)/login`)
* **Layout**: Full-screen vertical layout.
  * **Top Section**: Flex 1, centered. Displays Brand Name **"RAD5 Café"** (`font-size: 56px`, extra-bold, white, with drop shadow) and subtitle **"Wallet & Smart Inventory"** (`font-size: 16px`, white).
  * **Bottom Section**: Houses the primary action card (`max-width: 400px`). Contains a single button **"Continue with Google"** (White pill button with black G logo and bold black text).
* **Interactions**: Clicking "Continue with Google" triggers Firebase authentication via popup. If the user is new, navigate to `/setup-pin`, else navigate directly to the dashboard `/`.

#### 2. Registration Screen (`/(auth)/register`)
* **Layout**: Full-screen centered card (`max-width: 400px`).
* **Components**: Input fields for **Full Name**, **Phone Number**, **Email Address**, and **Password**.
* **Interactions**: A primary action button "Create Account" triggers standard Firebase `createUserWithEmailAndPassword`. A footer link "Already have an account? Sign In" redirects back to the login screen. On successful registration, redirects to the PIN setup screen.

#### 3. Setup PIN Screen (`/(auth)/setup-pin`)
* **Layout**: Title "Set Transaction PIN" and subtitle "Create a 4-digit PIN for secure transactions".
* **Components**: A row of 4 text input boxes (`width: 60px`, `height: 70px`, border-radius 12px, border-width 2px).
* **Interactions**: Inputs are restricted to single-digit numbers. Security masks (`secureTextEntry`) hide digits. Auto-focus advances to the next box upon entry. Once all 4 boxes contain a digit, the "Create PIN" button is unlocked. Triggers `api.auth.setupPin()` and routes to `/`.

---

### GROUP B: MAIN TABS (USER PANELS)

#### 4. Wallet Dashboard (`/` / Tab Index)
The primary landing screen. Responsive grid layout centering content up to `900px` max-width.
* **Components**:
  * **Header**: Floating title "RAD5 Café" and a circular Notification Bell button on the right (navigates to `/notifications`).
  * **Balance Display Card**: Blue/Navy gradient dashboard card showing "Available Balance" (large bold text, e.g. `₦12,500`), wallet identification subtitle "Wallet ID: RAD500042", and action buttons:
    * **Fund**: Opens the Fund Wallet modal.
    * **Refresh**: Refetches wallet balance from backend.
  * **Menu Preview Grid**: 4 grid items showing menu highlights. Uses a grid layout (columns: 2 on mobile, 4 on desktop). Cards display product image, name, price, and add/remove buttons that control the global Shopping Cart.
  * **Recent Transactions Section**: Header with title "Recent Transactions" and "See All" button (routes to `/history`). Renders a list of the last 5 transactions in a Card container.
  * **Floating Cart Bar**: Displays at the screen bottom if the shopping cart count > 0. Shows cart summary ("x items", `₦Total`) and a button "View Cart" that slides open the Cart bottom sheet.

#### 5. Cafe Screen (`/cafe` / Tab Cafe)
Full shopping catalog page.
* **Header**: Large 30% viewport-height banner image of pies with a dark gradient shadow and a title overlay.
* **Sticky Category Bar**: Scrollable horizontal container of Category Chips ("All", "Drinks", "Snacks", "Meals", "Pastries", "Others"). Selecting a chip filters the product list below.
* **Product Catalog Grid**: Responsive auto-fit grid displaying all available items. Items display product card style: image background, dark overlay bottom bar containing title/price.
  * If the item is **Out of Stock**: Apply a low-opacity gray filter over the card, display an red "Out of Stock" Badge, and disable the "Add" button.
  * Hover effects: Standard desktop hover scales up the image slightly (scale 1.05) and increases the button opacity.
* **Floating Cart Bar**: Identical bottom floating cart status bar.

#### 6. Profile Screen (`/profile` / Tab Profile)
User account details.
* **Layout**: Centered profile card.
  * **Avatar Circle**: Circular avatar (`width: 80px`, colored in Tint Blue) displaying the user's name initials (e.g. "JD" for John Doe) in large white bold font.
  * **User Data**: Full Name text and email address underneath.
  * **Settings Actions List**: Settings item buttons (navigating to settings, transaction history, notification configurations, etc.)
  * **Sign Out Button**: Standard red accent button. On press, shows a Confirm Dialog ("Are you sure you want to sign out?"). If approved, triggers Firebase sign out and pushes back to `/login`.

---

### GROUP C: HIDDEN STACK NAVIGATION (ADMIN PANELS)

#### 7. Admin Dashboard (`/admin`)
Full metrics control panel for administrators.
* **Layout**: Vertical stack containing multiple metric rows.
* **Components**:
  * **Greeting Header**: Title "Admin Dashboard" with a blue "Today" badge.
  * **Metrics Grid Rows**: Four sections of grid cards displaying key performance metrics (each metric card has an icon, large text value, and a small label):
    1. **Today**: Revenue (`₦45,000`), Profit (`₦12,500`), Sales Count (`24`).
    2. **Inventory**: Total Products (`42`), Low Stock (`3` - Warning yellow), Out of Stock (`1` - Danger red).
    3. **Customers**: Total Users (`156`), Active Today (`28`).
    4. **Wallet**: Total Wallet Value (`₦1.2M`), Total Transactions (`1,432`).
  * **Quick Actions Row**: Cards linking to administrative sections:
    * "Add Product" → `/add-product`
    * "Inventory" → `/inventory`
    * "View Sales" → `/sales`
    * "Analytics" → `/analytics`
    * "Reports" → `/reports`

#### 8. Inventory Manager (`/inventory`)
Product database management page.
* **Layout**: Filters at the top, list of database products below.
* **Components**:
  * **Top Action Bar**: Primary buttons to "+ Add Product" and "Restock".
  * **Category Filter badges**: Badge filters to filter listed inventory.
  * **Inventory Row Cards**: Detailed card for each product:
    * Title & category label.
    * Stock level Badge: Green "In Stock", Yellow "Low Stock", Red "Out of Stock".
    * Stats Grid: Cost Price, Selling Price, Profit/Unit (calculated), and Current Stock.
    * Summary bottom bar: e.g. "Added: 100 | Sold: 55 | Remaining: 45".

#### 9. Analytics Screen (`/analytics`)
Data visualization dashboard.
* **Layout**: Card components containing graphs and rankings.
* **Components**:
  * **Weekly Revenue Chart**: Horizontal flex bar chart. Days of the week represent columns. Vertical heights of the bars scale relative to the highest daily revenue. Displays currency labels (e.g. `₦12k`, `₦18k`) above the bars.
  * **Top Selling Products Card**: List ordered by quantity sold, showing product name, quantity sold badge, and total revenue.
  * **Most Active Customers Card**: List ordered by transaction volume, displaying customer name, number of transactions, and total wallet spending.

#### 10. Sales Records (`/sales`)
Comprehensive sales list.
* **Layout**: Summary indicators at the top, scrollable sale records below.
* **Components**:
  * **Summary Indicators**: Small cards for Revenue, Profit, and Transaction Count.
  * **Filters Bar**: Badges to filter by period ("Daily", "Weekly", "Monthly", "All").
  * **Sale Record Row**: Details for each transaction:
    * Left side: Product name, customer name, units purchased, and purchase date.
    * Right side: Revenue amount and green profit margin (e.g. `+₦200`).

#### 11. Reports Generator (`/reports`)
Report downloading screen.
* **Layout**: Selectable items.
* **Components**:
  * **Report Types list**: Options to select "Sales Report", "Inventory Report", "Profit Report", "Customer Transactions".
  * **Format Picker**: Card selectors for format selection ("PDF", "Excel", "CSV").
  * **Export Button**: Pumping/loading indicator that generates the file export.

#### 12. Transaction History (`/history`)
The complete account statement ledger.
* **Layout**: Filtering tabs at the top ("Today", "Weekly", "Monthly", "All"), transaction log list below.
* **Transaction Row**:
  * Icon box representing direction: Green arrow-down for wallet credit (funding/received), Red/Orange arrow-up for wallet debit (purchase/transfer sent), Gray close icon for failed.
  * Text block: Type ("Funding", "Purchase", "Transfer Sent"), timestamp.
  * Amount block: Styled dynamically. Positive amounts are prefixed with a green `+₦`, negative amounts with red `-₦`.

---

### GROUP D: MODALS, SHEETS & DRAWER WIZARDS

These are implemented as overlays (Modal boxes) in the web app.

#### 13. Shopping Cart & Checkout Wizard (`/cart` / Cart Sheet)
A 3-step checkout drawer/modal.
* **Step 1: Cart Summary**:
  * Lists each added product with image, unit price, quantity, and total item cost.
  * Counter buttons (`-` and `+`) to update quantities on the fly.
  * Subtotal summary box (displays subtotal, service fee `₦0.00`, and final total).
  * A primary button **"Proceed to Checkout"**.
* **Step 2: Confirm Purchase (PIN Box)**:
  * Title "Confirm Purchase" and total amount display.
  * Secure Transaction PIN entry grid (4 digits).
  * Validation loader overlay while verifying order via `/orders` API.
  * Display error message at the bottom of the card if the transaction PIN is incorrect.
* **Step 3: Successful Receipt**:
  * A large green checkmark success circle.
  * Digital Receipt styling: dotted line margins, store header "RAD5 Café", Date/Time, Receipt No, detailed product manifest table, and total paid.
  * Quick actions: "Download Receipt", "Share Receipt", and a main "Back to Café" button.

#### 14. Fund Wallet Drawer (`/fund-wallet` / Fund Sheet)
Wallet deposit helper.
* **Components**:
  * Main numeric currency input (displays a large currency sign `₦` beside input).
  * Quick select amount grids (`₦1,000`, `₦2,000`, `₦5,000`, `₦10,000`, `₦20,000`, `₦50,000`). Clicking a chip sets the input.
  * Action button: "Pay ₦[Amount]". On press, loads the Paystack Inline SDK.
* **Paystack Integration (Web mapping)**:
  Instead of launching a native browser WebView modal, initialize Paystack Inline SDK inside the browser:
  ```javascript
  import PaystackPop from '@paystack/inline-js';

  const handler = PaystackPop.setup({
    key: 'pk_test_xxxxxxxxxx',
    email: user.email,
    amount: amount * 100, // in kobo
    ref: reference,
    callback: function(response){
      // triggers onSuccess verify API call
    },
    onClose: function(){
      // user closed payment popup
    }
  });
  handler.openIframe();
  ```

#### 15. Transfer Wallet Drawer (`/transfer` / Transfer Sheet) - [EXCLUDED]
*Note: This peer-to-peer wallet transfer feature is excluded from the Web application per user requirements.*


#### 16. Restock Product Sheet (`/restock` / Restock Sheet)
* **Components**:
  * Grid selection of existing products (displays Name & current stock count).
  * Input for **Quantity Added**.
  * Input for **New Cost Price (optional)**.
  * Action button: "Add [Quantity] units". Triggers inventory restock.

#### 17. Add Product Sheet (`/add-product` / Add Product Sheet)
* **Components**:
  * Input fields: **Product Name**, **Category**, **Description**, **Cost Price (₦)**, **Selling Price (₦)**, **Initial Quantity**.
  * **Dynamic Profit Indicator**: As cost price and selling price are filled out, display a small summary banner showing **"Profit Per Unit"** computed dynamically (Selling Price - Cost Price), colored Green if positive, Red if negative.
  * Action button: "Add Product".

---

## 6. Interaction States & Dynamic Animations

Vite React should replicate the premium look-and-feel of the mobile app with smooth CSS/JS transitions:

1. **Micro-Animations (Hover / Active States)**:
   * **Buttons**: Scaling hover effect (`scale: 1.02`), dim opacity on active click (`opacity: 0.85`), and smooth transitions (`transition: all 0.2s ease-in-out`).
   * **Product Cards**: Slight lift shadow (`box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1)`) and image scale-up inside the hidden boundary.
2. **Page Transitions**:
   * Wrap main route views in Framer Motion `<motion.div>` overlays to animate views fading in (`initial={{ opacity: 0 }}` to `animate={{ opacity: 1 }}`) when navigating.
3. **Skeleton Loading Screens**:
   * Replace loading spinners with shimmering placeholder skeletons for cards, grids, and list rows while refetching data from APIs to elevate perceived performance.
