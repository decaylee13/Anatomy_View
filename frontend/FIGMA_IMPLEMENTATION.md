# Figma Design Implementation

This directory contains the implementation of the Figma design (node `1:2898`) from the Fall2025 design file.

## What Was Implemented

### ✅ Components Created
- **`Window.jsx`** - Main Figma design component with the full UI layout
  - Navigation menubar (Home, Models, Upload, Support)
  - Search bar with filters
  - Model cards displaying "Human Brain" items
  - All styling matches Figma specifications using Tailwind CSS

- **`WindowPage.jsx`** - Standalone page wrapper for the Window component
  - Provides scrollable container for the design
  - Isolated from the main 3D heart viewer

- **`Root.jsx`** - View switcher component
  - Toggle between "3D Heart Viewer" and "Figma Design Preview"
  - Fixed position switcher in bottom-left corner
  - Preserves both views without unmounting

### 📦 Assets Added
All assets are **placeholder SVGs** in `frontend/public/figma-assets/`:
- `cube-logo.svg` - Learnability tab logo
- `search-icon.svg` - Search input icon
- `dropdown-icon.svg` - Category dropdown arrow
- `filter-icon.svg` - Filter button icon
- `heart-icon.svg` - Model card heart/favorite icon
- `checkmark-icon.svg` - Selected state checkmark
- `brain-placeholder.png` - Placeholder for brain model images

### 🎨 Design Fidelity
- ✅ Exact Tailwind classes from Figma export preserved
- ✅ Color variables maintained (`--snow`, `--darkblue`, `--black`, `--gray`, etc.)
- ✅ Positioning, sizing, and layout match Figma specs
- ✅ All `data-node-id` attributes preserved for reference
- ✅ Responsive to container size (1920x1080 design)

## How to View

### Option 1: Using the View Switcher (Recommended)
1. Start the frontend dev server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open http://localhost:5173
3. Click the **"Figma Design Preview"** button in the bottom-left corner
4. Toggle back to **"3D Heart Viewer"** anytime

### Option 2: Direct Component Import
Import the component directly in your own page:
```jsx
import WindowPage from './components/WindowPage';

function MyPage() {
  return <WindowPage />;
}
```

## File Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── Window.jsx          # Figma design component
│   │   └── WindowPage.jsx      # Page wrapper
│   ├── Root.jsx                # View switcher
│   ├── App.jsx                 # Original 3D heart viewer (unchanged)
│   └── main.jsx                # Entry point (updated to use Root)
└── public/
    └── figma-assets/           # Placeholder assets
        ├── cube-logo.svg
        ├── search-icon.svg
        ├── dropdown-icon.svg
        ├── filter-icon.svg
        ├── heart-icon.svg
        ├── checkmark-icon.svg
        └── brain-placeholder.png
```

## Replacing Placeholder Assets

To use actual Figma-exported assets:

1. Export images/SVGs from Figma dev mode
2. Place them in `frontend/public/figma-assets/` with matching names:
   - `brain-placeholder.png` → actual brain model image
   - `cube-logo.svg` → actual logo
   - etc.
3. Or update the asset paths in `Window.jsx` (lines 4-10)

## Integration Notes

### Figma MCP Connection Status
- **MCP endpoint configured**: `.vscode/mcp.json` points to `http://127.0.0.1:3845/mcp`
- **Design fetched successfully**: Node `1:2898` from `https://figma.com/design/MGUlga1XkXhttWIShNrmNv/Fall2025`
- **Asset server**: Figma expects assets at `http://localhost:3845/assets/*` (not yet implemented)
- **Backend**: Flask server on port 5001 for chat/tools (separate from Figma integration)

### Next Steps for Full Integration
If you want to serve Figma assets locally:
1. Create an MCP proxy on port 3845 that serves `/assets/*` and responds to `/mcp`
2. Download actual Figma assets and place in the served directory
3. Update asset paths in `Window.jsx` to match the proxy URLs

Or simply replace placeholder assets in `frontend/public/figma-assets/` and the design will work standalone.

## CSS Variables Used
The design references these CSS custom properties:
- `--snow: #fbffff` (light background)
- `--darksnow: #f0f4f4` (card background)
- `--darkblue: #171738` (navigation bar)
- `--lightblue: #27274c` (borders)
- `--black: #000501` (gradient end)
- `--gray: #686b7e` (placeholder text)
- `--color: #4c9ae7` (accent blue)

These are applied inline via Tailwind's arbitrary values (e.g., `bg-[var(--snow,#fbffff)]`).

## Original App Preserved
The existing 3D Heart Viewer (`App.jsx`) remains **completely unchanged** and accessible via the view switcher. Both views coexist without conflicts.

## Build Verification
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ All imports resolved
- ✅ Component structure validated

Ready to run and view!
