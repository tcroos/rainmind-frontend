import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

import { PublicHeader } from "@/components/layout/public-header";
import { listAnnouncementsPage } from "@/lib/auth/store";
import { getPublicSiteSettings } from "@/lib/server/site-metadata";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;
export async function generateMetadata(): Promise<Metadata> {
    const site = await getPublicSiteSettings();
    return {
        title: `网站公告 | ${site.title}`,
        description: `查看 ${site.title} 的站点通知、维护说明和功能更新。`,
        alternates: { canonical: "/announcements" },
        robots: { index: true, follow: true },
    };
}

export default async function AnnouncementsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
    const params = searchParams ? await searchParams : {};
    const page = positiveInteger(first(params.page), 1);
    const [announcementPage, site] = await Promise.all([listAnnouncementsPage(false, { page, pageSize: PAGE_SIZE }), getPublicSiteSettings()]);
    const totalPages = Math.max(1, Math.ceil(announcementPage.total / announcementPage.pageSize));

    return (
        <main className="app-scroll-page bg-background text-foreground">
            <PublicHeader siteTitle={site.title} logoUrl={site.logoUrl} maxWidthClass="max-w-3xl">
                <Link
                    href="/"
                    className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                    <ArrowLeft className="size-4" />
                    返回首页
                </Link>
            </PublicHeader>

            <div className="mx-auto w-full max-w-3xl px-5 pb-16 pt-8 sm:px-8 sm:pt-10">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">网站公告</h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">按发布时间展示站点通知、维护说明和功能提醒。</p>
                </header>

                {announcementPage.items.length ? (
                    <div className="mt-8 divide-y divide-border border-y border-border">
                        {announcementPage.items.map((announcement) => (
                            <article id={announcement.id} key={announcement.id} className="scroll-mt-24 py-6">
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                                    <h2 className="text-base font-semibold leading-6">{announcement.title}</h2>
                                    <time className="shrink-0 text-xs tabular-nums text-muted-foreground">{new Date(announcement.createdAt).toLocaleString("zh-CN")}</time>
                                </div>
                                <p className="mt-2.5 whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{announcement.content}</p>
                            </article>
                        ))}
                    </div>
                ) : (
                    <div className="mt-8 rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">暂无公告</div>
                )}

                {announcementPage.total > announcementPage.pageSize ? (
                    <nav className="mt-8 flex items-center justify-between gap-3 text-sm" aria-label="公告分页">
                        {page > 1 ? (
                            <Link
                                href={announcementPageHref(page - 1)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-foreground transition hover:bg-muted"
                            >
                                <ChevronLeft className="size-4" />
                                上一页
                            </Link>
                        ) : (
                            <span />
                        )}
                        <span className="text-xs tabular-nums text-muted-foreground">
                            第 {page} / {totalPages} 页
                        </span>
                        {page < totalPages ? (
                            <Link
                                href={announcementPageHref(page + 1)}
                                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-foreground transition hover:bg-muted"
                            >
                                下一页
                                <ChevronRight className="size-4" />
                            </Link>
                        ) : (
                            <span />
                        )}
                    </nav>
                ) : null}
            </div>
        </main>
    );
}

function first(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined, fallback: number) {
    const number = Number(value);
    return Number.isSafeInteger(number) && number > 0 ? number : fallback;
}

function announcementPageHref(page: number) {
    return page <= 1 ? "/announcements" : `/announcements?page=${page}`;
}
