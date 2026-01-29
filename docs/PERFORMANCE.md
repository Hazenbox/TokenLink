# Performance Guidelines - VarCar Color System

## Performance Targets

### Bundle Size
- **Total Bundle**: < 800KB (gzipped)
- **UI Bundle**: < 600KB (gzipped)
- **Color System**: < 400KB (gzipped)

### Load Time
- **Initial Load**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **First Contentful Paint**: < 1 second

### Runtime Performance
- **Component Render**: < 16ms (60fps)
- **Color Generation**: < 100ms per palette
- **Search/Filter**: < 50ms
- **Memory Usage**: < 50MB

## Optimization Strategies

### 1. Code Splitting

```typescript
// Lazy load heavy components
const SurfaceStacking = React.lazy(() => import('./components/colors/SurfaceStacking'));
const HowItWorks = React.lazy(() => import('./components/HowItWorks'));

// Use with Suspense
<Suspense fallback={<LoadingState />}>
  <SurfaceStacking />
</Suspense>
```

### 2. Memoization

```typescript
// Memoize expensive calculations
const generatedScales = useMemo(() => {
  return generateColorScales(palette);
}, [palette]);

// Memoize callbacks
const handleColorChange = useCallback((color: string) => {
  updatePalette(color);
}, [updatePalette]);

// Memoize components
const ColorSwatch = React.memo(({ color, label }) => {
  return <div style={{ backgroundColor: color }}>{label}</div>;
});
```

### 3. Virtual Scrolling

For large lists (> 100 items):

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 50,
});
```

### 4. Debouncing & Throttling

```typescript
// Debounce search input
const debouncedSearch = debounce((query: string) => {
  searchPalettes(query);
}, 300);

// Throttle scroll events
const throttledScroll = throttle(() => {
  handleScroll();
}, 100);
```

### 5. Image Optimization

- Use WebP format with fallbacks
- Lazy load images below the fold
- Use appropriate image sizes (no oversized images)

### 6. CSS Optimization

```css
/* Use CSS containment for performance */
.palette-card {
  contain: layout style paint;
}

/* Use will-change sparingly */
.animated-element {
  will-change: transform;
}

/* Avoid expensive properties */
/* Bad: */
.element {
  box-shadow: 0 0 50px rgba(0,0,0,0.5);
  filter: blur(10px);
}

/* Good: */
.element {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
```

## Performance Monitoring

### Development Tools

```typescript
import { performanceMonitor } from '@/ui/utils/performance';

// Start monitoring
performanceMonitor.start('palette-generation');

// ... perform operation ...

// End monitoring
const duration = performanceMonitor.end('palette-generation');

// Log summary
performanceMonitor.logSummary();
```

### React DevTools Profiler

1. Open React DevTools
2. Go to Profiler tab
3. Click "Record"
4. Perform actions
5. Click "Stop"
6. Analyze flame graph

### Chrome DevTools

#### Performance Tab
1. Open DevTools (F12)
2. Go to Performance tab
3. Click "Record"
4. Perform actions
5. Click "Stop"
6. Analyze timeline

#### Memory Tab
1. Take heap snapshot
2. Perform actions
3. Take another snapshot
4. Compare snapshots
5. Identify memory leaks

### Lighthouse Audit

```bash
# Run Lighthouse
npm run lighthouse

# Or use Chrome DevTools
# 1. Open DevTools
# 2. Go to Lighthouse tab
# 3. Click "Generate report"
```

## Bundle Analysis

### Analyze Bundle Size

```bash
# Install size-limit
npm install --save-dev size-limit @size-limit/file

# Run analysis
npm run size

# Visualize bundle
npm run analyze
```

### Vite Bundle Analyzer

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

## Common Performance Issues

### 1. Unnecessary Re-renders

**Problem**: Component re-renders when props haven't changed

**Solution**:
```typescript
// Use React.memo
export const ColorSwatch = React.memo(({ color }) => {
  return <div style={{ backgroundColor: color }} />;
});

// Use useMemo for expensive calculations
const sortedPalettes = useMemo(() => {
  return palettes.sort((a, b) => a.name.localeCompare(b.name));
}, [palettes]);
```

### 2. Large Bundle Size

**Problem**: Bundle exceeds size limit

**Solution**:
- Code split heavy components
- Use dynamic imports
- Remove unused dependencies
- Tree-shake libraries

### 3. Slow Color Generation

**Problem**: Generating color scales takes too long

**Solution**:
- Cache generated scales
- Use Web Workers for heavy calculations
- Optimize color algorithms

### 4. Memory Leaks

**Problem**: Memory usage grows over time

**Solution**:
```typescript
useEffect(() => {
  const subscription = observable.subscribe();
  
  // Cleanup
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## Performance Checklist

### Before Release

- [ ] Bundle size < 800KB
- [ ] Load time < 2 seconds
- [ ] No memory leaks
- [ ] All images optimized
- [ ] Code split implemented
- [ ] Memoization applied
- [ ] Lighthouse score > 90
- [ ] No console errors/warnings
- [ ] Tested on slow 3G network
- [ ] Tested on low-end devices

### Continuous Monitoring

- [ ] Set up bundle size monitoring
- [ ] Track Core Web Vitals
- [ ] Monitor error rates
- [ ] Track user metrics
- [ ] Set up performance budgets

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

## Reporting Issues

If you discover a performance issue:
1. Describe the issue
2. Provide steps to reproduce
3. Include performance metrics
4. Attach profiler screenshots
5. Suggest potential solutions
