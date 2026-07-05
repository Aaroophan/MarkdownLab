# MarkdownLab

A fully client-side markdown editor with live preview, mermaid diagrams, code highlighting, multi-document support, and shareable URL-based document links.

## Features

### Core Editor
- **CodeMirror Editor** - Advanced syntax highlighting and editing
- **Live Markdown Preview** - Real-time rendering as you type
- **Mermaid Diagrams** - Create flowcharts, sequence diagrams, and more
- **Code Highlighting** - Syntax highlighting for 100+ languages
- **Dark/Light Themes** - System preference detection and manual toggle

### Document Management
- **Multi-Document Support** - Create, rename, and delete documents
- **Auto-Save** - Automatic localStorage persistence
- **Import/Export** - Import .md files, export to .md/.html/.pdf/.docx
- **Document Status** - Track save state with visual indicators

### Advanced Features
- **Sync Scroll** - Synchronized editor/preview scrolling
- **Preview-Only Mode** - Full-screen markdown viewing
- **Split View** - Side-by-side editor and preview
- **Responsive Layout** - Adapts to desktop and smaller screens
- **Command Palette** - VS Code-style keyboard command search (Ctrl+K)
- **Keyboard Shortcuts** - Ctrl+S to save, Ctrl+N for new doc, more
- **Table Generator** - Create markdown tables with live preview
- **Insert Elements** - Quick insert buttons for formatting

### Sharing
- **URL-Based Sharing** - Compress document data into shareable URL hash
- **Web Crypto Encryption** - AES-GCM encryption using browser APIs
- **Auto-Detection** - Opens shared documents automatically on link
- **Large File Handling** - Offers download for documents too big for URL

## Architecture

### 100% Client-Side
- No backend server
- No API routes
- No authentication needed
- Works entirely in the browser
- Compatible with GitHub Pages static hosting

### Technologies
- **Framework**: Next.js 16 with App Router
- **Editor**: CodeMirror 6
- **Markdown Renderer**: unified/remark stack
- **Diagrams**: Mermaid
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **Export**: jsPDF, html2canvas, docx
- **Compression**: lz-string
- **Crypto**: Web Crypto API (AES-GCM)

### Project Structure
```
src/
├── app/              # Next.js app directory
├── components/       # React components
│   ├── layout/      # Layout components (toolbar, sidebar, etc)
│   ├── modals/      # Modals (share, export, etc)
│   ├── ui/          # UI components (button, toast, etc)
│   └── commands/    # Command palette
├── features/        # Feature modules
│   ├── documents/   # Document store & types
│   ├── editor/      # Editor utilities
│   ├── export/      # Export service (md, html, pdf, docx)
│   ├── share/       # Share system (compression, crypto, url)
│   ├── markdown/    # Markdown processing
│   └── ui/          # UI utilities
└── lib/             # Utilities
```

## Getting Started

### Installation

```bash
# Clone and install dependencies
git clone https://github.com/aaroophan/MarkdownLab
cd MarkdownLab
npm install

# Or with pnpm
pnpm install
```

### Development

```bash
# Start dev server
npm run dev

# Open http://localhost:3000/MarkdownLab/
```

### Build for Production

```bash
# Build static export
npm run build

# Output in ./out directory
# Ready for GitHub Pages or any static host
```

## Static Export for GitHub Pages

This project uses Next.js static export (`output: 'export'`) configured for GitHub Pages:

### next.config.mjs
```js
{
  output: 'export',
  basePath: '/MarkdownLab',
  assetPrefix: '/MarkdownLab/',
  trailingSlash: true,
  images: { unoptimized: true }
}
```

### Deployment with GitHub Actions

The project includes automated GitHub Pages deployment via `.github/workflows/deploy.yml`:

1. **Trigger**: Runs on push to main or manual workflow dispatch
2. **Build**: Compiles Next.js to static HTML/CSS/JS in `./out`
3. **Deploy**: Uploads to GitHub Pages automatically

**URL**: https://aaroophan.github.io/MarkdownLab

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy ./out to GitHub Pages
# Via GitHub UI -> Settings -> Pages -> Deploy from a branch (main/gh-pages)
```

## User Guide

### Creating Documents
1. Click **"New Document"** in the sidebar or press Ctrl+N
2. Start typing markdown in the editor
3. Watch live preview update in real-time

### Editing
- **Format text** using the Insert menu or keyboard shortcuts
- **View source** in editor, **preview** on the right
- **Preview-only mode** (Ctrl+Shift+P) hides editor for clean reading
- **Sync scroll** toggle keeps editor and preview aligned

### Exporting
1. Click **More Options (...)** menu
2. Select export format:
   - **Markdown** - Save as .md file
   - **HTML** - Standalone webpage with embedded CSS
   - **PDF** - Professional document with page breaking
   - **DOCX** - Microsoft Word document

### Sharing
1. Click **More Options (...) → Share Document**
2. App creates compressed encrypted URL with document data
3. Share link automatically copied to clipboard
4. Anyone with link can open document as new file

**Security Note**: Since there's no password, anyone with the link can view/edit the document. This is URL-based sharing, not end-to-end encrypted messaging.

### Large Documents
Documents >3000 characters in compressed form cannot be shared via URL:
- **Option 1**: Download as Markdown for email/messaging
- **Option 2**: Export as HTML for standalone sharing
- **Option 3**: Use smaller documents for URL sharing

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+K | Open Command Palette |
| Ctrl+N | New Document |
| Ctrl+S | Save Document |
| Ctrl+Shift+P | Toggle Preview-Only Mode |
| Escape | Close Modals |

## Known Limitations

1. **Storage**: Limited by browser localStorage (~5-10MB depending on browser)
2. **URL Sharing**: Large documents won't fit in URL (max ~3KB when compressed)
3. **Browser Compatibility**: Requires modern browser with:
   - ES2020 support
   - Web Crypto API
   - localStorage
4. **Offline**: Works offline after initial load (no CDN fallback needed)
5. **Export Quality**: PDF generation is canvas-based (some formatting limitations)

## Roadmap

### Potential Features
- [ ] Cloud sync (optional, with settings)
- [ ] Collaborative editing
- [ ] Custom CSS themes
- [ ] Plugin system for markdown extensions
- [ ] Better PDF styling
- [ ] Publishing to static blog
- [ ] Revision history
- [ ] Fullscreen focus mode

### Completed Phases
- ✅ Phase 1: Core editor with CodeMirror and live preview
- ✅ Phase 2: Multi-document management and localStorage
- ✅ Phase 3: Power-user UX (command palette, shortcuts, sync scroll)
- ✅ Phase 4: Export system (.md, .html, .pdf, .docx)
- ✅ Phase 5: Share system and GitHub Pages deployment

## Contributing

This is a reference implementation. Feel free to:
- Fork and customize for your needs
- Extract patterns for your own projects
- Submit issues and PRs

## License

MIT - Use freely, modify as needed, attribution appreciated.

## Technical Notes

### Why Client-Side Only?
- **No server costs** - Runs on GitHub Pages for free
- **Privacy** - All data stays in your browser
- **Reliability** - No backend to maintain or monitor
- **Speed** - No network latency for basic operations
- **Simplicity** - Single static export, no build complexity

### Architecture Decisions

**Zustand for State**: Simple, lightweight store without boilerplate
**Remark/Unified**: Composable markdown processing pipeline
**Tailwind CSS**: Utility-first for rapid styling
**CodeMirror 6**: Headless editor with great extensibility
**Web Crypto**: Built-in browser APIs, no external crypto libs

### Performance
- Lazy-load mermaid diagrams (only renders visible)
- Debounce markdown parsing (500ms wait after typing)
- Virtual scrolling for large documents
- Code splitting via Next.js
- Static export for instant page loads

## Support

Issues? Questions? Check:
1. Browser console for errors (F12)
2. GitHub Issues on repository
3. Disable extensions that might interfere

---

**MarkdownLab** - A modern markdown editor for the modern web.
