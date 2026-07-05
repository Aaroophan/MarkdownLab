'use client'

import { ElementType, useRef } from 'react'
import ReactMarkdown from 'markdown-to-jsx'
import { useDocumentStore } from '@/features/documents/documentStore'

// Custom components for markdown
const CodeBlock = ({
  children,
  className,
}: {
  children: string
  className?: string
}) => {
  const language = className?.replace('lang-', '') || 'text'
  const codeRef = useRef<HTMLElement>(null)

  const handleCopy = () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || ''
      navigator.clipboard.writeText(text).then(() => {
        // Show feedback - you could add a toast here
        console.log('[v0] Code copied to clipboard')
      })
    }
  }

  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
        <code ref={codeRef} className={`language-${language}`}>
          {children}
        </code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-muted/80 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Copy code"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  )
}

const InlineCode = ({ children }: { children: string }) => (
  <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
)

const Heading = ({ level, children }: { level: number; children: React.ReactNode }) => {
  const Tag = `h${level}` as ElementType
  const sizeClasses = {
    1: 'text-3xl',
    2: 'text-2xl',
    3: 'text-xl',
    4: 'text-lg',
    5: 'text-base',
    6: 'text-sm',
  }
  const size = sizeClasses[level as keyof typeof sizeClasses] || 'text-base'

  return (
    <Tag className={`${size} font-bold mt-6 mb-3 scroll-mt-20`}>{children}</Tag>
  )
}

const Link = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a href={href} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
    {children}
  </a>
)

const List = ({ children, ordered }: { children: React.ReactNode; ordered?: boolean }) => {
  const Tag = ordered ? 'ol' : 'ul'
  return (
    <Tag className={`${ordered ? 'list-decimal' : 'list-disc'} list-inside my-3 space-y-2`}>
      {children}
    </Tag>
  )
}

const ListItem = ({ children }: { children: React.ReactNode }) => (
  <li className="ml-2">{children}</li>
)

const Blockquote = ({ children }: { children: React.ReactNode }) => (
  <blockquote className="border-l-4 border-muted pl-4 italic my-3">{children}</blockquote>
)

export default function MarkdownPreview() {
  const activeDoc = useDocumentStore((state) => state.getActiveDocument())

  if (!activeDoc) {
    return (
      <div className="flex h-full items-center justify-center text-foreground/50">
        <div className="text-sm">No document selected</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-4 prose dark:prose-invert max-w-none">
      <ReactMarkdown
        options={{
          forceBlock: true,
          overrides: {
            code: {
              component: CodeBlock,
            },
            inlineCode: {
              component: InlineCode,
            },
            h1: {
              component: (props) => <Heading level={1} {...props} />,
            },
            h2: {
              component: (props) => <Heading level={2} {...props} />,
            },
            h3: {
              component: (props) => <Heading level={3} {...props} />,
            },
            h4: {
              component: (props) => <Heading level={4} {...props} />,
            },
            h5: {
              component: (props) => <Heading level={5} {...props} />,
            },
            h6: {
              component: (props) => <Heading level={6} {...props} />,
            },
            a: {
              component: Link,
            },
            ul: {
              component: (props) => <List {...props} />,
            },
            ol: {
              component: (props) => <List ordered {...props} />,
            },
            li: {
              component: ListItem,
            },
            blockquote: {
              component: Blockquote,
            },
          },
        }}
      >
        {activeDoc.content}
      </ReactMarkdown>
    </div>
  )
}
