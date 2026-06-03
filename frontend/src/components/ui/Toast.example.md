# Toast Component Usage

Toast notification component dengan rounded card design yang mengikuti design system FixIt.

## Features
- ✅ Auto-dismiss setelah 4 detik (customizable)
- ✅ Smooth slide-in animation dari kanan
- ✅ Gradient background dengan rounded corners
- ✅ 4 variants: success, error, warning, info
- ✅ Close button manual
- ✅ Responsive design

## Usage Example

```typescript
import { useState } from 'react';
import { Toast } from '@/components/ui';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  const handleAction = async () => {
    // Do something...
    const result = await someAction();
    
    if (result.success) {
      setShowToast(true);
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Do Action</button>
      
      {showToast && (
        <Toast
          message="Action completed successfully!"
          variant="success"
          onClose={() => setShowToast(false)}
          duration={4000} // optional, default 4000ms
        />
      )}
    </div>
  );
}
```

## Variants

### Success (Green)
```typescript
<Toast
  message="Booking berhasil dibatalkan!"
  variant="success"
  onClose={() => setShowToast(false)}
/>
```

### Error (Red)
```typescript
<Toast
  message="Gagal membatalkan booking!"
  variant="error"
  onClose={() => setShowToast(false)}
/>
```

### Warning (Orange)
```typescript
<Toast
  message="Perhatian: Booking akan expired dalam 1 jam!"
  variant="warning"
  onClose={() => setShowToast(false)}
/>
```

### Info (Blue)
```typescript
<Toast
  message="Mekanik sedang dalam perjalanan"
  variant="info"
  onClose={() => setShowToast(false)}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| message | string | Yes | - | Pesan yang ditampilkan |
| variant | 'success' \| 'error' \| 'warning' \| 'info' | Yes | - | Tipe toast |
| onClose | () => void | Yes | - | Callback saat toast ditutup |
| duration | number | No | 4000 | Durasi tampil (ms) |

## Design

Toast menggunakan design system FixIt:
- Gradient background (from-X-50 to-X-100)
- Border 2px dengan warna sesuai variant
- Rounded 2xl (16px)
- Shadow 2xl
- Font bold dengan size sm
- Fixed position: top-4 right-4
- z-index: 50

## Animation

CSS animation `slide-in-right` di `globals.css`:
- Duration: 0.3s
- Easing: ease-out
- Transform: translateX(100%) → translateX(0)
- Opacity: 0 → 1
