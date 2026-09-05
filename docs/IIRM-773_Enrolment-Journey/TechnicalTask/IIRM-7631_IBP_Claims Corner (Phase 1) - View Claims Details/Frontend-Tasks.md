# Frontend Technical Tasks - IIRM-7631

## Task 9: Dashboard Claims Summary Widget

**Story Points:** 8  
**Priority:** High  
**Dependencies:** Claims Summary API

### Description
Create reusable claims summary widget component for dashboard

### Acceptance Criteria
- [ ] Create `ClaimsSummaryWidget` React component
- [ ] Display policy-level statistics (total/settled/pending claims)
- [ ] Show policy information (number, expiry, sum insured)
- [ ] Display available amount calculation
- [ ] Show recent claims list (max 3 items)
- [ ] Implement conditional rendering for multiple policies
- [ ] Hide widget when no claims available
- [ ] Add loading states and error handling
- [ ] Make widget responsive for mobile devices
- [ ] Follow existing design system patterns

### Technical Details
- Implement in `apps/ui/ibp/src/components/dashboard/`
- Use existing UI library components and styling patterns
- Ensure accessibility compliance

### Component Structure
```
ClaimsSummaryWidget/
├── index.tsx
├── ClaimsSummaryWidget.tsx
├── ClaimsSummaryWidget.module.css
├── components/
│   ├── ClaimStatusBar.tsx
│   ├── PolicyInfo.tsx
│   ├── RecentClaimsList.tsx
│   └── FamilyMembers.tsx
└── __tests__/
    └── ClaimsSummaryWidget.test.tsx
```

### Props Interface
```typescript
interface ClaimsSummaryWidgetProps {
  employeeId: string;
  policyType?: 'GMC' | 'GPA' | 'GTL';
  showFamilyMembers?: boolean;
  maxRecentClaims?: number;
  onClaimsCornerClick?: () => void;
}
```

---

## Task 10: Claims Corner Main Page

**Story Points:** 8  
**Priority:** High  
**Dependencies:** All APIs

### Description
Develop main Claims Corner screen with navigation and layout structure

### Acceptance Criteria
- [ ] Create `ClaimsCorner` main page component
- [ ] Implement navigation from dashboard claims tab
- [ ] Create policy-wise view structure (GMC, GPA, GTL tabs)
- [ ] Add breadcrumb navigation
- [ ] Implement responsive layout for different screen sizes
- [ ] Add page loading states
- [ ] Handle no-data scenarios gracefully
- [ ] Add refresh functionality
- [ ] Implement proper routing and deep linking
- [ ] Follow existing page layout patterns

### Technical Details
- Implement in `apps/ui/ibp/src/pages/claims-corner/`
- Use existing routing and layout components
- Ensure proper SEO and meta tags

### Page Structure
```
claims-corner/
├── index.tsx
├── ClaimsCorner.tsx
├── ClaimsCorner.module.css
├── components/
│   ├── PolicyTabs.tsx
│   ├── PolicyContent.tsx
│   ├── NoDataState.tsx
│   └── RefreshButton.tsx
├── hooks/
│   ├── useClaimsData.ts
│   └── usePolicyNavigation.ts
└── __tests__/
    └── ClaimsCorner.test.tsx
```

### Route Configuration
```typescript
// Route: /claims-corner/:policyType?
{
  path: '/claims-corner/:policyType?',
  component: ClaimsCorner,
  meta: {
    title: 'Claims Corner',
    breadcrumb: ['Dashboard', 'Claims Corner']
  }
}
```

---

## Task 11: Policy Information Section Component

**Story Points:** 6  
**Priority:** Medium  
**Dependencies:** Claims APIs

### Description
Create Policy Information & Coverage Utilization section component

### Acceptance Criteria
- [ ] Create `PolicyInformation` React component
- [ ] Display claim status summary bar (visual progress bar)
- [ ] Show policy details (number, expiry, sum insured)
- [ ] Calculate and display available amount
- [ ] Show recent claims list with member details
- [ ] Implement data binding from API responses
- [ ] Add visual indicators for claim statuses
- [ ] Handle different policy types appropriately
- [ ] Add click actions for claim details
- [ ] Implement proper data formatting (currency, dates)

### Technical Details
- Use chart library for visual representations
- Implement in claims-corner component directory

### Component Props
```typescript
interface PolicyInformationProps {
  policy: {
    id: string;
    type: 'GMC' | 'GPA' | 'GTL';
    number: string;
    expiryDate: string;
    totalSumInsured: number;
    availableAmount: number;
    claimsSummary: ClaimsSummary;
    recentClaims: Claim[];
  };
  showFamilyMembers?: boolean;
}
```

---

## Task 12: Life Event Update Card Component

**Story Points:** 3  
**Priority:** Low  
**Dependencies:** None

### Description
Implement Life Event Update card component for all policy types

### Acceptance Criteria
- [ ] Create `LifeEventUpdate` React component
- [ ] Display informative content about life events
- [ ] Add 'Update Now' CTA button
- [ ] Navigate to in-progress page on button click
- [ ] Show for all policy types (GMC, GPA, GTL)
- [ ] Implement proper styling and visual hierarchy
- [ ] Add hover and click states for CTA
- [ ] Make component configurable for different contexts
- [ ] Add accessibility features (ARIA labels, keyboard navigation)
- [ ] Follow existing card component patterns

### Technical Details
- Implement as reusable card component
- Use existing navigation utilities and button components

### Component Props
```typescript
interface LifeEventUpdateProps {
  policyType: 'GMC' | 'GPA' | 'GTL';
  variant?: 'default' | 'compact';
  onUpdateClick?: () => void;
}
```

---

## Task 13: Parental Policy & Add-on Components

**Story Points:** 5  
**Priority:** Medium  
**Dependencies:** Coverage API

### Description
Create Parental Policy and Add-on Coverage components with conditional display

### Acceptance Criteria
- [ ] Create `ParentalPolicy` React component
- [ ] Create `AddOnCoverage` React component
- [ ] Display parental policy only for GMC policies
- [ ] Show add-on coverage if mapped in policy
- [ ] Display coverage limits and utilization
- [ ] Show per-day entitlement amounts
- [ ] Implement visual progress indicators
- [ ] Add conditional rendering logic
- [ ] Handle data formatting for coverage amounts
- [ ] Make components responsive

### Technical Details
- Implement conditional rendering based on policy type
- Use existing progress bar and card components

### Component Structure
```
ParentalPolicyAddOns/
├── index.tsx
├── ParentalPolicy.tsx
├── AddOnCoverage.tsx
├── ParentalPolicy.module.css
├── AddOnCoverage.module.css
└── __tests__/
    ├── ParentalPolicy.test.tsx
    └── AddOnCoverage.test.tsx
```

---

## Task 14: Premium Summary Component

**Story Points:** 6  
**Priority:** Medium  
**Dependencies:** Premium API

### Description
Develop Premium Summary section with detailed breakdown

### Acceptance Criteria
- [ ] Create `PremiumSummary` React component
- [ ] Display total premium across all policies
- [ ] Show company vs employee contribution breakdown
- [ ] Display tax calculations
- [ ] Add visual charts for premium distribution
- [ ] Format currency amounts properly
- [ ] Handle multiple policy types aggregation
- [ ] Add tooltips for detailed explanations
- [ ] Implement responsive design
- [ ] Show premium history if available

### Technical Details
- Use chart library for visual representations
- Implement proper currency formatting utilities

### Component Props
```typescript
interface PremiumSummaryProps {
  employeeId: string;
  premiumData: {
    totalPremium: number;
    companyContribution: number;
    employeeContribution: number;
    totalTax: number;
    policyBreakdown: PolicyPremium[];
  };
  showHistory?: boolean;
}
```

---

## Task 15: Responsive Design & Styling

**Story Points:** 5  
**Priority:** Low  
**Dependencies:** All Components

### Description
Implement comprehensive responsive design and styling for Claims Corner

### Acceptance Criteria
- [ ] Ensure mobile responsiveness for all components
- [ ] Implement loading states for all API calls
- [ ] Add error handling UI components
- [ ] Follow existing design system guidelines
- [ ] Add skeleton loaders for better UX
- [ ] Implement proper spacing and typography
- [ ] Add hover states and micro-interactions
- [ ] Ensure accessibility compliance (WCAG 2.1)
- [ ] Test on multiple device sizes
- [ ] Add print-friendly styles

### Technical Details
- Use existing CSS modules and design tokens
- Follow responsive breakpoints defined in design system

### Responsive Breakpoints
```css
/* Mobile First Approach */
.component {
  /* Mobile: 320px - 767px */
}

@media (min-width: 768px) {
  .component {
    /* Tablet: 768px - 1023px */
  }
}

@media (min-width: 1024px) {
  .component {
    /* Desktop: 1024px+ */
  }
}
```

### Design System Integration
- Use existing color tokens from design system
- Follow spacing scale (4px, 8px, 16px, 24px, 32px)
- Use typography scale for consistent text sizing
- Implement existing button and card component patterns

---

## UI/UX Requirements

### Loading States
- Skeleton loaders for content areas
- Spinner for small actions
- Progress indicators for data sync

### Error States
- Graceful error messages
- Retry mechanisms
- Fallback content when appropriate

### Empty States
- Meaningful illustrations
- Clear call-to-action
- Help text for user guidance

### Accessibility
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance (WCAG AA)

---

**Frontend Total: 41 Story Points**