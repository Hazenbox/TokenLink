# Testing Guide - VarCar Color System

## Testing Strategy

### Test Pyramid
```
       /\
      /E2E\          (10% - End-to-End)
     /------\
    /Integr.\       (20% - Integration)
   /----------\
  /   Unit     \    (70% - Unit Tests)
 /--------------\
```

## Test Coverage Goals

- **Unit Tests**: > 80%
- **Integration Tests**: > 60%
- **E2E Tests**: Critical user flows

## End-to-End Testing

### Critical User Workflows

#### 1. Create and Edit Palette
```
✓ User can create a new palette
✓ User can name the palette
✓ User can add colors to palette steps
✓ User can edit existing colors
✓ User can see color preview in real-time
✓ Changes are persisted
```

**Test Steps:**
1. Click "Create Palette" button
2. Enter palette name "Test Palette"
3. Click "Create"
4. Verify palette appears in sidebar
5. Click on step 600
6. Enter hex color #3B82F6
7. Verify color appears in preview
8. Refresh page
9. Verify palette and color are still present

#### 2. Generate Color Scales
```
✓ User can select a palette
✓ User can view generated scales
✓ Scales show correct contrast ratios
✓ WCAG compliance indicators work
✓ User can switch between grid and list view
```

**Test Steps:**
1. Select palette from sidebar
2. Verify PaletteEditor shows on left
3. Verify ScalePreview shows on right
4. Add colors to steps 200-2500
5. Verify all 8 scales generate (Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal)
6. Check contrast ratios are calculated
7. Verify AA/AAA indicators appear
8. Click grid/list toggle
9. Verify view changes

#### 3. Export Palette
```
✓ User can export as JSON
✓ User can export as CSS
✓ User can export as Text
✓ User can copy SVG for Figma
✓ Downloaded files contain correct data
```

**Test Steps:**
1. Select palette with colors
2. Click download button
3. Select "JSON"
4. Verify file downloads
5. Open file and verify structure
6. Repeat for CSS and Text formats
7. Click "Copy palette to figma"
8. Verify SVG is copied to clipboard

#### 4. Surface Stacking Preview
```
✓ User can view surface stacking
✓ Light and dark sections render
✓ All variants show (Ghost, Minimal, Subtle, Bold)
✓ All states show (Idle, Hover, Pressed, Focus)
✓ Base color can be changed
```

**Test Steps:**
1. Select palette
2. Click "Stacking" button
3. Verify light section appears
4. Verify dark section appears
5. Count 5 columns in each section
6. Verify 4 variants in each column
7. Toggle "Show Focus" button
8. Verify focus states appear/disappear
9. Change base color dropdown
10. Verify colors update

#### 5. Search and Filter
```
✓ User can search palettes
✓ Search results update in real-time
✓ User can clear search
✓ Empty state shows when no results
```

**Test Steps:**
1. Create multiple palettes
2. Click search input in sidebar
3. Type palette name
4. Verify filtered results show
5. Type non-existent name
6. Verify "No results" message
7. Click clear button
8. Verify all palettes show again

#### 6. Theme Switching
```
✓ User can toggle light/dark theme
✓ Theme persists across sessions
✓ Ripple animation plays
✓ All components adapt to theme
```

**Test Steps:**
1. Click theme toggle button
2. Verify ripple animation plays
3. Verify UI switches to dark mode
4. Verify colors are readable
5. Refresh page
6. Verify theme persists
7. Toggle back to light mode
8. Verify everything works

#### 7. Keyboard Navigation
```
✓ User can navigate with Tab
✓ User can activate with Enter/Space
✓ User can close with Escape
✓ Focus indicators are visible
✓ Focus trap works in modals
```

**Test Steps:**
1. Press Tab repeatedly
2. Verify focus moves through elements
3. Verify focus indicators are visible
4. Press Enter on "Create Palette"
5. Verify modal opens
6. Press Tab in modal
7. Verify focus stays in modal
8. Press Escape
9. Verify modal closes
10. Verify focus returns to button

#### 8. Error Handling
```
✓ Invalid color input shows error
✓ Network errors show message
✓ User can retry failed operations
✓ Errors don't crash the app
```

**Test Steps:**
1. Enter invalid hex color "zzz"
2. Verify error message shows
3. Enter valid color
4. Verify error clears
5. Simulate network error
6. Verify error banner shows
7. Click "Retry" button
8. Verify operation retries

### Manual Testing Checklist

#### Visual Testing
- [ ] All colors render correctly
- [ ] Contrast ratios are accurate
- [ ] Typography is consistent
- [ ] Spacing is uniform
- [ ] Icons are properly sized
- [ ] Animations are smooth
- [ ] No layout shifts
- [ ] Responsive design works

#### Functional Testing
- [ ] All buttons work
- [ ] All inputs accept data
- [ ] All dropdowns open
- [ ] All modals open/close
- [ ] All tooltips appear
- [ ] All exports work
- [ ] All imports work
- [ ] All searches work

#### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

#### Accessibility Testing
- [ ] Keyboard navigation
- [ ] Screen reader (NVDA/JAWS/VoiceOver)
- [ ] Color contrast
- [ ] Focus indicators
- [ ] ARIA labels
- [ ] Form validation
- [ ] Error messages
- [ ] Loading states

#### Performance Testing
- [ ] Initial load < 2s
- [ ] Smooth scrolling (60fps)
- [ ] No memory leaks
- [ ] Bundle size < 800KB
- [ ] Lighthouse score > 90
- [ ] No console errors

## Unit Testing

### Example Unit Tests

```typescript
// colorUtils.test.ts
describe('getContrastRatio', () => {
  it('should calculate correct contrast ratio', () => {
    const ratio = getContrastRatio('#000000', '#FFFFFF');
    expect(ratio).toBe(21);
  });

  it('should handle invalid colors', () => {
    const ratio = getContrastRatio('invalid', '#FFFFFF');
    expect(ratio).toBe(1);
  });
});

// paletteStore.test.ts
describe('usePaletteStore', () => {
  it('should create a new palette', () => {
    const { createPalette, palettes } = usePaletteStore.getState();
    createPalette('Test Palette');
    expect(palettes).toHaveLength(1);
    expect(palettes[0].name).toBe('Test Palette');
  });

  it('should update palette step', () => {
    const { updatePaletteStep, palettes } = usePaletteStore.getState();
    const paletteId = palettes[0].id;
    updatePaletteStep(paletteId, 600, '#3B82F6');
    expect(palettes[0].steps[600]).toBe('#3B82F6');
  });
});
```

## Integration Testing

### Example Integration Tests

```typescript
// ColorApp.test.tsx
describe('ColorApp Integration', () => {
  it('should render sidebar and main content', () => {
    render(<ColorApp />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should create and display palette', async () => {
    render(<ColorApp />);
    
    // Click create button
    const createButton = screen.getByLabelText('Create Palette');
    fireEvent.click(createButton);
    
    // Fill form
    const nameInput = screen.getByLabelText('Palette Name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    // Submit
    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);
    
    // Verify palette appears
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });
});
```

## Test Data

### Sample Palettes

```json
{
  "testPalette": {
    "name": "Test Palette",
    "steps": {
      "200": "#0A0A0A",
      "300": "#1A1A1A",
      "400": "#2A2A2A",
      "500": "#3A3A3A",
      "600": "#3B82F6",
      "700": "#60A5FA",
      "800": "#93C5FD",
      "900": "#BFDBFE",
      "1000": "#DBEAFE"
    },
    "primaryStep": 600
  }
}
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
      - run: npm run size
```

## Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test ColorSwatch.test.tsx

# Update snapshots
npm test -- -u
```

## Debugging Tests

### VS Code Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Chrome DevTools

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Maintenance

### Regular Tasks
- [ ] Update test data monthly
- [ ] Review and update E2E scenarios
- [ ] Check for flaky tests
- [ ] Update browser versions
- [ ] Review coverage reports
- [ ] Update testing documentation

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [E2E Testing Guide](https://martinfowler.com/articles/practical-test-pyramid.html)
