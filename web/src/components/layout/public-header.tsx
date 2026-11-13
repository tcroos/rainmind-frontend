import Link from "next/link";
import type { ReactNode } from "react";

import { SiteLogo } from "@/components/layout/site-logo";
import { cn } from "@/lib/utils";

/**
 * 公开页面统一顶栏（作品广场 / 创作者主页 / 作品分享）。
 * 之前三个页面各自写了一份几乎相同的 header，宽度和配色还各不相同：
 * 一个用 max-w-7xl、一个 max-w-[1600px]、一个把手写色值写死在 className 里。
 * 收在这里，宽度用 `maxWidthClass` 控制，右侧操作区走 children。
 */
export function PublicHeader({
    siteTitle,
    logoUrl,
    maxWidthClass = "max-w-[1600px]",
    children,
}: {
    siteTitle: string;
    logoUrl?: string | null;
    maxWidthClass?: string;
    children?: ReactNode;
}) {
    return (
        <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
            <div className={cn("mx-auto flex h-14 w-full items-center justify-between gap-3 px-3 sm:h-16 sm:px-6", maxWidthClass)}>
                <Link href="/" className="flex min-w-0 items-center gap-2.5 text-foreground" aria-label={siteTitle}>
                    <SiteLogo logoUrl={logoUrl || "/logo.svg"} className="size-7 sm:size-8" />
                    <span className="truncate text-sm font-semibold sm:text-base">{siteTitle}</span>
                </Link>
                {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
            </div>
        </header>
    );
}

/** 顶栏里的次级跳转按钮，三个公开页共用同一个尺寸与悬停态。 */
export function PublicHeaderLink({ href, children }: { href: string; children: ReactNode }) {
    return (
        <Link href={href} className="inline-flex h-9 items-center rounded-md px-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground">
            {children}
        </Link>
    );
}
