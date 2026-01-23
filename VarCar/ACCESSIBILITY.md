# Accessibility Guidelines - VarCar Color System

## WCAG 2.1 Compliance

This document outlines the accessibility features and compliance measures implemented in the VarCar Color System.

### Level AA Compliance (Target)

We aim for WCAG 2.1 Level AA compliance across all components.

## Implemented Features

### 1. Keyboard Navigation

#### Global Shortcuts
- `?` - Toggle keyboard shortcuts panel
- `Escape` - Close modals/dialogs
- `Tab` / `Shift+Tab` - Navigate between interactive elements
- `Enter` / `Space` - Activate buttons and controls

#### Component-Specific
- **Color Sidebar**
  - `↑` / `↓` - Navigate palette list
  - `Enter` - Select palette
  - `/` - Focus search input

- **Color Editor**
  - `Tab` - Navigate between color inputs
  - `Enter` - Open color picker
  - `Escape` - Close color picker

- **Scale Preview**
  - `Tab` - Navigate between controls
  - `c` - Copy color value (when focused)

### 2. Focus Management

- **Focus Indicators**: All interactive elements have visible focus indicators
- **Focus Trap**: Modals and dialogs trap focus within their boundaries
- **Focus Return**: Focus returns to triggering element when closing modals
- **Skip Links**: Skip navigation links for screen readers

### 3. ARIA Labels and Roles

All components include appropriate ARIA attributes:

```tsx
// Button with accessible label
<button aria-label="Create new palette">
  <Plus />
</button>

// Loading state
<div role="status" aria-live="polite">
  Loading palettes...
</div>

// Error message
<div role="alert" aria-live="assertive">
  Failed to save palette
</div>
```

### 4. Color Contrast

#### Contrast Checking
- All color scales include WCAG contrast ratio calculations
- Visual indicators for AA/AAA compliance
- Contrast preview component for validation

#### Text Contrast
- Minimum 4.5:1 for normal text (AA)
- Minimum 7:1 for normal text (AAA)
- Minimum 3:1 for large text (AA)
- Minimum 4.5:1 for large text (AAA)

#### UI Elements
- Minimum 3:1 for UI components and graphics (AA)

### 5. Screen Reader Support

#### Semantic HTML
- Proper heading hierarchy (h1 → h2 → h3)
- Semantic landmarks (`<nav>`, `<main>`, `<aside>`)
- Lists for grouped content

#### Live Regions
```tsx
// Success notification
<div role="status" aria-live="polite" aria-atomic="true">
  Palette created successfully
</div>

// Error notification
<div role="alert" aria-live="assertive" aria-atomic="true">
  Failed to create palette
</div>
```

#### Hidden Content
- `aria-hidden="true"` for decorative icons
- `sr-only` class for screen reader-only text

### 6. Form Accessibility

#### Labels
- All form inputs have associated labels
- Error messages linked via `aria-describedby`
- Required fields marked with `aria-required="true"`

#### Validation
```tsx
<input
  aria-label="Palette name"
  aria-required="true"
  aria-invalid={hasError}
  aria-describedby={hasError ? "name-error" : undefined}
/>
{hasError && (
  <span id="name-error" role="alert">
    Palette name is required
  </span>
)}
```

### 7. Motion and Animation

#### Reduced Motion
Respects `prefers-reduced-motion` system setting:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 8. Touch Targets

- Minimum 44x44px touch target size
- Adequate spacing between interactive elements
- No overlapping touch targets

## Testing Checklist

### Manual Testing

- [ ] Keyboard navigation works in all components
- [ ] Focus indicators are visible
- [ ] Screen reader announces content correctly
- [ ] Color contrast meets WCAG AA standards
- [ ] Forms are fully accessible
- [ ] Modals trap focus correctly
- [ ] Error messages are announced
- [ ] Loading states are announced

### Automated Testing

Tools used:
- **axe-core**: Automated accessibility testing
- **eslint-plugin-jsx-a11y**: Linting for accessibility issues
- **Lighthouse**: Accessibility audit

### Browser Testing

Tested on:
- Chrome + ChromeVox
- Firefox + NVDA
- Safari + VoiceOver
- Edge + Narrator

## Known Issues

None currently identified.

## Future Improvements

1. **High Contrast Mode**: Add support for Windows High Contrast mode
2. **Zoom Support**: Ensure layout works at 200% zoom
3. **Voice Control**: Test with Dragon NaturallySpeaking
4. **Mobile Screen Readers**: Test with TalkBack (Android) and VoiceOver (iOS)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Reporting Issues

If you discover an accessibility issue, please report it with:
- Description of the issue
- Steps to reproduce
- Browser and assistive technology used
- WCAG success criterion affected
