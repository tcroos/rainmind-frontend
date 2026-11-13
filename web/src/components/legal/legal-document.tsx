import { ArrowLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type LegalHighlight = { title: string; body: string; icon: LucideIcon };
export type LegalSection = { title: string; paragraphs: readonly string[] };
export type LegalNote = { icon: LucideIcon; text: string };

const legalNav = [
    { href: "/privacy", label: "隐私政策" },
    { href: "/terms", label: "服务条款" },
];

/**
 * 隐私政策 / 服务条款共用的文档版式。
 * 这两页原来是各写一份、各配一套强调色（一个 emerald、一个 cyan），
 * 头部还有一条纯黑通栏，跟站内其他公开页不是一个产品。
 * 现在统一成「白底 + 中性灰 + 阅读宽度 768px」的文档版式。
 */
export function LegalDocument({
    kicker,
    title,
    description,
    updatedAt,
    currentPath,
    highlights,
    sections,
    notes,
}: {
    kicker: string;
    title: string;
    description: string;
    updatedAt: string;
    currentPath: string;
    highlights: readonly LegalHighlight[];
    sections: readonly LegalSection[];
    notes: readonly LegalNote[];
}) {
    return (
        <main className="app-scroll-page bg-background text-foreground">
            <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-5 sm:px-8 sm:pt-8">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href="/"
                        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        返回首页
                    </Link>
                    <nav className="flex items-center gap-1 text-sm" aria-label="站点条款">
                        {legalNav.map((item, index) => (
                            <span key={item.href} className="flex items-center gap-1">
                                {index > 0 ? (
                                    <span aria-hidden="true" className="text-muted-foreground/40">
                                        /
                                    </span>
                                ) : null}
                                <Link
                                    href={item.href}
                                    aria-current={currentPath === item.href ? "page" : undefined}
                                    className={cn(
                                        "inline-flex h-9 items-center rounded-md px-2.5 font-medium transition",
                                        currentPath === item.href
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    )}
                                >
                                    {item.label}
                                </Link>
                            </span>
                        ))}
                    </nav>
                </div>

                <header className="pt-10 sm:pt-14">
                    <p className="text-xs font-medium text-muted-foreground">{kicker}</p>
                    <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{title}</h1>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-[15px]">{description}</p>
                    <p className="mt-5 text-xs text-muted-foreground">生效及最近更新：{updatedAt}</p>
                </header>

                <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
                    {highlights.map(({ title: highlightTitle, body, icon: Icon }) => (
                        <section key={highlightTitle} className="flex gap-3 rounded-lg border border-border bg-card p-3.5 sm:block sm:p-4">
                            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <div className="min-w-0">
                                <h2 className="text-sm font-semibold">{highlightTitle}</h2>
                                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{body}</p>
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-4 divide-y divide-border border-t border-border">
                    {sections.map((section, index) => (
                        <section key={section.title} className="grid gap-2 py-7 sm:grid-cols-[40px_minmax(0,1fr)] sm:gap-4">
                            <span className="text-xs font-medium tabular-nums text-muted-foreground sm:pt-1">{String(index + 1).padStart(2, "0")}</span>
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold sm:text-lg">{section.title}</h2>
                                <div className="mt-2.5 space-y-3 text-sm leading-7 text-muted-foreground">
                                    {section.paragraphs.map((paragraph) => (
                                        <p key={paragraph}>{paragraph}</p>
                                    ))}
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <footer className="mt-6 grid gap-3 border-t border-border pt-6 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
                    {notes.map(({ icon: Icon, text }) => (
                        <span key={text} className="flex items-start gap-2">
                            <Icon className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                            {text}
                        </span>
                    ))}
                </footer>
            </div>
        </main>
    );
}
