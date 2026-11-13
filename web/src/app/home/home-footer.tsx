"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Mail, Send } from "lucide-react";

import { SiteLogo } from "@/components/layout/site-logo";
import { HOME_NAVIGATION, type HomeNavigationItem } from "./home-data";
import { useHomeActions } from "./home-actions";
import { Reveal } from "./home-motion";
import styles from "./home.module.css";

export function HomeCta() {
    const { startCreating } = useHomeActions();
    return (
        <Reveal y={28}>
            <section className={styles.cta} aria-labelledby="home-cta-title">
                <div>
                    <h2 id="home-cta-title">先做一张，再决定要不要留下</h2>
                    <p>不用配模型，不用学提示词。写一句你想要什么，先看结果。</p>
                </div>
                <button type="button" onClick={() => startCreating()}>
                    免费开始 <ArrowRight aria-hidden="true" />
                </button>
            </section>
        </Reveal>
    );
}

export function HomeFooter() {
    const { site, openBillingPlans, openProtectedPath } = useHomeActions();
    const friendLinks = site.friendLinks.filter((item) => item.enabled && item.label.trim() && item.url.trim());
    const socials = Object.entries(site.socials).filter(([, item]) => item.enabled && item.label.trim() && item.url.trim());
    const copyright = site.footerCopyright?.trim();
    // 后台未配置外部协议地址时，回落到站内自带的 /privacy 与 /terms，
    // 否则这两页因为没有任何入口而完全不可达。
    const policies = [
        { label: "隐私政策", href: site.privacyUrl?.trim() || "/privacy" },
        { label: "服务条款", href: site.termsUrl?.trim() || "/terms" },
    ];
    const navigationGroups: Array<{ title: string; items: readonly HomeNavigationItem[] }> = [
        { title: "产品", items: HOME_NAVIGATION },
        { title: "平台", items: [{ label: "公告中心", href: "/announcements", action: "link" }] },
    ];

    return (
        <footer className={styles.footer}>
            <div className={styles.footerGrid}>
                <div className={styles.footerBrand}>
                    <Link href="/" className={styles.footerLogo}>
                        <SiteLogo logoUrl={site.logoUrl} className={styles.brandLogo} />
                        <span>{site.title}</span>
                    </Link>
                    {site.seoDescription?.trim() ? <p>{site.seoDescription}</p> : null}
                    {socials.length ? (
                        <div className={styles.footerSocials}>
                            {socials.map(([key, item]) => {
                                return (
                                    <a key={key} href={item.url} target={externalTarget(item.url)} rel={externalTarget(item.url) ? "noreferrer" : undefined} aria-label={item.label} title={item.label}>
                                        {socialIcon(key)}
                                    </a>
                                );
                            })}
                        </div>
                    ) : null}
                </div>

                <div className={styles.footerNavigation}>
                    {navigationGroups.map((group) => (
                        <FooterColumn key={group.title} title={group.title}>
                            {group.items.map((item) =>
                                item.action === "protected" ? (
                                    <button key={item.href} type="button" onClick={() => openProtectedPath(item.href)}>
                                        {item.label}
                                    </button>
                                ) : item.action === "billing" ? (
                                    <button key={item.href} type="button" onClick={openBillingPlans}>
                                        {item.label}
                                    </button>
                                ) : (
                                    <Link key={item.href} href={item.href}>
                                        {item.label}
                                    </Link>
                                ),
                            )}
                        </FooterColumn>
                    ))}
                    {friendLinks.length ? (
                        <FooterColumn title="友情链接">
                            {friendLinks.map((item) => (
                                <a key={item.id} href={item.url} target={externalTarget(item.url)} rel={externalTarget(item.url) ? "noreferrer" : undefined}>
                                    {item.label}
                                </a>
                            ))}
                        </FooterColumn>
                    ) : null}
                </div>
            </div>
            {copyright || policies.length ? (
                <div className={styles.footerBottom} data-testid="home-footer-bottom">
                    {copyright ? <span>{copyright}</span> : null}
                    {policies.length ? (
                        <div>
                            {policies.map((item) =>
                                item.href.startsWith("/") ? (
                                    <Link key={item.label} href={item.href}>
                                        {item.label}
                                    </Link>
                                ) : (
                                    <a key={item.label} href={item.href} target={externalTarget(item.href)} rel={externalTarget(item.href) ? "noreferrer" : undefined}>
                                        {item.label}
                                    </a>
                                ),
                            )}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </footer>
    );
}

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
    return (
        <nav className={styles.footerColumn} aria-label={title}>
            <h2>{title}</h2>
            {children}
        </nav>
    );
}

function externalTarget(url: string) {
    return /^(https?:)?\/\//.test(url) ? "_blank" : undefined;
}

function socialIcon(key: string) {
    if (key === "telegram") return <Send aria-hidden="true" />;
    if (key === "x") return <span aria-hidden="true">X</span>;
    if (key === "instagram") return <span aria-hidden="true">◎</span>;
    return <Mail aria-hidden="true" />;
}
