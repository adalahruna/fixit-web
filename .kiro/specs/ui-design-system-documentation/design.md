# Design Document: UI/UX Design System Documentation

## 1. Arsitektur Sistem

### 1.1 Struktur Dokumentasi

Dokumentasi design system akan diorganisir dalam struktur hierarkis:

```
UI/UX Design System
├── Foundation (Dasar)
│   ├── Color System
│   ├── Typography
│   ├── Spacing & Layout
│   ├── Shadows & Elevation
│   └── Border Radius
├── Components (Komponen)
│   ├── Buttons
│   ├── Forms & Inputs
│   ├── Cards
│   ├── Badges & Tags
│   ├── Navigation
│   ├── Tables
│   ├── Modals & Dialogs
│   └── Feedback Elements
├── Patterns (Pola)
│   ├── Dashboard Layouts
│   ├── Form Layouts
│   ├── List & Detail Views
│   └── Status Indicators
└── Guidelines (Panduan)
    ├── Accessibility (WCAG 2.1 AA)
    ├── Responsive Design
    ├── Bahasa & Terminologi
    └── Best Practices
```

### 1.2 Teknologi Stack


- **Framework CSS**: Tailwind CSS v3.x
- **Component Library**: React 18+ dengan TypeScript
- **Icon System**: Heroicons + Font Awesome 6
- **Font**: System fonts (Arial, Helvetica, sans-serif)
- **Build Tool**: Next.js 14+ (App Router)

### 1.3 Prinsip Desain

1. **Konsistensi**: Semua komponen mengikuti pola visual yang sama
2. **Aksesibilitas**: Memenuhi standar WCAG 2.1 Level AA
3. **Responsif**: Mobile-first approach dengan breakpoint yang jelas
4. **Bahasa Indonesia**: Semua teks UI menggunakan Bahasa Indonesia
5. **Clarity**: Hierarki visual yang jelas dengan kontras yang baik
6. **Performance**: Optimasi untuk loading cepat dan interaksi smooth

---

## 2. Foundation (Dasar)

### 2.1 Color System

#### 2.1.1 Primary Colors

**Blue (Primary Action)**
- Penggunaan: Primary buttons, links, active states
- Palette:
  - `blue-50`: #EFF6FF (Background hover)
  - `blue-100`: #DBEAFE (Background light)
  - `blue-500`: #3B82F6 (Default)
  - `blue-600`: #2563EB (Primary action)
  - `blue-700`: #1D4ED8 (Hover state)
  - `blue-800`: #1E40AF (Text on light bg)

**Green (Success/Complete)**
- Penggunaan: Success messages, complete status, positive actions
- Palette:
  - `green-50`: #F0FDF4
  - `green-100`: #DCFCE7
  - `green-600`: #16A34A
  - `green-700`: #15803D
  - `green-800`: #166534


**Red (Danger/Error)**
- Penggunaan: Error messages, delete actions, critical warnings
- Palette:
  - `red-50`: #FEF2F2
  - `red-100`: #FEE2E2
  - `red-600`: #DC2626
  - `red-700`: #B91C1C
  - `red-800`: #991B1B

**Orange (Warning/In Progress)**
- Penggunaan: Warning messages, in-progress status, reschedule actions
- Palette:
  - `orange-50`: #FFF7ED
  - `orange-100`: #FFEDD5
  - `orange-600`: #EA580C
  - `orange-700`: #C2410C
  - `orange-800`: #9A3412

**Purple (Analytics/Reports)**
- Penggunaan: Analytics, reports, owner dashboard
- Palette:
  - `purple-50`: #FAF5FF
  - `purple-100`: #F3E8FF
  - `purple-600`: #9333EA
  - `purple-700`: #7E22CE
  - `purple-800`: #6B21A8

**Indigo (Secondary Actions)**
- Penggunaan: Audit logs, secondary features
- Palette:
  - `indigo-50`: #EEF2FF
  - `indigo-100`: #E0E7FF
  - `indigo-600`: #4F46E5
  - `indigo-700`: #4338CA
  - `indigo-800`: #3730A3


#### 2.1.2 Neutral Colors

**Gray (Neutral/Text)**
- Penggunaan: Text, borders, backgrounds, disabled states
- Palette:
  - `gray-50`: #F9FAFB (Page background)
  - `gray-100`: #F3F4F6 (Input background)
  - `gray-200`: #E5E7EB (Borders)
  - `gray-300`: #D1D5DB (Disabled background)
  - `gray-400`: #9CA3AF (Muted text - avoid for important text)
  - `gray-500`: #6B7280 (Secondary text)
  - `gray-600`: #4B5563 (Labels, tertiary text)
  - `gray-700`: #374151 (Secondary headings)
  - `gray-800`: #1F2937 (Body text)
  - `gray-900`: #111827 (Primary headings)

**White & Black**
- `white`: #FFFFFF (Card backgrounds, button text)
- `black`: #000000 (Rarely used, prefer gray-900)

#### 2.1.3 Status Colors

| Status | Background | Text | Border | Penggunaan |
|--------|-----------|------|--------|------------|
| Pending | `yellow-100` | `yellow-800` | `yellow-200` | Booking menunggu konfirmasi |
| Confirmed | `blue-100` | `blue-800` | `blue-200` | Booking dikonfirmasi |
| In Progress | `green-100` | `green-800` | `green-200` | Servis sedang dikerjakan |
| Done | `gray-100` | `gray-800` | `gray-200` | Servis selesai |
| Cancelled | `red-100` | `red-800` | `red-200` | Booking dibatalkan |


#### 2.1.4 Contrast Requirements (WCAG 2.1 AA)

**Text Contrast Ratios:**
- Normal text (< 18pt): Minimum 4.5:1
- Large text (≥ 18pt or 14pt bold): Minimum 3:1
- UI components & graphics: Minimum 3:1

**Approved Combinations:**

✅ **Dark text on light backgrounds:**
- `text-gray-900` on `bg-white` (Ratio: 18.5:1)
- `text-gray-800` on `bg-white` (Ratio: 14.2:1)
- `text-gray-700` on `bg-white` (Ratio: 10.7:1)
- `text-gray-600` on `bg-white` (Ratio: 7.2:1)

✅ **Light text on dark backgrounds:**
- `text-white` on `bg-blue-600` (Ratio: 5.8:1)
- `text-white` on `bg-green-600` (Ratio: 4.6:1)
- `text-white` on `bg-red-600` (Ratio: 5.9:1)
- `text-blue-50` on `bg-blue-600` (Ratio: 5.2:1)

❌ **Avoid these combinations:**
- `text-gray-400` on `bg-white` (Ratio: 2.8:1 - too low)
- `text-blue-100` on `bg-blue-600` (Ratio: 1.2:1 - too low)
- `text-gray-400` on `bg-gray-200` (Ratio: 1.9:1 - too low)

### 2.2 Typography

#### 2.2.1 Font Family

```css
font-family: Arial, Helvetica, sans-serif;
```

**Alasan pemilihan:**
- System font yang tersedia di semua platform
- Excellent readability untuk Bahasa Indonesia
- Fast loading (no web font download)
- Professional appearance


#### 2.2.2 Type Scale

| Level | Size | Weight | Line Height | Tailwind Class | Penggunaan |
|-------|------|--------|-------------|----------------|------------|
| H1 | 30px | 700 (Bold) | 1.2 | `text-3xl font-bold` | Page titles |
| H2 | 24px | 600 (Semibold) | 1.3 | `text-2xl font-semibold` | Section titles |
| H3 | 20px | 600 (Semibold) | 1.4 | `text-xl font-semibold` | Subsection titles |
| H4 | 18px | 600 (Semibold) | 1.4 | `text-lg font-semibold` | Card titles |
| Body Large | 16px | 400 (Regular) | 1.5 | `text-base` | Primary body text |
| Body | 14px | 400 (Regular) | 1.5 | `text-sm` | Default body text |
| Small | 12px | 400 (Regular) | 1.5 | `text-xs` | Helper text, captions |
| Tiny | 10px | 400 (Regular) | 1.4 | `text-[10px]` | Badges, timestamps |

#### 2.2.3 Font Weights

- **Regular (400)**: Body text, descriptions
- **Medium (500)**: Labels, form fields
- **Semibold (600)**: Subheadings, card titles
- **Bold (700)**: Page titles, emphasis
- **Extrabold (800)**: Special emphasis (jarang digunakan)

#### 2.2.4 Text Colors

| Purpose | Color Class | Hex | Contrast Ratio |
|---------|------------|-----|----------------|
| Primary heading | `text-gray-900` | #111827 | 18.5:1 |
| Secondary heading | `text-gray-800` | #1F2937 | 14.2:1 |
| Body text | `text-gray-700` | #374151 | 10.7:1 |
| Labels | `text-gray-600` | #4B5563 | 7.2:1 |
| Muted text | `text-gray-500` | #6B7280 | 5.1:1 |
| Disabled text | `text-gray-400` | #9CA3AF | 2.8:1 ⚠️ |

⚠️ **Warning**: `text-gray-400` tidak memenuhi WCAG AA untuk normal text. Gunakan hanya untuk disabled states atau large text.


### 2.3 Spacing & Layout

#### 2.3.1 Spacing Scale (Tailwind)

| Token | Size | Penggunaan |
|-------|------|------------|
| `0` | 0px | Reset spacing |
| `1` | 4px | Tight spacing |
| `2` | 8px | Icon-text gap |
| `3` | 12px | Small padding |
| `4` | 16px | Default padding |
| `5` | 20px | Medium padding |
| `6` | 24px | Card padding |
| `8` | 32px | Section spacing |
| `12` | 48px | Page padding |
| `16` | 64px | Large section spacing |

#### 2.3.2 Container Widths

```css
/* Main container */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Form container */
max-w-md w-full (384px)

/* Content container */
max-w-4xl mx-auto (896px)
```

#### 2.3.3 Grid System

**Responsive Grid:**
```css
/* Mobile-first approach */
grid grid-cols-1           /* Mobile: 1 column */
md:grid-cols-2             /* Tablet: 2 columns */
lg:grid-cols-3             /* Desktop: 3 columns */
xl:grid-cols-4             /* Large desktop: 4 columns */
```

**Gap Spacing:**
- Small gap: `gap-4` (16px)
- Medium gap: `gap-6` (24px)
- Large gap: `gap-8` (32px)


### 2.4 Shadows & Elevation

#### 2.4.1 Shadow Scale

| Level | Tailwind Class | Penggunaan |
|-------|---------------|------------|
| None | `shadow-none` | Flat elements |
| Small | `shadow-sm` | Subtle elevation (navigation) |
| Default | `shadow` | Cards, containers |
| Medium | `shadow-md` | Hover states |
| Large | `shadow-lg` | Modals, dropdowns |
| Extra Large | `shadow-xl` | Overlays |

#### 2.4.2 Elevation Hierarchy

1. **Level 0** (No shadow): Inline elements, text
2. **Level 1** (`shadow-sm`): Navigation bar, subtle cards
3. **Level 2** (`shadow`): Default cards, panels
4. **Level 3** (`shadow-md`): Hover states, active cards
5. **Level 4** (`shadow-lg`): Modals, popovers
6. **Level 5** (`shadow-xl`): Full-screen overlays

### 2.5 Border Radius

| Size | Tailwind Class | Pixels | Penggunaan |
|------|---------------|--------|------------|
| None | `rounded-none` | 0px | Tables, strict layouts |
| Small | `rounded` | 4px | Badges, small buttons |
| Medium | `rounded-md` | 6px | Buttons, inputs |
| Large | `rounded-lg` | 8px | Cards, containers |
| Extra Large | `rounded-xl` | 12px | Modern cards, modals |
| 2XL | `rounded-2xl` | 16px | Hero sections, feature cards |
| Full | `rounded-full` | 9999px | Avatars, icon buttons, pills |

**Standar aplikasi**: `rounded-lg` (8px) untuk cards, `rounded-md` (6px) untuk buttons/inputs


---

## 3. Components (Komponen)

### 3.1 Buttons

#### 3.1.1 Primary Button

**Penggunaan**: Main actions, form submissions, primary CTAs

```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 
                   transition-colors duration-200 focus:outline-none focus:ring-2 
                   focus:ring-blue-500 focus:ring-offset-2">
  Konfirmasi
</button>
```

**Variants:**
- Small: `px-3 py-1.5 text-sm`
- Medium (default): `px-4 py-2 text-sm`
- Large: `px-6 py-3 text-base`
- Full width: `w-full`

**States:**
- Default: `bg-blue-600 text-white`
- Hover: `hover:bg-blue-700`
- Focus: `focus:ring-2 focus:ring-blue-500`
- Disabled: `disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed`
- Loading: `disabled:bg-blue-400 disabled:cursor-wait`

#### 3.1.2 Secondary Button

**Penggunaan**: Cancel actions, back navigation, alternative actions

```tsx
<button className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-md 
                   hover:bg-gray-50 transition-colors duration-200">
  Batal
</button>
```


#### 3.1.3 Success Button

**Penggunaan**: Complete actions, confirm success, positive actions

```tsx
<button className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 
                   transition-colors duration-200">
  Selesaikan Servis
</button>
```

#### 3.1.4 Danger Button

**Penggunaan**: Delete actions, cancel bookings, destructive operations

```tsx
<button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 
                   transition-colors duration-200">
  Batalkan Booking
</button>
```

#### 3.1.5 Warning Button

**Penggunaan**: Reschedule, edit actions, caution operations

```tsx
<button className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 
                   transition-colors duration-200">
  Reschedule
</button>
```

#### 3.1.6 Ghost Button

**Penggunaan**: Tertiary actions, inline actions

```tsx
<button className="text-blue-600 hover:text-blue-700 hover:underline 
                   transition-colors duration-200">
  Lihat Detail
</button>
```


#### 3.1.7 Icon Button

**Penggunaan**: Actions with icons, compact interfaces

```tsx
<button className="p-2 rounded-md hover:bg-gray-100 transition-colors">
  <svg className="w-5 h-5 text-gray-600" />
</button>
```

#### 3.1.8 Button Accessibility

**Requirements:**
- Minimum touch target: 44px × 44px (mobile)
- Clear focus indicator: `focus:ring-2`
- Descriptive text (no "Click here")
- Disabled state clearly visible
- Loading state with visual feedback

### 3.2 Forms & Inputs

#### 3.2.1 Text Input

**Default State:**
```tsx
<input 
  type="text"
  className="w-full px-3 py-2 border border-gray-300 rounded-md 
             focus:outline-none focus:ring-2 focus:ring-blue-500 
             focus:border-transparent"
  placeholder="Masukkan teks"
/>
```

**States:**
- Default: `border-gray-300`
- Focus: `focus:ring-2 focus:ring-blue-500`
- Error: `border-red-500 focus:ring-red-500`
- Disabled: `bg-gray-100 text-gray-500 cursor-not-allowed`
- Success: `border-green-500 focus:ring-green-500`


#### 3.2.2 Label

```tsx
<label className="block text-sm font-medium text-gray-700 mb-1">
  Nama Lengkap
  <span className="text-red-500">*</span>
</label>
```

**Guidelines:**
- Always pair with input using `htmlFor` and `id`
- Required fields marked with red asterisk
- Use `text-gray-700` for good contrast
- Font weight: `font-medium` (500)

#### 3.2.3 Helper Text

```tsx
<p className="text-xs text-gray-500 mt-1">
  Masukkan nama sesuai KTP
</p>
```

#### 3.2.4 Error Message

```tsx
<p className="text-xs text-red-600 mt-1">
  Nama wajib diisi
</p>
```

**Alternative (with background):**
```tsx
<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
  Terjadi kesalahan saat menyimpan data
</div>
```

#### 3.2.5 Select Dropdown

```tsx
<select className="w-full px-3 py-2 border border-gray-300 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option value="">Pilih opsi</option>
  <option value="1">Opsi 1</option>
</select>
```


#### 3.2.6 Textarea

```tsx
<textarea 
  rows={4}
  className="w-full px-3 py-2 border border-gray-300 rounded-md 
             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
  placeholder="Masukkan deskripsi"
/>
```

#### 3.2.7 Checkbox

```tsx
<label className="flex items-start space-x-3 p-3 border border-gray-200 
                  rounded-md hover:bg-gray-50 cursor-pointer">
  <input type="checkbox" className="mt-1" />
  <div>
    <div className="font-medium text-gray-900">Ganti Oli</div>
    <div className="text-sm text-gray-600">Rp 50.000</div>
  </div>
</label>
```

#### 3.2.8 Radio Button

```tsx
<label className="flex items-center space-x-3 p-3 border border-gray-200 
                  rounded-md hover:bg-gray-50 cursor-pointer">
  <input type="radio" name="option" />
  <span className="text-gray-900">Opsi 1</span>
</label>
```

### 3.3 Cards

#### 3.3.1 Basic Card

```tsx
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```


#### 3.3.2 KPI Card

```tsx
<div className="bg-white p-6 rounded-lg shadow">
  <div className="flex items-center">
    <div className="flex-1">
      <p className="text-sm font-medium text-gray-600">Total Booking</p>
      <p className="text-2xl font-bold text-gray-900">150</p>
      <p className="text-sm text-gray-500 mt-1">Bulan ini</p>
    </div>
    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
      <svg className="w-6 h-6" />
    </div>
  </div>
</div>
```

**Color Variants:**
- Blue: `bg-blue-100 text-blue-600`
- Green: `bg-green-100 text-green-600`
- Purple: `bg-purple-100 text-purple-600`
- Orange: `bg-orange-100 text-orange-600`
- Red: `bg-red-100 text-red-600`

#### 3.3.3 Navigation Card

```tsx
<Link href="/path" 
      className="block p-4 rounded-lg border bg-blue-50 hover:bg-blue-100 
                 transition-colors duration-200">
  <div className="flex items-start">
    <div className="p-2 rounded-lg bg-blue-100 text-blue-600 mr-3">
      <svg className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="font-medium text-gray-900">Kelola Booking</h4>
      <p className="text-sm text-gray-600 mt-1">Lihat semua booking</p>
    </div>
    <svg className="w-4 h-4 text-gray-400" />
  </div>
</Link>
```


### 3.4 Badges & Tags

#### 3.4.1 Status Badge

```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full 
                 bg-blue-100 text-blue-800">
  Confirmed
</span>
```

**Status Variants:**

| Status | Classes |
|--------|---------|
| Pending | `bg-yellow-100 text-yellow-800` |
| Confirmed | `bg-blue-100 text-blue-800` |
| In Progress | `bg-green-100 text-green-800` |
| Done | `bg-gray-100 text-gray-800` |
| Cancelled | `bg-red-100 text-red-800` |

#### 3.4.2 Count Badge

```tsx
<span className="ml-2 px-2 py-1 text-xs font-medium rounded-full 
                 bg-white text-blue-600">
  5
</span>
```

#### 3.4.3 Notification Badge

```tsx
<div className="relative">
  <svg className="w-6 h-6" />
  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white 
                   text-xs rounded-full flex items-center justify-center">
    3
  </span>
</div>
```


### 3.5 Navigation

#### 3.5.1 Top Navigation Bar

```tsx
<nav className="bg-white shadow-sm border-b">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      <div className="flex items-center">
        <h1 className="text-xl font-bold text-blue-600">Fixit</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Link href="/login" className="text-blue-600 hover:text-blue-700">
          Login
        </Link>
        <Link href="/register" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md 
                         hover:bg-blue-700">
          Register
        </Link>
      </div>
    </div>
  </div>
</nav>
```

#### 3.5.2 Breadcrumb

```tsx
<nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
  <Link href="/" className="hover:text-blue-600">Home</Link>
  <span>/</span>
  <Link href="/bookings" className="hover:text-blue-600">Booking</Link>
  <span>/</span>
  <span className="text-gray-900">Detail</span>
</nav>
```

#### 3.5.3 Back Link

```tsx
<Link href="/back" 
      className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
  <svg className="w-4 h-4 mr-2" />
  Kembali
</Link>
```


### 3.6 Tables

#### 3.6.1 Basic Table

```tsx
<div className="bg-white rounded-lg shadow overflow-hidden">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 
                       uppercase tracking-wider">
          Nama
        </th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 
                       uppercase tracking-wider">
          Status
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          John Doe
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="px-2 py-1 text-xs font-medium rounded-full 
                           bg-green-100 text-green-800">
            Active
          </span>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Guidelines:**
- Header: `bg-gray-50` with `text-gray-600` uppercase text
- Row hover: `hover:bg-gray-50`
- Cell padding: `px-6 py-4`
- Dividers: `divide-y divide-gray-200`


### 3.7 Modals & Dialogs

#### 3.7.1 Confirmation Modal

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center 
                justify-center z-50">
  <div className="bg-white rounded-lg max-w-md w-full p-6">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">
      Konfirmasi Pembatalan
    </h3>
    <p className="text-gray-600 mb-6">
      Apakah Anda yakin ingin membatalkan booking ini?
    </p>
    <div className="flex gap-3">
      <button className="flex-1 border-2 border-gray-300 text-gray-700 
                         px-4 py-2 rounded-md hover:bg-gray-50">
        Batal
      </button>
      <button className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md 
                         hover:bg-red-700">
        Ya, Batalkan
      </button>
    </div>
  </div>
</div>
```

**Guidelines:**
- Overlay: `bg-black bg-opacity-50`
- Modal: `max-w-md` (448px) for small, `max-w-2xl` (672px) for large
- Z-index: `z-50` for overlay
- Padding: `p-6` for content
- Button layout: `flex gap-3` for horizontal buttons


### 3.8 Feedback Elements

#### 3.8.1 Alert - Success

```tsx
<div className="bg-green-50 border border-green-200 text-green-700 
                px-4 py-3 rounded-md text-sm">
  ✅ Data berhasil disimpan
</div>
```

#### 3.8.2 Alert - Error

```tsx
<div className="bg-red-50 border border-red-200 text-red-700 
                px-4 py-3 rounded-md text-sm">
  ❌ Terjadi kesalahan saat menyimpan data
</div>
```

#### 3.8.3 Alert - Warning

```tsx
<div className="bg-orange-50 border border-orange-200 text-orange-700 
                px-4 py-3 rounded-md text-sm">
  ⚠️ Perhatian: Slot hampir penuh
</div>
```

#### 3.8.4 Alert - Info

```tsx
<div className="bg-blue-50 border border-blue-200 text-blue-700 
                px-4 py-3 rounded-md text-sm">
  ℹ️ Memeriksa ketersediaan slot...
</div>
```

#### 3.8.5 Loading Spinner

```tsx
<div className="flex items-center justify-center">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
</div>
```


#### 3.8.6 Empty State

```tsx
<div className="text-center py-12">
  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" />
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    Belum Ada Data
  </h3>
  <p className="text-gray-600 mb-6">
    Anda belum memiliki booking. Buat booking pertama Anda sekarang.
  </p>
  <Link href="/bookings/new" 
        className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md 
                   hover:bg-blue-700">
    Buat Booking Baru
  </Link>
</div>
```

---

## 4. Patterns (Pola)

### 4.1 Dashboard Layouts

#### 4.1.1 Dashboard Header

```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-900 mb-2">
    Selamat Datang, {userName}
  </h1>
  <p className="text-gray-600">
    Kelola booking dan servis motor Anda dengan mudah
  </p>
</div>
```

#### 4.1.2 Stats Grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  {/* KPI Cards */}
</div>
```


#### 4.1.3 Quick Navigation Section

```tsx
<div className="bg-white p-6 rounded-lg shadow">
  <h3 className="text-lg font-semibold mb-4">Quick Navigation</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* Navigation Cards */}
  </div>
</div>
```

### 4.2 Form Layouts

#### 4.2.1 Single Column Form

```tsx
<form className="max-w-md mx-auto space-y-6">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Email
    </label>
    <input type="email" className="w-full px-3 py-2 border border-gray-300 
                                    rounded-md focus:ring-2 focus:ring-blue-500" />
  </div>
  {/* More fields */}
  <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 
                                   rounded-md hover:bg-blue-700">
    Submit
  </button>
</form>
```

#### 4.2.2 Two Column Form

```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label>First Name</label>
      <input type="text" />
    </div>
    <div>
      <label>Last Name</label>
      <input type="text" />
    </div>
  </div>
  {/* More sections */}
</form>
```


### 4.3 List & Detail Views

#### 4.3.1 List View with Filters

```tsx
<div className="space-y-6">
  {/* Filter Bar */}
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input type="text" placeholder="Cari..." />
      <select>
        <option>Semua Status</option>
      </select>
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
        Filter
      </button>
    </div>
  </div>

  {/* List Items */}
  <div className="space-y-4">
    {/* Item cards */}
  </div>
</div>
```

#### 4.3.2 Detail View Layout

```tsx
<div className="space-y-6">
  {/* Header with status */}
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex justify-between items-start mb-4">
      <h2 className="text-2xl font-bold text-gray-900">Booking #12345</h2>
      <span className="px-3 py-1 text-sm font-medium rounded-full 
                       bg-blue-100 text-blue-800">
        Confirmed
      </span>
    </div>
  </div>

  {/* Information sections */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Info cards */}
  </div>

  {/* Actions */}
  <div className="flex gap-4">
    {/* Action buttons */}
  </div>
</div>
```


### 4.4 Status Indicators

#### 4.4.1 Booking Status Flow

```
Pending → Confirmed → In Progress → Done
                ↓
            Cancelled
```

**Visual Representation:**
```tsx
<div className="flex items-center space-x-2">
  <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-800 
                  flex items-center justify-center text-xs font-bold">
    1
  </div>
  <div className="flex-1 h-1 bg-gray-200"></div>
  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 
                  flex items-center justify-center text-xs font-bold">
    2
  </div>
  <div className="flex-1 h-1 bg-gray-200"></div>
  <div className="w-8 h-8 rounded-full bg-green-100 text-green-800 
                  flex items-center justify-center text-xs font-bold">
    3
  </div>
  <div className="flex-1 h-1 bg-gray-200"></div>
  <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-800 
                  flex items-center justify-center text-xs font-bold">
    4
  </div>
</div>
```

---

## 5. Guidelines (Panduan)

### 5.1 Accessibility (WCAG 2.1 AA)

#### 5.1.1 Color Contrast

**Requirements:**
- Normal text (< 18pt): Minimum 4.5:1 contrast ratio
- Large text (≥ 18pt or 14pt bold): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio


**Approved Text Combinations:**

✅ High Contrast (Recommended):
- `text-gray-900` on `bg-white` (18.5:1)
- `text-gray-800` on `bg-white` (14.2:1)
- `text-white` on `bg-blue-600` (5.8:1)
- `text-white` on `bg-green-600` (4.6:1)

⚠️ Minimum Acceptable:
- `text-gray-600` on `bg-white` (7.2:1)
- `text-gray-500` on `bg-white` (5.1:1)

❌ Avoid:
- `text-gray-400` on `bg-white` (2.8:1 - fails WCAG AA)
- `text-blue-100` on `bg-blue-600` (1.2:1 - fails)
- Light colors on light backgrounds

#### 5.1.2 Keyboard Navigation

**Requirements:**
- All interactive elements must be keyboard accessible
- Clear focus indicators: `focus:ring-2 focus:ring-blue-500`
- Logical tab order
- Skip links for main content

**Focus Styles:**
```css
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

#### 5.1.3 Touch Targets

**Requirements:**
- Minimum size: 44px × 44px (mobile)
- Adequate spacing between targets: 8px minimum
- Larger targets for primary actions


#### 5.1.4 Semantic HTML

**Use proper HTML elements:**
- `<button>` for actions
- `<a>` for navigation
- `<label>` for form labels
- `<nav>` for navigation sections
- `<main>` for main content
- `<header>`, `<footer>` for page structure

#### 5.1.5 ARIA Labels

**When to use:**
- Icon-only buttons: `aria-label="Close"`
- Complex interactions: `aria-expanded`, `aria-controls`
- Live regions: `aria-live="polite"`
- Form validation: `aria-invalid`, `aria-describedby`

**Example:**
```tsx
<button aria-label="Tutup modal" className="...">
  <svg className="w-5 h-5" />
</button>
```

#### 5.1.6 Screen Reader Support

**Guidelines:**
- Provide alternative text for images
- Use descriptive link text (not "click here")
- Announce dynamic content changes
- Provide skip navigation links

### 5.2 Responsive Design

#### 5.2.1 Breakpoints

| Breakpoint | Min Width | Tailwind Prefix | Target Device |
|------------|-----------|-----------------|---------------|
| Mobile | 0px | (default) | Phones |
| Tablet | 768px | `md:` | Tablets |
| Desktop | 1024px | `lg:` | Laptops |
| Large Desktop | 1280px | `xl:` | Desktops |
| Extra Large | 1536px | `2xl:` | Large screens |


#### 5.2.2 Mobile-First Approach

**Strategy:**
1. Design for mobile first (320px - 767px)
2. Add tablet styles with `md:` prefix (768px+)
3. Add desktop styles with `lg:` prefix (1024px+)

**Example:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

#### 5.2.3 Responsive Typography

```tsx
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>
```

#### 5.2.4 Responsive Spacing

```tsx
<div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
  {/* Smaller padding on mobile, larger on desktop */}
</div>
```

#### 5.2.5 Hidden Elements

```tsx
{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">Desktop only</div>

{/* Show on mobile, hide on desktop */}
<div className="block lg:hidden">Mobile only</div>
```

### 5.3 Bahasa & Terminologi

#### 5.3.1 Konsistensi Bahasa

**Aturan:**
- Semua UI text menggunakan Bahasa Indonesia
- Gunakan istilah yang familiar untuk pengguna Indonesia
- Hindari mixing Bahasa Indonesia dan Inggris dalam satu kalimat


#### 5.3.2 Terminologi Standar

| English | Bahasa Indonesia | Konteks |
|---------|------------------|---------|
| Login | Masuk | Authentication |
| Logout | Keluar | Authentication |
| Register | Daftar | Authentication |
| Submit | Kirim / Simpan | Forms |
| Cancel | Batal | Actions |
| Delete | Hapus | Actions |
| Edit | Edit / Ubah | Actions |
| Save | Simpan | Actions |
| Back | Kembali | Navigation |
| Next | Lanjut | Navigation |
| Previous | Sebelumnya | Navigation |
| Search | Cari | Search |
| Filter | Filter | Search |
| Booking | Booking | Business term |
| Service | Servis | Business term |
| Mechanic | Mekanik | Business term |
| Customer | Pelanggan | Business term |
| Dashboard | Dashboard | Navigation |
| Profile | Profil | User |
| Settings | Pengaturan | User |
| Notification | Notifikasi | System |
| Success | Berhasil | Feedback |
| Error | Gagal / Error | Feedback |
| Warning | Peringatan | Feedback |
| Loading | Memuat | Status |
| Please wait | Mohon tunggu | Status |


#### 5.3.3 Tone of Voice

**Karakteristik:**
- **Profesional**: Formal tapi tidak kaku
- **Ramah**: Hangat dan membantu
- **Jelas**: Langsung ke poin, tidak bertele-tele
- **Sopan**: Menggunakan kata-kata yang sopan

**Contoh:**

✅ Good:
- "Booking Anda berhasil dibuat"
- "Mohon lengkapi data berikut"
- "Apakah Anda yakin ingin membatalkan booking ini?"

❌ Avoid:
- "Booking lu udah jadi ya bro" (terlalu informal)
- "Data yang Anda masukkan tidak valid karena tidak sesuai dengan format yang telah ditentukan oleh sistem" (terlalu panjang)
- "Error 500: Internal Server Error" (terlalu teknis untuk user)

#### 5.3.4 Error Messages

**Format:**
1. Jelaskan apa yang salah
2. Berikan solusi atau langkah selanjutnya
3. Gunakan bahasa yang ramah

**Contoh:**

✅ Good:
- "Email wajib diisi. Silakan masukkan alamat email Anda."
- "Slot waktu tidak tersedia. Pilih waktu lain atau hubungi admin."
- "Koneksi terputus. Periksa koneksi internet Anda dan coba lagi."

❌ Avoid:
- "Invalid input" (tidak jelas)
- "Error" (tidak informatif)
- "Anda salah memasukkan data" (menyalahkan user)


### 5.4 Best Practices

#### 5.4.1 Performance

**Optimization:**
- Use Tailwind's JIT mode for smaller CSS bundles
- Lazy load images with `loading="lazy"`
- Optimize SVG icons (remove unnecessary attributes)
- Use Next.js Image component for automatic optimization
- Minimize use of custom CSS

**Example:**
```tsx
import Image from 'next/image';

<Image 
  src="/image.jpg" 
  alt="Description"
  width={500}
  height={300}
  loading="lazy"
/>
```

#### 5.4.2 Consistency

**Checklist:**
- ✅ Use design system colors (no custom colors)
- ✅ Follow spacing scale (no arbitrary values)
- ✅ Use standard border radius
- ✅ Apply consistent shadows
- ✅ Follow typography scale
- ✅ Use standard button styles
- ✅ Maintain consistent icon sizes

#### 5.4.3 Component Reusability

**Guidelines:**
- Create reusable components for repeated patterns
- Use TypeScript interfaces for props
- Document component usage with comments
- Keep components focused (single responsibility)

**Example:**
```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, size = 'md', children, onClick }: ButtonProps) {
  // Implementation
}
```


#### 5.4.4 User Feedback

**Always provide feedback for:**
- Form submissions (success/error)
- Loading states (spinners, disabled buttons)
- Async operations (API calls)
- Destructive actions (confirmation dialogs)
- Validation errors (inline messages)

**Example:**
```tsx
{isLoading ? (
  <button disabled className="bg-gray-400 cursor-wait">
    Memproses...
  </button>
) : (
  <button className="bg-blue-600 hover:bg-blue-700">
    Simpan
  </button>
)}
```

#### 5.4.5 Error Handling

**Levels:**
1. **Field-level**: Inline validation messages
2. **Form-level**: Summary of errors at top
3. **Page-level**: Alert banners
4. **Global**: Toast notifications

**Example:**
```tsx
{/* Field-level */}
<input className={errors.email ? 'border-red-500' : 'border-gray-300'} />
{errors.email && (
  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
)}

{/* Form-level */}
{formError && (
  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
    {formError}
  </div>
)}
```


#### 5.4.6 Animation & Transitions

**Guidelines:**
- Use subtle transitions for better UX
- Standard duration: 200ms
- Use `transition-colors` for color changes
- Use `transition-all` sparingly (performance)

**Approved Transitions:**
```css
/* Button hover */
transition-colors duration-200

/* Card hover */
transition-shadow duration-200

/* Modal entrance */
transition-opacity duration-300

/* Slide in */
transition-transform duration-300
```

**Example:**
```tsx
<button className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200">
  Click me
</button>
```

#### 5.4.7 Icon Usage

**Guidelines:**
- Use Heroicons for UI icons (consistent style)
- Use Font Awesome for business/domain icons
- Standard size: `w-5 h-5` (20px) for buttons
- Large size: `w-6 h-6` (24px) for emphasis
- Stroke width: `strokeWidth={2}` for Heroicons

**Example:**
```tsx
{/* Heroicons */}
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
        d="M5 13l4 4L19 7" />
</svg>

{/* Font Awesome */}
<i className="fa-solid fa-motorcycle text-blue-600"></i>
```


---

## 6. Implementation Details

### 6.1 File Structure

```
frontend/src/
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   └── Modal.tsx
│   ├── dashboard/             # Dashboard-specific components
│   │   ├── QuickNavigation.tsx
│   │   ├── KPICard.tsx
│   │   └── ChartCard.tsx
│   ├── bookings/              # Booking-specific components
│   │   ├── BookingForm.tsx
│   │   ├── BookingList.tsx
│   │   └── BookingFilters.tsx
│   └── common/                # Shared components
│       ├── Navigation.tsx
│       ├── Footer.tsx
│       └── ErrorBoundary.tsx
├── app/
│   ├── globals.css            # Global styles
│   └── [routes]/              # Page routes
└── lib/
    └── utils/                 # Utility functions
```

### 6.2 Tailwind Configuration

**tailwind.config.js:**
```javascript
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors if needed
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```


### 6.3 Component Examples

#### 6.3.1 Reusable Button Component

```tsx
// components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  
  const disabledStyles = 'disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed';
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Memproses...' : children}
    </button>
  );
}
```


#### 6.3.2 Reusable Input Component

```tsx
// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 
                     ${error 
                       ? 'border-red-500 focus:ring-red-500' 
                       : 'border-gray-300 focus:ring-blue-500'
                     } ${className}`}
          {...props}
        />
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs text-gray-500 mt-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```


#### 6.3.3 Reusable Badge Component

```tsx
// components/ui/Badge.tsx
interface BadgeProps {
  children: React.ReactNode;
  variant: 'pending' | 'confirmed' | 'in_progress' | 'done' | 'cancelled';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant, size = 'md' }: BadgeProps) {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    done: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };
  
  return (
    <span className={`font-medium rounded-full ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
```

### 6.4 Testing Considerations

**Accessibility Testing:**
- Use axe-core for automated accessibility testing
- Test with keyboard navigation
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify color contrast ratios

**Visual Testing:**
- Test on different screen sizes (mobile, tablet, desktop)
- Test on different browsers (Chrome, Firefox, Safari, Edge)
- Verify responsive breakpoints
- Check dark mode compatibility (if applicable)

**User Testing:**
- Conduct usability testing with real users
- Gather feedback on terminology and language
- Test with users of different technical abilities
- Verify that error messages are clear and helpful


---

## 7. Maintenance & Updates

### 7.1 Version Control

**Documentation Versioning:**
- Major version: Breaking changes to design system
- Minor version: New components or patterns
- Patch version: Bug fixes or clarifications

**Current Version:** 1.0.0

### 7.2 Change Log

**Version 1.0.0 (Initial Release)**
- Complete color system with WCAG AA compliance
- Typography scale and guidelines
- Comprehensive component library
- Accessibility guidelines
- Responsive design patterns
- Bahasa Indonesia terminology standards

### 7.3 Contributing Guidelines

**When adding new components:**
1. Follow existing patterns and conventions
2. Ensure WCAG AA compliance
3. Test on multiple screen sizes
4. Document usage with examples
5. Use Bahasa Indonesia for all text
6. Add TypeScript interfaces

**When updating existing components:**
1. Maintain backward compatibility when possible
2. Document breaking changes
3. Update all affected pages
4. Test thoroughly before deployment

### 7.4 Support & Resources

**Internal Resources:**
- Design system documentation (this file)
- Component library in `/components/ui`
- Tailwind configuration
- Existing page implementations

**External Resources:**
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Heroicons](https://heroicons.com/)
- [Font Awesome](https://fontawesome.com/)


---

## 8. Quick Reference

### 8.1 Common Patterns Cheat Sheet

**Page Layout:**
```tsx
<div className="min-h-screen bg-gray-50">
  <nav className="bg-white shadow-sm border-b">
    {/* Navigation */}
  </nav>
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Content */}
  </main>
</div>
```

**Card:**
```tsx
<div className="bg-white p-6 rounded-lg shadow">
  {/* Content */}
</div>
```

**Button:**
```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
  Text
</button>
```

**Input:**
```tsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-md 
                  focus:ring-2 focus:ring-blue-500" />
```

**Badge:**
```tsx
<span className="px-2 py-1 text-xs font-medium rounded-full 
                 bg-blue-100 text-blue-800">
  Status
</span>
```

**Alert:**
```tsx
<div className="bg-green-50 border border-green-200 text-green-700 
                px-4 py-3 rounded-md text-sm">
  Message
</div>
```


### 8.2 Color Quick Reference

| Purpose | Class | Use Case |
|---------|-------|----------|
| Primary action | `bg-blue-600 text-white` | Buttons, links |
| Success | `bg-green-600 text-white` | Complete, success |
| Danger | `bg-red-600 text-white` | Delete, cancel |
| Warning | `bg-orange-600 text-white` | Caution, reschedule |
| Page background | `bg-gray-50` | Body |
| Card background | `bg-white` | Cards, panels |
| Primary text | `text-gray-900` | Headings |
| Body text | `text-gray-700` | Paragraphs |
| Label text | `text-gray-600` | Labels |
| Muted text | `text-gray-500` | Helper text |

### 8.3 Spacing Quick Reference

| Size | Class | Pixels | Use Case |
|------|-------|--------|----------|
| Tiny | `gap-2` | 8px | Icon-text gap |
| Small | `gap-4` | 16px | Small spacing |
| Medium | `gap-6` | 24px | Default spacing |
| Large | `gap-8` | 32px | Section spacing |
| XL | `gap-12` | 48px | Page spacing |

### 8.4 Typography Quick Reference

| Element | Classes | Use Case |
|---------|---------|----------|
| Page title | `text-3xl font-bold text-gray-900` | H1 |
| Section title | `text-xl font-semibold text-gray-900` | H2 |
| Card title | `text-lg font-semibold text-gray-900` | H3 |
| Body text | `text-sm text-gray-700` | Paragraphs |
| Label | `text-sm font-medium text-gray-700` | Form labels |
| Helper text | `text-xs text-gray-500` | Hints |

---

## 9. Conclusion

Dokumentasi design system ini menyediakan panduan lengkap untuk membangun UI/UX yang konsisten, accessible, dan user-friendly untuk aplikasi Fixit Web. Dengan mengikuti panduan ini, tim development dapat:

1. **Memastikan konsistensi visual** di seluruh aplikasi
2. **Memenuhi standar accessibility** (WCAG 2.1 AA)
3. **Menggunakan Bahasa Indonesia** yang konsisten dan profesional
4. **Membangun komponen** yang reusable dan maintainable
5. **Memberikan user experience** yang optimal di semua device

**Prinsip Utama:**
- Konsistensi adalah kunci
- Accessibility bukan optional
- User feedback selalu penting
- Performance matters
- Bahasa Indonesia yang jelas dan profesional

Untuk pertanyaan atau saran perbaikan dokumentasi ini, silakan hubungi tim development.

---

**Document Version:** 1.0.0  
**Last Updated:** 2024  
**Maintained by:** Fixit Development Team
