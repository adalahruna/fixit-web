# Panduan UI/UX Design - Sistem Booking Bengkel Motor

## Daftar Isi
1. [Design System Overview](#design-system-overview)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Button Components](#button-components)
5. [Layout Structure](#layout-structure)
6. [Page-by-Page Guide](#page-by-page-guide)
7. [Interactive Elements](#interactive-elements)
8. [Responsive Design](#responsive-design)
9. [Animation & Transitions](#animation--transitions)

---

## Design System Overview

### Framework & Styling
- **CSS Framework**: Tailwind CSS
- **Component Library**: Custom React components
- **Icons**: Heroicons (SVG icons)
- **Font**: Arial, Helvetica, sans-serif

### Design Principles
- **Clean & Minimal**: White backgrounds dengan subtle shadows
- **Professional**: Business-oriented dengan warna yang tidak terlalu mencolok
- **Accessible**: Kontras warna yang baik dan focus states yang jelas
- **Responsive**: Mobile-first approach

---

## Color Palette

### Primary Colors
```css
/* Blue - Primary Action */
bg-blue-50, bg-blue-100, bg-blue-500, bg-blue-600, bg-blue-700
text-blue-600, text-blue-700, text-blue-800

/* Green - Success/Complete */
bg-green-50, bg-green-100, bg-green-600, bg-green-700
text-green-600, text-green-700, text-green-800

/* Red - Danger/Cancel */
bg-red-50, bg-red-100, bg-red-600, bg-red-700
text-red-600, text-red-700, text-red-800

/* Orange - Warning/In Progress */
bg-orange-50, bg-orange-100, bg-orange-600, bg-orange-700
text-orange-600, text-orange-700, text-orange-800

/* Purple - Analytics/Reports */
bg-purple-50, bg-purple-100, bg-purple-600, bg-purple-700
text-purple-600, text-purple-700, text-purple-800

/* Gray - Neutral */
bg-gray-50, bg-gray-100, bg-gray-300, bg-gray-600, bg-gray-900
text-gray-500, text-gray-600, text-gray-700, text-gray-900
```

### Background Colors
- **Main Background**: `bg-gray-50` (Light gray untuk body)
- **Card Background**: `bg-white` (White untuk cards/containers)
- **Navigation**: `bg-white` dengan `shadow-sm border-b`

---

## Typography

### Headings
```css
/* Page Title */
h1: text-3xl font-bold text-gray-900

/* Section Title */
h2: text-xl font-semibold text-gray-900 mb-2

/* Subsection */
h3: text-lg font-semibold text-gray-900

/* Card Title */
h4: text-xl font-semibold text-gray-800
```

### Body Text
```css
/* Regular Text */
p: text-gray-600

/* Small Text */
text-sm text-gray-600

/* Label */
text-sm font-medium text-gray-700

/* Muted Text */
text-xs text-gray-500
```

---

## Button Components

### 1. Primary Button
**Penggunaan**: Main actions, submit forms
```css
Kelas: bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition
Ukuran: px-4 py-2 (small), px-6 py-3 (large)
```

### 2. Secondary Button
**Penggunaan**: Cancel, back actions
```css
Kelas: border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50
```

### 3. Success Button
**Penggunaan**: Complete, confirm actions
```css
Kelas: bg-green-600 text-white hover:bg-green-700
```

### 4. Danger Button
**Penggunaan**: Delete, cancel booking
```css
Kelas: bg-red-600 text-white hover:bg-red-700
```

### 5. Warning Button
**Penggunaan**: Reschedule, edit actions
```css
Kelas: bg-orange-600 text-white hover:bg-orange-700
```

### 6. Disabled Button
```css
Kelas: bg-gray-300 text-gray-500 cursor-not-allowed
```

### Button States & Transitions
- **Hover**: Warna lebih gelap (contoh: blue-600 → blue-700)
- **Loading**: `disabled:bg-gray-400 disabled:cursor-not-allowed`
- **Transition**: `transition-colors duration-200`

---

## Layout Structure

### Navigation Bar
```css
Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
Height: h-16
Background: bg-white shadow-sm border-b
```

### Main Content
```css
Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12
Background: min-h-screen bg-gray-50
```

### Cards/Containers
```css
Card: bg-white p-6 rounded-lg shadow
Grid: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

---

## Page-by-Page Guide

### 1. Landing Page (`/`)
**Komponen Wajib**:
- Navigation bar dengan logo dan login/register buttons
- Hero section dengan judul dan deskripsi
- Service cards grid (3 kolom di desktop)
- CTA button "Mulai Booking Sekarang"

**Buttons**:
- Login: `text-blue-600 hover:text-blue-700`
- Register: `bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700`
- CTA: `bg-blue-600 text-white px-8 py-3 rounded-md text-lg hover:bg-blue-700 transition`

### 2. Login Page (`/login`)
**Komponen Wajib**:
- Centered form container (`max-w-md w-full`)
- Form dengan email dan password fields
- Submit button full width
- Link ke register page

**Form Elements**:
- Input: `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`
- Label: `block text-sm font-medium text-gray-700 mb-1`
- Submit: `w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition`

### 3. Dashboard Pages

#### Admin Dashboard (`/admin`)
**Komponen Wajib**:
- Welcome card dengan nama user
- Quick navigation grid (3 kolom)
- Stats cards (3 kolom)
- Quick action links

**Navigation Items**:
- Background: `bg-{color}-50 hover:bg-{color}-100`
- Icon container: `bg-{color}-100 text-{color}-600`
- Badge: `px-2 py-1 text-xs font-medium rounded-full`

#### Customer Dashboard (`/customer`)
**Komponen Wajib**:
- Welcome message
- Quick navigation (2 items)
- Booking stats (3 kolom)
- Quick action CTA dengan gradient background

#### Mechanic Dashboard (`/mechanic`)
**Komponen Wajib**:
- Welcome message dengan warning jika tidak linked
- Navigation dengan badge untuk queue count
- Work stats (3 kolom)
- Conditional quick action jika ada queue

#### Owner Dashboard (`/owner`)
**Komponen Wajib**:
- Business overview stats (4 kolom)
- Quick navigation
- Quick action cards dengan gradient

### 4. Form Pages

#### Booking Form (`/customer/bookings/new`)
**Komponen Wajib**:
- Multi-section form dengan cards
- Date/time pickers dengan validation
- Service selection dengan checkboxes
- Slot availability feedback
- Submit/cancel buttons

**Feedback States**:
- Checking: `bg-blue-50 border border-blue-200 text-blue-700`
- Available: `bg-green-50 border border-green-200 text-green-700`
- Unavailable: `bg-red-50 border border-red-200 text-red-700`

### 5. List Pages

#### Booking List
**Komponen Wajib**:
- Filter/search bar
- Status badges dengan warna sesuai status
- Action buttons (Detail, Cancel, Reschedule)
- Pagination

**Status Badges**:
```css
pending: bg-yellow-100 text-yellow-800
confirmed: bg-blue-100 text-blue-800
in_progress: bg-green-100 text-green-800
done: bg-gray-100 text-gray-800
cancelled: bg-red-100 text-red-800
```

### 6. Detail Pages

#### Booking Detail
**Komponen Wajib**:
- Header dengan status badge
- Information sections dalam cards
- Action buttons area
- Back navigation link

**Action Buttons**:
- Start Service: `bg-green-600 hover:bg-green-700`
- Complete Service: `bg-blue-600 hover:bg-blue-700`
- Cancel: `bg-red-600 hover:bg-red-700`
- Reschedule: `bg-orange-600 hover:bg-orange-700`

---

## Interactive Elements

### 1. Modal/Dialog
```css
Overlay: fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50
Container: bg-white rounded-lg max-w-md w-full p-6
```

### 2. Dropdown/Select
```css
Select: w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
```

### 3. Checkbox/Radio
```css
Checkbox: mt-1 (untuk alignment dengan text)
Label: flex items-start space-x-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer
```

### 4. Loading States
```css
Button Loading: disabled:bg-gray-400 disabled:cursor-not-allowed
Text: "Memproses..." atau "Loading..."
```

---

## Responsive Design

### Breakpoints
- **Mobile**: Default (< 768px)
- **Tablet**: `md:` (≥ 768px)
- **Desktop**: `lg:` (≥ 1024px)

### Grid Responsive
```css
Mobile: grid-cols-1
Tablet: md:grid-cols-2
Desktop: lg:grid-cols-3 atau lg:grid-cols-4
```

### Navigation Responsive
- Mobile: Stack vertically, hamburger menu jika perlu
- Desktop: Horizontal layout

---

## Animation & Transitions

### Hover Effects
```css
/* Button Hover */
hover:bg-{color}-700
hover:shadow-md

/* Card Hover */
hover:shadow-lg transition-shadow

/* Link Hover */
hover:text-{color}-800
hover:underline
```

### Loading Animations
```css
/* Spinner (jika diperlukan) */
animate-spin

/* Fade In */
transition-opacity duration-200
```

### Page Transitions
- Menggunakan Next.js default page transitions
- Smooth scrolling untuk anchor links

---

## Accessibility Guidelines

### Focus States
```css
focus:outline-none focus:ring-2 focus:ring-blue-500
```

### Color Contrast
- Minimum contrast ratio 4.5:1 untuk normal text
- Minimum contrast ratio 3:1 untuk large text

### Interactive Elements
- Minimum touch target 44px x 44px
- Clear hover dan focus states
- Descriptive button text (tidak hanya "Click here")

---

## Component Specifications

### Quick Navigation Component
**File**: `components/dashboard/QuickNavigation.tsx`
- Grid layout dengan responsive columns
- Color-coded icons dan backgrounds
- Badge support untuk notifications
- Hover effects dengan color transitions

### Service Action Buttons
**File**: `components/progress/ServiceActionButtons.tsx`
- Full width buttons dengan consistent styling
- Loading states dengan disabled styling
- Icon + text combinations
- Form integration dengan server actions

### Form Components
- Consistent input styling dengan focus states
- Error message styling: `bg-red-50 text-red-600 p-3 rounded-md text-sm`
- Required field indicators: `text-red-500`
- Help text: `text-xs text-gray-500 mt-1`

---

## Best Practices

### 1. Consistency
- Gunakan color palette yang sudah ditentukan
- Consistent spacing menggunakan Tailwind spacing scale
- Uniform border radius (rounded-md, rounded-lg)

### 2. Performance
- Lazy load images jika ada
- Optimize SVG icons
- Minimize CSS bundle size

### 3. User Experience
- Clear feedback untuk user actions
- Loading states untuk async operations
- Error handling dengan user-friendly messages
- Confirmation dialogs untuk destructive actions

### 4. Maintenance
- Component-based architecture
- Reusable utility classes
- Documented color meanings dan usage
- Consistent naming conventions

---

## Implementation Notes

### Tailwind Configuration
Pastikan semua warna yang digunakan tersedia di Tailwind config atau menggunakan default Tailwind colors.

### Icon Usage
- Menggunakan Heroicons untuk consistency
- Size standard: `w-5 h-5` untuk buttons, `w-6 h-6` untuk larger icons
- Stroke width: `strokeWidth={2}` untuk consistency

### Form Validation
- Client-side validation untuk immediate feedback
- Server-side validation untuk security
- Clear error messages dengan styling yang consistent

Panduan ini memberikan foundation yang solid untuk implementasi UI/UX yang consistent dan professional untuk sistem booking bengkel motor.