"use client";

import { Link } from "@/i18n/routing";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center">
                        {index > 0 && (
                            <span className="mx-2 text-gray-500">/</span>
                        )}
                        {item.href && index < items.length - 1 ? (
                            <Link
                                href={item.href}
                                className="text-black hover:underline decoration-accent decoration-2 underline-offset-2 font-body"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className={`font-body ${index === items.length - 1 ? 'font-bold' : 'text-gray-600'}`}>
                                {item.label}
                            </span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}



