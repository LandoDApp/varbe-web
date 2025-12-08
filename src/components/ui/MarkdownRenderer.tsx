"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
    return (
        <div className={`prose prose-lg max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                h1: ({ children }) => (
                    <h1 className="text-4xl md:text-5xl font-heading mt-8 mb-6 uppercase tracking-wide">
                        {children}
                    </h1>
                ),
                h2: ({ children }) => (
                    <h2 className="text-3xl md:text-4xl font-heading mt-8 mb-4 uppercase tracking-wide border-b-4 border-accent pb-2">
                        {children}
                    </h2>
                ),
                h3: ({ children }) => (
                    <h3 className="text-2xl md:text-3xl font-heading mt-6 mb-3 uppercase">
                        {children}
                    </h3>
                ),
                h4: ({ children }) => (
                    <h4 className="text-xl md:text-2xl font-heading mt-4 mb-2 uppercase">
                        {children}
                    </h4>
                ),
                p: ({ children }) => (
                    <p className="mb-4 font-body text-lg leading-relaxed text-gray-800">
                        {children}
                    </p>
                ),
                ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-2 font-body text-lg">
                        {children}
                    </ul>
                ),
                ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-2 font-body text-lg">
                        {children}
                    </ol>
                ),
                li: ({ children }) => (
                    <li className="mb-2 text-gray-800">{children}</li>
                ),
                strong: ({ children }) => (
                    <strong className="font-bold text-black">{children}</strong>
                ),
                em: ({ children }) => (
                    <em className="italic">{children}</em>
                ),
                blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-accent bg-accent/10 pl-4 py-2 my-4 italic font-body">
                        {children}
                    </blockquote>
                ),
                code: ({ className, children, ...props }) => {
                    const isInline = !className;
                    if (isInline) {
                        return (
                            <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm border border-gray-200">
                                {children}
                            </code>
                        );
                    }
                    return (
                        <code className={`block bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4 ${className}`} {...props}>
                            {children}
                        </code>
                    );
                },
                pre: ({ children }) => (
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto font-mono text-sm my-4 border-4 border-black">
                        {children}
                    </pre>
                ),
                a: ({ href, children }) => (
                    <a 
                        href={href} 
                        className="text-black underline decoration-accent decoration-2 underline-offset-2 hover:decoration-4 transition-all"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                    >
                        {children}
                    </a>
                ),
                img: ({ src, alt }) => (
                    <figure className="my-6">
                        <img 
                            src={src} 
                            alt={alt || ''} 
                            className="w-full rounded-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                        {alt && (
                            <figcaption className="text-center text-gray-600 mt-2 font-body text-sm italic">
                                {alt}
                            </figcaption>
                        )}
                    </figure>
                ),
                hr: () => (
                    <hr className="my-8 border-t-4 border-black" />
                ),
                table: ({ children }) => (
                    <div className="overflow-x-auto my-4">
                        <table className="w-full border-4 border-black">
                            {children}
                        </table>
                    </div>
                ),
                th: ({ children }) => (
                    <th className="bg-accent border-2 border-black px-4 py-2 text-left font-heading uppercase">
                        {children}
                    </th>
                ),
                td: ({ children }) => (
                    <td className="border-2 border-black px-4 py-2 font-body">
                        {children}
                    </td>
                ),
            }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}

