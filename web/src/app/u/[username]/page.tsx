import type { Metadata } from "next";
import { DatabaseZap } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { GalleryThemeToggle } from "@/app/gallery/gallery-theme-toggle";
import { PublicHeader, PublicHeaderLink } from "@/components/layout/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { absoluteSiteUrl, getPublicSiteSettings, siteMetadataBase } from "@/lib/server/site-metadata";
import { getPublicCreatorPage, getPublicCreatorProfile, WorkCommunityServiceError } from "@/lib/server/work-community-service";
import type { PublicCreatorPage } from "@/services/api/work-community";
import { PublicCreatorView } from "./public-creator-view";

type CreatorPageProps = { params: Promise<{ username: string }> };

const loadCreatorProfile = cache(async (username: string) => {
    try {
        return await getPublicCreatorProfile(username);
    } catch (error) {
        if (error instanceof WorkCommunityServiceError && error.status === 404) return null;
        if (isCommunityUnavailable(error)) return undefined;
        throw error;
    }
});

const loadCreatorPage = cache(async (username: string, viewerUserId: string) => {
    try {
        return (await getPublicCreatorPage(username, viewerUserId || undefined, { limit: 18 })) as PublicCreatorPage;
    } catch (error) {
        if (error instanceof WorkCommunityServiceError && error.status === 404) return null;
        if (isCommunityUnavailable(error)) return undefined;
        throw error;
    }
});

export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
    const { username } = await params;
    const [profile, site] = await Promise.all([loadCreatorProfile(username), getPublicSiteSettings()]);
    if (profile === undefined) return { title: `创作者主页暂不可用 | ${site.title}`, robots: { index: false, follow: false } };
    if (!profile) return { title: `创作者不存在 | ${site.title}`, robots: { index: false, follow: false } };
    const canonical = `/u/${encodeURIComponent(profile.username)}`;
    const title = `${profile.displayName || profile.username} (@${profile.username}) | ${site.title}`;
    const description = profile.bio || `查看 ${profile.displayName || profile.username} 发布的图片与视频作品。`;
    const image = absoluteSiteUrl(profile.avatarUrl || site.logoUrl || "/logo.svg", siteMetadataBase());
    return {
        metadataBase: siteMetadataBase(),
        title,
        description,
        alternates: { canonical },
        robots: { index: true, follow: true },
        openGraph: { type: "profile", title, description, siteName: site.title, url: canonical, images: [{ url: image, alt: profile.displayName || profile.username }], locale: "zh_CN" },
        twitter: { card: "summary", title, description, images: [image] },
    };
}

export default async function CreatorPage({ params }: CreatorPageProps) {
    const { username } = await params;
    const sitePromise = getPublicSiteSettings();
    const viewer = await getCurrentUser();
    const [site, data] = await Promise.all([sitePromise, loadCreatorPage(username, viewer?.id || "")]);
    if (data === null) notFound();

    return (
        <main className="app-scroll-page bg-background text-foreground">
            <PublicHeader siteTitle={site.title} logoUrl={site.logoUrl}>
                <PublicHeaderLink href="/gallery">作品广场</PublicHeaderLink>
                <GalleryThemeToggle />
            </PublicHeader>
            {data ? (
                <PublicCreatorView initialData={data} />
            ) : (
                <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center" aria-labelledby="creator-unavailable-title">
                    <span className="grid size-12 place-items-center rounded-full border border-border bg-muted text-muted-foreground" aria-hidden="true">
                        <DatabaseZap className="size-5" />
                    </span>
                    <h1 id="creator-unavailable-title" className="mt-4 text-xl font-semibold sm:text-2xl">
                        创作者主页暂不可用
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">站点数据还没有准备好，请稍后再打开这个主页。</p>
                    <Link href="/" className="mt-5 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-85">
                        返回首页
                    </Link>
                </section>
            )}
        </main>
    );
}

function isCommunityUnavailable(error: unknown) {
    return error instanceof WorkCommunityServiceError && error.status === 409 && error.message.includes("需要启用 PostgreSQL");
}
