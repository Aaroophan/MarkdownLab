/**
 * Light theme CSS for exports (HTML, PDF, etc.)
 * Ensures exported documents look professional in light theme
 */
export const EXPORT_LIGHT_CSS = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #1f2937;
    background: white;
    padding: 2rem;
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: 700;
    line-height: 1.3;
    margin: 1.5rem 0 0.75rem 0;
  }

  h1 {
    font-size: 2em;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.75em;
    margin-top: 1.25rem;
  }

  h3 {
    font-size: 1.5em;
  }

  h4 {
    font-size: 1.25em;
  }

  h5, h6 {
    font-size: 1em;
  }

  p {
    margin: 0.75rem 0;
  }

  a {
    color: #2563eb;
    text-decoration: underline;
  }

  code {
    background: #f3f4f6;
    color: #1f2937;
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    overflow-x: auto;
    margin: 1rem 0;
  }

  pre code {
    background: none;
    padding: 0;
    border-radius: 0;
    color: #1f2937;
  }

  blockquote {
    border-left: 4px solid #d1d5db;
    padding-left: 1rem;
    margin: 1rem 0;
    color: #4b5563;
    font-style: italic;
  }

  ul, ol {
    margin: 1rem 0;
    padding-left: 2rem;
  }

  li {
    margin: 0.25rem 0;
  }

  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1rem 0;
  }

  th, td {
    border: 1px solid #d1d5db;
    padding: 0.75rem;
    text-align: left;
  }

  th {
    background: #f3f4f6;
    font-weight: 600;
    color: #1f2937;
  }

  tr:nth-child(even) {
    background: #fafafa;
  }

  img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
  }

  .task-list-item {
    list-style: none;
    margin: 0.5rem 0;
  }

  .task-list-item input {
    margin-right: 0.5rem;
    margin-left: -1.5rem;
  }

  .mermaid {
    display: flex;
    justify-content: center;
    margin: 1.5rem 0;
  }

  @media print {
    body {
      padding: 0;
    }

    pre {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    table {
      page-break-inside: avoid;
      break-inside: avoid;
    }
  }
`
