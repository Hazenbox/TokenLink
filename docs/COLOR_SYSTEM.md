# VarCar Color System

A comprehensive color palette management system for Figma, featuring WCAG-compliant color scale generation, surface stacking visualization, and seamless Figma integration.

## Features

### 🎨 Color Scale Generation
- **8-Scale System**: Surface, High, Medium, Low, Heavy, Bold, Bold A11Y, Minimal
- **WCAG Compliance**: Automatic contrast ratio calculation with AA/AAA indicators
- **Alpha Blending**: Intelligent transparency calculations for optimal contrast
- **Real-time Preview**: See generated scales instantly as you edit

### 📊 Surface Stacking
- **Interactive Visualization**: Preview colors in realistic UI contexts
- **Light & Dark Modes**: See how colors work in both themes
- **Multiple Variants**: Ghost, Minimal, Subtle, Bold button styles
- **State Preview**: Idle, Hover, Pressed, and Focus states

### 🔄 Import/Export
- **Multiple Formats**: JSON, CSS Variables, Plain Text
- **Figma Integration**: Copy as SVG for direct paste into Figma
- **Batch Operations**: Export multiple palettes at once
- **Version Control**: JSON format perfect for Git workflows

### ♿ Accessibility
- **WCAG 2.1 Level AA**: Full compliance with accessibility standards
- **Keyboard Navigation**: Complete keyboard support
- **Screen Reader**: Comprehensive ARIA labels and live regions
- **Focus Management**: Proper focus trapping and indicators

### ⚡ Performance
- **Bundle Size**: < 800KB total
- **Load Time**: < 2 seconds initial load
- **60fps**: Smooth animations and interactions
- **Memory Efficient**: < 50MB memory usage

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/varcar.git

# Navigate to project
cd varcar/VarCar

# Install dependencies
npm install

# Start development server
npm run dev
```

### Building for Production

```bash
# Build the plugin
npm run build

# The output will be in the dist/ directory
```

### Running in Figma

1. Open Figma Desktop App
2. Go to Plugins → Development → Import plugin from manifest
3. Select the `manifest.json` file
4. Run the plugin from Plugins → Development → VarCar Color System

## Usage

### Creating a Palette

1. Click the **+** button in the sidebar
2. Enter a palette name
3. Click **Create Palette**
4. Start adding colors to steps (200-2500)

### Editing Colors

1. Select a palette from the sidebar
2. Click on any step number (200-2500)
3. Use the color picker or enter a hex value
4. See generated scales update in real-time

### Viewing Scales

**Grid View**: See all scales in a compact grid
**List View**: See detailed information for each scale

Toggle between views using the grid/list icon.

### Exporting

1. Select a palette
2. Click the **Download** button
3. Choose format:
   - **JSON**: For version control and sharing
   - **CSS Variables**: For direct use in stylesheets
   - **Text**: For documentation
   - **Copy for Figma**: SVG format for Figma paste

### Surface Stacking

1. Select a palette
2. Click the **Stacking** button
3. View colors in realistic UI contexts
4. Toggle **Show Focus** to see focus states
5. Change **Base Color** to see different combinations

## Project Structure

```
VarCar/
├── src/
│   ├── lib/
│   │   ├── color/
│   │   │   └── colorUtils.ts       # Color utilities
│   │   ├── stores/
│   │   │   └── paletteStore.ts     # State management
│   │   └── utils.ts
│   └── ui/
│       ├── components/
│       │   ├── colors/             # Color components
│       │   ├── theme/              # Theme system
│       │   ├── LoadingState.tsx
│       │   ├── ErrorState.tsx
│       │   └── EmptyState.tsx
│       ├── hooks/
│       │   └── useKeyboardNavigation.ts
│       ├── utils/
│       │   └── performance.ts
│       └── ColorApp.tsx            # Main app
├── ACCESSIBILITY.md                # A11y guidelines
├── PERFORMANCE.md                  # Performance guide
├── TESTING.md                      # Testing guide
└── README_COLOR_SYSTEM.md         # This file
```

## Color Scale Logic

### Surface
The base background color for each step. All other scales are calculated relative to this surface.

### High (Maximum Contrast)
Uses the contrasting color at 100% opacity. Light surfaces use step 200 (darkest), dark surfaces use step 2500 (lightest).

### Medium (Moderate Contrast)
Uses the contrasting color with alpha midpoint between High (100%) and Low (4.5:1 contrast).

### Low (WCAG AA)
Uses the contrasting color with minimum alpha to achieve 4.5:1 contrast ratio.

### Bold (≥ 3.0:1)
Starts from the user-selected base step and moves toward contrasting color until achieving 3.0:1 contrast.

### Bold A11Y (≥ 4.5:1)
Starts from the base step and moves toward contrasting color until achieving 4.5:1 contrast (WCAG AA).

### Heavy (High Contrast)
- **Light surfaces**: Midpoint between Bold and step 200 (capped at 800)
- **Dark surfaces**: Same as Bold A11Y

### Minimal (Decorative)
- **Light surfaces**: Surface step - 200
- **Dark surfaces**: Surface step + 200

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts |
| `Escape` | Close modals/dialogs |
| `Tab` | Navigate forward |
| `Shift+Tab` | Navigate backward |
| `Enter` | Activate button/control |
| `Space` | Activate button/control |
| `/` | Focus search |
| `↑` / `↓` | Navigate list |

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Performance

### Bundle Size
- Total: < 800KB (gzipped)
- UI: < 600KB (gzipped)
- Color System: < 400KB (gzipped)

### Load Time
- Initial Load: < 2 seconds
- Time to Interactive: < 3 seconds
- First Contentful Paint: < 1 second

## Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation
- Screen reader support
- Focus management
- ARIA labels and roles
- Color contrast checking

See [ACCESSIBILITY.md](./ACCESSIBILITY.md) for details.

## Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

See [TESTING.md](./TESTING.md) for details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Ensure accessibility compliance
- Check bundle size impact
- Run linter before committing

## License

MIT License - see LICENSE file for details

## Credits

- **Original Design**: Rang De color system
- **Migration & Development**: VarCar team
- **Color Science**: Based on WCAG 2.1 guidelines

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/varcar/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/varcar/discussions)
- **Email**: support@varcar.dev

## Changelog

See [MIGRATION_COMPLETE.md](./MIGRATION_COMPLETE.md) for migration history.

### Recent Updates

- **v1.0.0** (2026-01-23)
  - Initial release
  - Complete Rang De migration
  - 15+ components migrated
  - Full WCAG AA compliance
  - Performance optimizations
  - Comprehensive documentation

## Roadmap

- [ ] Color harmony suggestions
- [ ] Palette templates
- [ ] Color blindness simulation
- [ ] Advanced export options
- [ ] Collaborative editing
- [ ] Plugin marketplace integration

---

**Made with ❤️ by the VarCar team**
