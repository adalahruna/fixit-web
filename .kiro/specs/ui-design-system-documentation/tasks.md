# Tasks: UI/UX Design System Documentation

## Phase 1: Foundation Setup

### 1.1 Setup Tailwind Configuration
- [ ] Review dan update `tailwind.config.js` untuk ensure proper content paths
- [ ] Verify JIT mode enabled
- [ ] Configure font family (Arial, Helvetica, sans-serif)
- [ ] Test purge configuration untuk production builds
- [ ] Document Tailwind configuration

**Estimated Time:** 2 hours  
**Priority:** P0  
**Dependencies:** None

### 1.2 Create Base UI Components Directory Structure
- [ ] Create `frontend/src/components/ui/` directory
- [ ] Create subdirectories: `buttons/`, `forms/`, `cards/`, `badges/`, `modals/`, `feedback/`, `navigation/`, `tables/`
- [ ] Create `index.ts` files untuk exports
- [ ] Setup TypeScript interfaces directory

**Estimated Time:** 1 hour  
**Priority:** P0  
**Dependencies:** None

### 1.3 Create Design Tokens File
- [ ] Create `frontend/src/lib/design-tokens.ts`
- [ ] Define color constants dengan WCAG compliance notes
- [ ] Define spacing scale constants
- [ ] Define typography scale constants
- [ ] Define shadow scale constants
- [ ] Define border radius constants
- [ ] Export all tokens

**Estimated Time:** 2 hours  
**Priority:** P0  
**Dependencies:** None


## Phase 2: Core UI Components

### 2.1 Button Component
- [ ] Create `frontend/src/components/ui/Button.tsx`
- [ ] Implement ButtonProps interface dengan TypeScript
- [ ] Implement variants: primary, secondary, success, danger, warning, ghost
- [ ] Implement sizes: sm, md, lg
- [ ] Implement states: default, hover, focus, disabled, loading
- [ ] Add fullWidth option
- [ ] Add focus ring: `focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`
- [ ] Add transition: `transition-colors duration-200`
- [ ] Add ARIA attributes untuk accessibility
- [ ] Write unit tests untuk Button component
- [ ] Document usage dengan examples

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3

### 2.2 Input Component
- [ ] Create `frontend/src/components/ui/Input.tsx`
- [ ] Implement InputProps interface dengan TypeScript
- [ ] Implement states: default, focus, error, success, disabled
- [ ] Add label support dengan required indicator
- [ ] Add helper text support
- [ ] Add error message support
- [ ] Implement proper htmlFor dan id pairing
- [ ] Add focus ring: `focus:ring-2 focus:ring-blue-500`
- [ ] Use forwardRef untuk ref support
- [ ] Write unit tests untuk Input component
- [ ] Document usage dengan examples

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3

### 2.3 Select Component
- [ ] Create `frontend/src/components/ui/Select.tsx`
- [ ] Implement SelectProps interface dengan TypeScript
- [ ] Implement consistent styling dengan Input component
- [ ] Add label support
- [ ] Add error state support
- [ ] Add disabled state support
- [ ] Add focus ring
- [ ] Use forwardRef untuk ref support
- [ ] Write unit tests untuk Select component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 2.2


### 2.4 Textarea Component
- [ ] Create `frontend/src/components/ui/Textarea.tsx`
- [ ] Implement TextareaProps interface dengan TypeScript
- [ ] Implement consistent styling dengan Input component
- [ ] Add configurable rows
- [ ] Add resize control (default: resize-none)
- [ ] Add label dan error support
- [ ] Add focus ring
- [ ] Use forwardRef untuk ref support
- [ ] Write unit tests untuk Textarea component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 2.2

### 2.5 Checkbox Component
- [ ] Create `frontend/src/components/ui/Checkbox.tsx`
- [ ] Implement CheckboxProps interface dengan TypeScript
- [ ] Implement label dan description support
- [ ] Add hover state: `hover:bg-gray-50`
- [ ] Add border styling: `border border-gray-200 rounded-md`
- [ ] Implement proper label association
- [ ] Add disabled state
- [ ] Write unit tests untuk Checkbox component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3

### 2.6 Radio Component
- [ ] Create `frontend/src/components/ui/Radio.tsx`
- [ ] Implement RadioProps interface dengan TypeScript
- [ ] Implement label support
- [ ] Add hover state
- [ ] Add border styling
- [ ] Implement proper label association
- [ ] Add disabled state
- [ ] Write unit tests untuk Radio component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3


## Phase 3: Layout Components

### 3.1 Card Component
- [ ] Create `frontend/src/components/ui/Card.tsx`
- [ ] Implement CardProps interface dengan TypeScript
- [ ] Implement default styling: `bg-white p-6 rounded-lg shadow`
- [ ] Add hover state option
- [ ] Add clickable card option
- [ ] Add header dan footer sections support
- [ ] Implement flexible content area
- [ ] Write unit tests untuk Card component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3

### 3.2 KPI Card Component
- [ ] Create `frontend/src/components/ui/KPICard.tsx`
- [ ] Implement KPICardProps interface dengan TypeScript
- [ ] Implement icon dengan colored background (blue, green, purple, orange, red)
- [ ] Add title dengan `text-sm font-medium text-gray-600`
- [ ] Add value dengan `text-2xl font-bold text-gray-900`
- [ ] Add subtitle dengan `text-sm text-gray-500`
- [ ] Implement flex layout untuk icon dan content
- [ ] Add responsive sizing
- [ ] Write unit tests untuk KPICard component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 3.1

### 3.3 Navigation Card Component
- [ ] Create `frontend/src/components/ui/NavigationCard.tsx`
- [ ] Implement NavigationCardProps interface dengan TypeScript
- [ ] Implement Link wrapper dengan hover state
- [ ] Add icon dengan colored background
- [ ] Add title dan description
- [ ] Add arrow icon untuk indication
- [ ] Add hover transition: `transition-colors duration-200`
- [ ] Ensure accessibility dengan proper link semantics
- [ ] Write unit tests untuk NavigationCard component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** 3.1


## Phase 4: Status & Feedback Components

### 4.1 Badge Component
- [ ] Create `frontend/src/components/ui/Badge.tsx`
- [ ] Implement BadgeProps interface dengan TypeScript
- [ ] Implement status variants: pending, confirmed, in_progress, done, cancelled
- [ ] Implement color mapping untuk each status
- [ ] Add sizes: sm, md
- [ ] Add rounded-full styling
- [ ] Add font-medium dan text-xs
- [ ] Write unit tests untuk Badge component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3

### 4.2 Alert Component
- [ ] Create `frontend/src/components/ui/Alert.tsx`
- [ ] Implement AlertProps interface dengan TypeScript
- [ ] Implement variants: success, error, warning, info
- [ ] Implement color mapping untuk each variant
- [ ] Add border styling: `border rounded-md`
- [ ] Add padding: `px-4 py-3`
- [ ] Add icon support (optional)
- [ ] Add dismissible option dengan close button
- [ ] Write unit tests untuk Alert component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3

### 4.3 Loading Spinner Component
- [ ] Create `frontend/src/components/ui/LoadingSpinner.tsx`
- [ ] Implement LoadingSpinnerProps interface dengan TypeScript
- [ ] Implement spinning animation: `animate-spin`
- [ ] Add circular border: `rounded-full border-b-2`
- [ ] Add color: `border-blue-600`
- [ ] Implement sizes: sm (h-4 w-4), md (h-8 w-8), lg (h-12 w-12)
- [ ] Add centered layout option
- [ ] Write unit tests untuk LoadingSpinner component
- [ ] Document usage dengan examples

**Estimated Time:** 2 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3


### 4.4 Empty State Component
- [ ] Create `frontend/src/components/ui/EmptyState.tsx`
- [ ] Implement EmptyStateProps interface dengan TypeScript
- [ ] Implement centered layout: `text-center py-12`
- [ ] Add icon dengan gray color: `text-gray-400`
- [ ] Add title: `text-lg font-semibold text-gray-900`
- [ ] Add description: `text-gray-600`
- [ ] Add call-to-action button support
- [ ] Implement proper spacing antara elements
- [ ] Write unit tests untuk EmptyState component
- [ ] Document usage dengan examples

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3, 2.1

## Phase 5: Navigation Components

### 5.1 Navigation Bar Component
- [ ] Create `frontend/src/components/ui/NavigationBar.tsx`
- [ ] Implement NavigationBarProps interface dengan TypeScript
- [ ] Implement white background dengan shadow-sm dan border-b
- [ ] Add max width container: `max-w-7xl mx-auto`
- [ ] Set height: 64px (h-16)
- [ ] Add logo/brand name di kiri
- [ ] Add navigation links di kanan
- [ ] Implement responsive: hamburger menu untuk mobile
- [ ] Add active state indication
- [ ] Add hover states untuk links
- [ ] Write unit tests untuk NavigationBar component
- [ ] Document usage dengan examples

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3

### 5.2 Breadcrumb Component
- [ ] Create `frontend/src/components/ui/Breadcrumb.tsx`
- [ ] Implement BreadcrumbProps interface dengan TypeScript
- [ ] Implement flex layout dengan separator (/)
- [ ] Add link styling: `text-gray-600 hover:text-blue-600`
- [ ] Add current page: `text-gray-900` (tidak clickable)
- [ ] Set text size: small
- [ ] Add proper spacing dengan space-x-2
- [ ] Write unit tests untuk Breadcrumb component
- [ ] Document usage dengan examples

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3


### 5.3 Back Link Component
- [ ] Create `frontend/src/components/ui/BackLink.tsx`
- [ ] Implement BackLinkProps interface dengan TypeScript
- [ ] Implement inline flex dengan icon
- [ ] Add blue color: `text-blue-600 hover:text-blue-700`
- [ ] Add arrow icon di kiri
- [ ] Add proper spacing dengan margin bottom
- [ ] Write unit tests untuk BackLink component
- [ ] Document usage dengan examples

**Estimated Time:** 1 hour  
**Priority:** P1  
**Dependencies:** 1.2, 1.3

## Phase 6: Data Display Components

### 6.1 Table Component
- [ ] Create `frontend/src/components/ui/Table.tsx`
- [ ] Implement TableProps interface dengan TypeScript
- [ ] Implement white background dengan rounded corners
- [ ] Add shadow untuk elevation
- [ ] Implement header: `bg-gray-50` dengan uppercase text
- [ ] Add header text: `text-xs font-medium text-gray-600 uppercase tracking-wider`
- [ ] Add row hover: `hover:bg-gray-50`
- [ ] Set cell padding: `px-6 py-4`
- [ ] Add dividers: `divide-y divide-gray-200`
- [ ] Implement responsive: horizontal scroll pada mobile
- [ ] Add overflow handling dengan `overflow-hidden`
- [ ] Write unit tests untuk Table component
- [ ] Document usage dengan examples

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** 1.2, 1.3

## Phase 7: Modal Components

### 7.1 Modal Component
- [ ] Create `frontend/src/components/ui/Modal.tsx`
- [ ] Implement ModalProps interface dengan TypeScript
- [ ] Implement overlay: `bg-black bg-opacity-50`
- [ ] Add modal container: `bg-white rounded-lg max-w-md`
- [ ] Set z-index: `z-50`
- [ ] Implement centered dengan flex layout
- [ ] Add title styling: `text-lg font-semibold text-gray-900`
- [ ] Add content styling: `text-gray-600`
- [ ] Implement button layout: flex dengan gap
- [ ] Add close on overlay click (optional)
- [ ] Add escape key support
- [ ] Implement focus trap inside modal
- [ ] Add proper ARIA attributes: `role="dialog"`, `aria-modal="true"`
- [ ] Write unit tests untuk Modal component
- [ ] Document usage dengan examples

**Estimated Time:** 5 hours  
**Priority:** P0  
**Dependencies:** 1.2, 1.3, 2.1


### 7.2 Confirmation Dialog Component
- [ ] Create `frontend/src/components/ui/ConfirmationDialog.tsx`
- [ ] Implement ConfirmationDialogProps interface dengan TypeScript
- [ ] Extend Modal component
- [ ] Add title, message, confirmText, cancelText props
- [ ] Add onConfirm dan onCancel callbacks
- [ ] Implement danger variant untuk destructive actions
- [ ] Add loading state untuk async operations
- [ ] Write unit tests untuk ConfirmationDialog component
- [ ] Document usage dengan examples

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** 7.1

## Phase 8: Update Existing Components

### 8.1 Update Authentication Components
- [ ] Update `LoginForm.tsx` untuk use new Input dan Button components
- [ ] Update `RegisterForm.tsx` untuk use new Input dan Button components
- [ ] Ensure proper error states dengan new Alert component
- [ ] Test form submissions
- [ ] Verify accessibility dengan keyboard navigation
- [ ] Test responsive design

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 2.1, 2.2, 4.2

### 8.2 Update Booking Components
- [ ] Update `BookingForm.tsx` untuk use new form components
- [ ] Update `BookingFilters.tsx` untuk use new Input dan Select components
- [ ] Update `CancelButton.tsx` untuk use new Button component
- [ ] Update `RescheduleButton.tsx` untuk use new Button component
- [ ] Update `RescheduleForm.tsx` untuk use new form components
- [ ] Ensure proper validation states
- [ ] Test all booking flows
- [ ] Verify accessibility

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** 2.1, 2.2, 2.3, 2.4

### 8.3 Update Dashboard Components
- [ ] Update `KPICard.tsx` untuk use new KPICard component
- [ ] Update `QuickNavigation.tsx` untuk use new NavigationCard component
- [ ] Update `ChartCard.tsx` untuk use new Card component
- [ ] Ensure consistent styling
- [ ] Test responsive layout
- [ ] Verify accessibility

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 3.1, 3.2, 3.3


### 8.4 Update Service Components
- [ ] Update `ServiceForm.tsx` untuk use new form components
- [ ] Update `DeleteServiceButton.tsx` untuk use new Button dan ConfirmationDialog
- [ ] Ensure proper validation states
- [ ] Test service CRUD operations
- [ ] Verify accessibility

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** 2.1, 2.2, 7.2

### 8.5 Update Mechanic Components
- [ ] Update `MechanicForm.tsx` untuk use new form components
- [ ] Update `LinkMechanicForm.tsx` untuk use new form components
- [ ] Ensure proper validation states
- [ ] Test mechanic CRUD operations
- [ ] Verify accessibility

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** 2.1, 2.2

### 8.6 Update Assignment Components
- [ ] Update `AssignMechanicForm.tsx` untuk use new form components
- [ ] Ensure proper validation states
- [ ] Test assignment operations
- [ ] Verify accessibility

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** 2.1, 2.2, 2.3

### 8.7 Update Progress Components
- [ ] Update `ServiceActionButtons.tsx` untuk use new Button components
- [ ] Ensure proper button variants (success, danger, warning)
- [ ] Test service progress actions
- [ ] Verify accessibility

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 2.1

### 8.8 Update Warning Components
- [ ] Update `SLAWarning.tsx` untuk use new Alert component
- [ ] Update `OverloadWarning.tsx` untuk use new Alert component
- [ ] Ensure proper alert variants
- [ ] Test warning displays
- [ ] Verify accessibility

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 4.2


### 8.9 Update Common Components
- [ ] Update `DeleteConfirmation.tsx` untuk use new ConfirmationDialog component
- [ ] Update `ErrorBoundary.tsx` untuk use new Alert component
- [ ] Test error handling flows
- [ ] Verify accessibility

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 4.2, 7.2

## Phase 9: Update Page Layouts

### 9.1 Update Admin Pages
- [ ] Update `admin/page.tsx` untuk use new dashboard layout
- [ ] Update `admin/dashboard/page.tsx` untuk use new components
- [ ] Update `admin/bookings/page.tsx` untuk use new Table dan Badge components
- [ ] Update `admin/bookings/[id]/page.tsx` untuk use new Card dan Button components
- [ ] Update `admin/services/page.tsx` untuk use new Table components
- [ ] Update `admin/services/[id]/edit/page.tsx` untuk use new form components
- [ ] Update `admin/services/new/page.tsx` untuk use new form components
- [ ] Update `admin/mechanics/[id]/edit/page.tsx` untuk use new form components
- [ ] Update `admin/mechanics/link/page.tsx` untuk use new form components
- [ ] Update `admin/audit/page.tsx` untuk use new Table components
- [ ] Update `admin/sla/page.tsx` untuk use new components
- [ ] Test all admin pages
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 12 hours  
**Priority:** P0  
**Dependencies:** All Phase 2-7 tasks

### 9.2 Update Customer Pages
- [ ] Update `customer/page.tsx` untuk use new dashboard layout
- [ ] Update `customer/bookings/page.tsx` untuk use new Card dan Badge components
- [ ] Update `customer/bookings/[id]/page.tsx` untuk use new Card dan Button components
- [ ] Update `customer/bookings/new/BookingFormClient.tsx` untuk use new form components
- [ ] Test all customer pages
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** All Phase 2-7 tasks


### 9.3 Update Mechanic Pages
- [ ] Update `mechanic/page.tsx` untuk use new dashboard layout
- [ ] Update `mechanic/queue/page.tsx` untuk use new Card dan Badge components
- [ ] Update `mechanic/queue/[id]/page.tsx` untuk use new Card dan Button components
- [ ] Test all mechanic pages
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** All Phase 2-7 tasks

### 9.4 Update Owner Pages
- [ ] Update `owner/page.tsx` untuk use new dashboard layout
- [ ] Test owner dashboard
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** All Phase 2-7 tasks

### 9.5 Update Authentication Pages
- [ ] Update `login/page.tsx` untuk use new form layout
- [ ] Update `register/page.tsx` untuk use new form layout
- [ ] Update `page.tsx` (home) untuk use new components
- [ ] Test authentication flows
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 8.1

### 9.6 Update Error Pages
- [ ] Update `error.tsx` untuk use new Alert component
- [ ] Update `not-found.tsx` untuk use new EmptyState component
- [ ] Test error scenarios
- [ ] Verify responsive design
- [ ] Verify accessibility

**Estimated Time:** 2 hours  
**Priority:** P1  
**Dependencies:** 4.2, 4.4


## Phase 10: Accessibility Implementation

### 10.1 Setup Accessibility Testing Tools
- [ ] Install axe-core untuk automated testing
- [ ] Install @axe-core/react untuk React integration
- [ ] Setup accessibility testing dalam Jest
- [ ] Create accessibility test utilities
- [ ] Document testing procedures

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** None

### 10.2 Implement Keyboard Navigation
- [ ] Audit all interactive elements untuk keyboard accessibility
- [ ] Ensure proper tab order di semua pages
- [ ] Implement skip links untuk main content
- [ ] Add escape key support untuk modals
- [ ] Test keyboard navigation di semua pages
- [ ] Document keyboard shortcuts

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 10.3 Implement Focus Management
- [ ] Ensure all interactive elements have visible focus indicators
- [ ] Implement focus trap untuk modals
- [ ] Manage focus on page transitions
- [ ] Test focus management di semua pages
- [ ] Document focus management patterns

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 10.2

### 10.4 Add ARIA Attributes
- [ ] Add ARIA labels untuk icon-only buttons
- [ ] Add ARIA attributes untuk complex interactions
- [ ] Add ARIA live regions untuk dynamic content
- [ ] Add ARIA attributes untuk form validation
- [ ] Add ARIA attributes untuk modals
- [ ] Test dengan screen readers (NVDA, JAWS, VoiceOver)
- [ ] Document ARIA usage patterns

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks


### 10.5 Verify Color Contrast
- [ ] Audit all text untuk color contrast ratios
- [ ] Fix any contrast issues (target: WCAG AA)
- [ ] Document approved color combinations
- [ ] Create contrast checking utility
- [ ] Test dengan color contrast tools

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 10.6 Test with Screen Readers
- [ ] Test dengan NVDA (Windows)
- [ ] Test dengan JAWS (Windows)
- [ ] Test dengan VoiceOver (macOS/iOS)
- [ ] Test dengan TalkBack (Android)
- [ ] Document screen reader compatibility
- [ ] Fix any screen reader issues

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** 10.4

## Phase 11: Responsive Design Testing

### 11.1 Mobile Testing (320px - 767px)
- [ ] Test all pages pada mobile devices
- [ ] Verify touch targets meet minimum size (44px × 44px)
- [ ] Test forms pada mobile
- [ ] Test navigation pada mobile
- [ ] Test modals pada mobile
- [ ] Fix any mobile-specific issues
- [ ] Document mobile-specific considerations

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 11.2 Tablet Testing (768px - 1023px)
- [ ] Test all pages pada tablet devices
- [ ] Verify grid layouts work correctly
- [ ] Test forms pada tablet
- [ ] Test navigation pada tablet
- [ ] Fix any tablet-specific issues
- [ ] Document tablet-specific considerations

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks


### 11.3 Desktop Testing (1024px+)
- [ ] Test all pages pada desktop browsers
- [ ] Verify layouts work correctly
- [ ] Test hover states
- [ ] Test focus states
- [ ] Fix any desktop-specific issues
- [ ] Document desktop-specific considerations

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 11.4 Cross-Browser Testing
- [ ] Test pada Chrome (latest 2 versions)
- [ ] Test pada Firefox (latest 2 versions)
- [ ] Test pada Safari (latest 2 versions)
- [ ] Test pada Edge (latest 2 versions)
- [ ] Test pada Chrome Mobile
- [ ] Test pada Safari Mobile
- [ ] Fix any browser-specific issues
- [ ] Document browser compatibility

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** 11.1, 11.2, 11.3

## Phase 12: Bahasa Indonesia Consistency

### 12.1 Audit UI Text
- [ ] Audit all UI text di semua pages
- [ ] Identify any English text yang perlu ditranslate
- [ ] Identify any mixing Bahasa Indonesia dan English
- [ ] Create list of inconsistencies
- [ ] Document findings

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 12.2 Update UI Text
- [ ] Update all UI text untuk use Bahasa Indonesia
- [ ] Ensure consistent terminology
- [ ] Update button labels
- [ ] Update form labels
- [ ] Update error messages
- [ ] Update success messages
- [ ] Update navigation labels
- [ ] Update page titles
- [ ] Test all updated text

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** 12.1


### 12.3 Create Terminology Guide
- [ ] Document standard terminology (English → Bahasa Indonesia)
- [ ] Create tone of voice guidelines
- [ ] Create error message guidelines
- [ ] Create examples of good vs bad text
- [ ] Share dengan team

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** 12.2

## Phase 13: Performance Optimization

### 13.1 CSS Bundle Optimization
- [ ] Verify Tailwind JIT mode enabled
- [ ] Configure purge untuk production
- [ ] Analyze CSS bundle size
- [ ] Remove unused CSS
- [ ] Test production build
- [ ] Verify bundle size < 50KB (gzipped)

**Estimated Time:** 3 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 13.2 Image Optimization
- [ ] Audit all images
- [ ] Convert images to Next.js Image component
- [ ] Add lazy loading
- [ ] Add proper width dan height
- [ ] Optimize SVG icons
- [ ] Test image loading performance

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** All Phase 8-9 tasks

### 13.3 Animation Optimization
- [ ] Audit all animations
- [ ] Ensure CSS transitions used (not JavaScript)
- [ ] Verify standard duration (200ms)
- [ ] Remove any `transition-all` usage
- [ ] Test animation performance
- [ ] Verify 60fps animations

**Estimated Time:** 3 hours  
**Priority:** P1  
**Dependencies:** All Phase 8-9 tasks


### 13.4 Performance Testing
- [ ] Run Lighthouse audits untuk all pages
- [ ] Verify page load time < 3 seconds
- [ ] Verify First Contentful Paint < 1.5 seconds
- [ ] Verify Time to Interactive < 3.5 seconds
- [ ] Verify CLS < 0.1
- [ ] Fix any performance issues
- [ ] Document performance metrics

**Estimated Time:** 6 hours  
**Priority:** P0  
**Dependencies:** 13.1, 13.2, 13.3

## Phase 14: Testing & Quality Assurance

### 14.1 Unit Testing
- [ ] Write unit tests untuk all reusable components
- [ ] Test component rendering
- [ ] Test component props
- [ ] Test component states
- [ ] Test component events
- [ ] Achieve > 80% code coverage
- [ ] Document testing patterns

**Estimated Time:** 12 hours  
**Priority:** P0  
**Dependencies:** All Phase 2-7 tasks

### 14.2 Integration Testing
- [ ] Test forms submission flows
- [ ] Test navigation flows
- [ ] Test modal interactions
- [ ] Test alert displays
- [ ] Test table interactions
- [ ] Test button actions
- [ ] Document integration test cases

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** All Phase 8-9 tasks

### 14.3 Accessibility Testing
- [ ] Run axe-core automated tests
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Test color contrast
- [ ] Test touch targets
- [ ] Fix any accessibility issues
- [ ] Document accessibility test results

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** Phase 10 tasks


### 14.4 Visual Testing
- [ ] Test all pages di Chrome
- [ ] Test all pages di Firefox
- [ ] Test all pages di Safari
- [ ] Test all pages di Edge
- [ ] Test all pages di mobile browsers
- [ ] Verify consistent styling
- [ ] Fix any visual issues
- [ ] Document visual test results

**Estimated Time:** 8 hours  
**Priority:** P0  
**Dependencies:** Phase 11 tasks

### 14.5 User Acceptance Testing
- [ ] Prepare UAT test cases
- [ ] Conduct UAT dengan stakeholders
- [ ] Gather feedback
- [ ] Document feedback
- [ ] Prioritize fixes
- [ ] Implement fixes
- [ ] Re-test

**Estimated Time:** 12 hours  
**Priority:** P0  
**Dependencies:** All previous phases

## Phase 15: Documentation

### 15.1 Component Documentation
- [ ] Document Button component usage
- [ ] Document Input component usage
- [ ] Document Select component usage
- [ ] Document Textarea component usage
- [ ] Document Checkbox component usage
- [ ] Document Radio component usage
- [ ] Document Card component usage
- [ ] Document KPICard component usage
- [ ] Document NavigationCard component usage
- [ ] Document Badge component usage
- [ ] Document Alert component usage
- [ ] Document LoadingSpinner component usage
- [ ] Document EmptyState component usage
- [ ] Document Modal component usage
- [ ] Document ConfirmationDialog component usage
- [ ] Document Table component usage
- [ ] Document NavigationBar component usage
- [ ] Document Breadcrumb component usage
- [ ] Document BackLink component usage

**Estimated Time:** 8 hours  
**Priority:** P1  
**Dependencies:** All Phase 2-7 tasks


### 15.2 Design System Documentation
- [ ] Document color system dengan contrast ratios
- [ ] Document typography scale
- [ ] Document spacing system
- [ ] Document shadow system
- [ ] Document border radius system
- [ ] Document component library overview
- [ ] Document pattern library
- [ ] Document accessibility guidelines
- [ ] Document Bahasa Indonesia terminology
- [ ] Document best practices
- [ ] Create quick reference guide

**Estimated Time:** 8 hours  
**Priority:** P1  
**Dependencies:** All previous phases

### 15.3 Migration Guide
- [ ] Document migration process
- [ ] Create before/after examples
- [ ] Document common pitfalls
- [ ] Create testing checklist
- [ ] Document rollback procedures
- [ ] Share dengan team

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** All previous phases

### 15.4 Developer Guide
- [ ] Document file structure
- [ ] Document naming conventions
- [ ] Document component creation process
- [ ] Document testing requirements
- [ ] Document code review checklist
- [ ] Share dengan team

**Estimated Time:** 4 hours  
**Priority:** P1  
**Dependencies:** All previous phases

## Phase 16: Deployment & Monitoring

### 16.1 Pre-Deployment Checklist
- [ ] All tests passing
- [ ] All accessibility tests passing
- [ ] All performance metrics met
- [ ] All UI text dalam Bahasa Indonesia
- [ ] All documentation complete
- [ ] Code review completed
- [ ] Stakeholder approval obtained

**Estimated Time:** 2 hours  
**Priority:** P0  
**Dependencies:** All previous phases


### 16.2 Deployment
- [ ] Create deployment plan
- [ ] Backup current production
- [ ] Deploy to staging environment
- [ ] Test staging environment
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor for issues

**Estimated Time:** 4 hours  
**Priority:** P0  
**Dependencies:** 16.1

### 16.3 Post-Deployment Monitoring
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Monitor user feedback
- [ ] Monitor accessibility issues
- [ ] Create issue tracking system
- [ ] Document any issues
- [ ] Prioritize fixes

**Estimated Time:** Ongoing  
**Priority:** P0  
**Dependencies:** 16.2

### 16.4 Post-Deployment Support
- [ ] Provide support untuk team members
- [ ] Answer questions about new components
- [ ] Help dengan migration issues
- [ ] Update documentation based on feedback
- [ ] Create FAQ document

**Estimated Time:** Ongoing  
**Priority:** P1  
**Dependencies:** 16.2

## Summary

### Total Estimated Time
- **Phase 1 (Foundation Setup):** 5 hours
- **Phase 2 (Core UI Components):** 20 hours
- **Phase 3 (Layout Components):** 9 hours
- **Phase 4 (Status & Feedback):** 10 hours
- **Phase 5 (Navigation Components):** 7 hours
- **Phase 6 (Data Display):** 4 hours
- **Phase 7 (Modal Components):** 8 hours
- **Phase 8 (Update Existing Components):** 31 hours
- **Phase 9 (Update Page Layouts):** 36 hours
- **Phase 10 (Accessibility Implementation):** 31 hours
- **Phase 11 (Responsive Design Testing):** 28 hours
- **Phase 12 (Bahasa Indonesia Consistency):** 15 hours
- **Phase 13 (Performance Optimization):** 16 hours
- **Phase 14 (Testing & QA):** 48 hours
- **Phase 15 (Documentation):** 24 hours
- **Phase 16 (Deployment & Monitoring):** 6 hours + ongoing

**Total:** ~298 hours (~7.5 weeks for 1 developer, ~3.75 weeks for 2 developers)


### Priority Breakdown

**P0 (Must Have) - Critical Path:**
- Phase 1: Foundation Setup (5 hours)
- Phase 2: Core UI Components (20 hours)
- Phase 3: Layout Components - Card, KPICard (6 hours)
- Phase 4: Status & Feedback - Badge, Alert, LoadingSpinner (8 hours)
- Phase 7: Modal Components (8 hours)
- Phase 8: Update Existing Components - Auth, Booking, Dashboard (14 hours)
- Phase 9: Update Page Layouts - Admin, Customer, Mechanic, Auth (30 hours)
- Phase 10: Accessibility Implementation (31 hours)
- Phase 11: Responsive Design Testing (28 hours)
- Phase 12: Bahasa Indonesia Consistency (12 hours)
- Phase 13: Performance Optimization (12 hours)
- Phase 14: Testing & QA (48 hours)
- Phase 16: Deployment & Monitoring (6 hours)

**P0 Total:** ~228 hours (~5.7 weeks for 1 developer)

**P1 (Should Have) - Important but not blocking:**
- Phase 3: NavigationCard (3 hours)
- Phase 4: EmptyState (2 hours)
- Phase 5: Navigation Components (7 hours)
- Phase 6: Table Component (4 hours)
- Phase 8: Update Service, Mechanic, Assignment, Progress, Warning, Common (17 hours)
- Phase 9: Update Owner, Error Pages (6 hours)
- Phase 12: Terminology Guide (3 hours)
- Phase 13: Image & Animation Optimization (7 hours)
- Phase 15: Documentation (24 hours)
- Phase 16: Post-Deployment Support (ongoing)

**P1 Total:** ~73 hours (~1.8 weeks for 1 developer)

**P2 (Nice to Have) - Future enhancements:**
- Visual regression testing
- Storybook integration
- Dark mode support
- Advanced animations
- Component playground
- Design tokens export

### Dependencies Graph

```
Phase 1 (Foundation)
  ↓
Phase 2 (Core Components) ← Phase 1
  ↓
Phase 3 (Layout) ← Phase 2
Phase 4 (Feedback) ← Phase 2
Phase 5 (Navigation) ← Phase 2
Phase 6 (Tables) ← Phase 2
Phase 7 (Modals) ← Phase 2
  ↓
Phase 8 (Update Components) ← Phase 2-7
  ↓
Phase 9 (Update Pages) ← Phase 8
  ↓
Phase 10 (Accessibility) ← Phase 9
Phase 11 (Responsive) ← Phase 9
Phase 12 (Bahasa) ← Phase 9
Phase 13 (Performance) ← Phase 9
  ↓
Phase 14 (Testing) ← Phase 10-13
  ↓
Phase 15 (Documentation) ← Phase 14
  ↓
Phase 16 (Deployment) ← Phase 15
```


### Recommended Execution Strategy

**Week 1-2: Foundation & Core Components (P0)**
- Complete Phase 1: Foundation Setup
- Complete Phase 2: Core UI Components (Button, Input, Select, Textarea)
- Complete Phase 3: Card, KPICard
- Complete Phase 4: Badge, Alert, LoadingSpinner
- Complete Phase 7: Modal, ConfirmationDialog

**Week 3-4: Update Existing Components (P0)**
- Complete Phase 8: Update Auth, Booking, Dashboard components
- Start Phase 9: Update Admin pages

**Week 5-6: Update Pages & Accessibility (P0)**
- Complete Phase 9: Update all pages (Admin, Customer, Mechanic, Auth)
- Complete Phase 10: Accessibility Implementation
- Complete Phase 11: Responsive Design Testing

**Week 7-8: Testing & Polish (P0)**
- Complete Phase 12: Bahasa Indonesia Consistency
- Complete Phase 13: Performance Optimization
- Complete Phase 14: Testing & QA
- Complete Phase 16: Deployment

**Week 9+ (Optional P1 tasks):**
- Complete Phase 5: Navigation Components
- Complete Phase 6: Table Component
- Complete remaining Phase 8 & 9 tasks
- Complete Phase 15: Documentation
- Complete Phase 12.3: Terminology Guide

### Risk Mitigation

**Risk 1: Breaking Existing Functionality**
- Mitigation: Incremental updates, thorough testing, keep old components until verified
- Contingency: Rollback plan, feature flags

**Risk 2: Accessibility Issues**
- Mitigation: Automated testing with axe-core, manual testing, screen reader testing
- Contingency: Dedicated accessibility review, user testing

**Risk 3: Performance Degradation**
- Mitigation: Bundle size monitoring, Lighthouse audits, performance testing
- Contingency: Code splitting, lazy loading, optimization sprint

**Risk 4: Timeline Overrun**
- Mitigation: Focus on P0 tasks first, parallel work where possible
- Contingency: Defer P1 tasks, add resources, extend timeline

### Success Metrics

**Functional Metrics:**
- ✅ All P0 components created and tested
- ✅ All P0 pages updated
- ✅ All existing functionality preserved

**Accessibility Metrics:**
- ✅ WCAG 2.1 Level AA compliance (axe-core score > 95)
- ✅ Keyboard navigation works on all pages
- ✅ Screen reader compatible

**Performance Metrics:**
- ✅ CSS bundle < 50KB (gzipped)
- ✅ Page load time < 3 seconds
- ✅ Lighthouse score > 90

**Quality Metrics:**
- ✅ Code coverage > 80%
- ✅ All UI text in Bahasa Indonesia
- ✅ Zero critical bugs in production

---

**Document Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Ready for Implementation  
**Owner:** Fixit Development Team
