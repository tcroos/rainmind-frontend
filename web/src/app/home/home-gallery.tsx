"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "antd";
import { ArrowRight, ArrowUpRight, ImageOff, Play } from "lucide-react";
import { motion } from "motion/react";

import { LazyMediaImage } from "@/components/media/lazy-media-image";
import { imagePreviewUrl } from "@/lib/media-image-url";
import { listPublicGallery, type PublicGalleryItem } from "@/services/api/work-governance";
import { useHomeActions } from "./home-actions";
import { HOME_GALLERY_TABS, homeGalleryMatches, type HomeGalleryTab } from "./home-data";
import { Reveal, SectionHeading, SpotlightGrid } from "./home-motion";
import styles from "./home.module.css";

export function HomeGallery() {
    const [tab, setTab] = useState<HomeGalleryTab>("all");
    const [previewItem, setPreviewItem] = useState<PublicGalleryItem>();
    const query = useQuery({
        queryKey: ["home-public-gallery", "random"],
        queryFn: () => listPublicGallery({ limit: 18, sort: "random" }),
        staleTime: 60_000,
    });
    const items = (query.data?.items || []).filter((item) => homeGalleryMatches(item, tab));
    // 服务端一条公开作品都没有（或作品广场未启用数据库）时，整段换成「场景入口」：
    // 标题、分类栏、空态一起换，避免出现「作品标题 + 没有作品的分类栏 + 灰块」。
    const emptyAll = !query.isLoading && (query.data?.items?.length ?? 0) === 0;

    return (
        <section id="inspiration" className={styles.section} aria-labelledby="home-gallery-title">
            <SectionHeading
                id="home-gallery-title"
                index="02"
                label="创作者作品"
                title={emptyAll ? "从一个场景开始" : "看看别人做出来的"}
                subtitle={emptyAll ? "作品广场还在积累第一批作品。选一个创作场景，下一个出现在这里的就是你的。" : "点开看大图和完整视频，找到你想要的那种感觉"}
            />

            {emptyAll ? null : (
                <div className={styles.galleryTabs} role="tablist" aria-label="作品分类">
                    {HOME_GALLERY_TABS.map((item) => (
                        <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} aria-controls="home-gallery-panel" className={tab === item.id ? styles.galleryTabActive : undefined} onClick={() => setTab(item.id)}>
                            {/* 高亮胶囊用 layoutId 在按钮之间滑动，切换分类时是「移」过去的 */}
                            {tab === item.id ? <motion.span layoutId="home-gallery-pill" className={styles.galleryTabPill} transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
                            <span className={styles.galleryTabLabel}>{item.label}</span>
                        </button>
                    ))}
                </div>
            )}

            <div id="home-gallery-panel" role="tabpanel" className={styles.galleryPanel}>
                {query.isLoading ? (
                    <div className={styles.galleryGrid} aria-label="正在加载公开作品">
                        {Array.from({ length: 8 }, (_, index) => (
                            <GallerySkeleton key={index} />
                        ))}
                    </div>
                ) : items.length ? (
                    /* key 跟着分类走：切分类时整组重挂一次，卡片按序淡入，而不是硬切 */
                    <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.28 }}>
                        <SpotlightGrid className={styles.galleryGrid}>
                            {items.map((item, index) => (
                                <Reveal key={item.slug} delay={Math.min(index, 7) * 0.05} y={14}>
                                    <HomeWorkCard item={item} onPreview={() => setPreviewItem(item)} />
                                </Reveal>
                            ))}
                        </SpotlightGrid>
                    </motion.div>
                ) : (
                    /* 没有公开作品（或作品广场未启用数据库）时，不给一片灰骨架、也不给报错框：
                     * 换成可直接点进创作的场景入口，这一屏至少还有用。 */
                    <GalleryStarters />
                )}
            </div>

            {emptyAll ? null : (
                <div className={styles.galleryMore}>
                    <Link href="/gallery">
                        查看更多作品 <ArrowRight aria-hidden="true" />
                    </Link>
                </div>
            )}
            <HomeMediaPreview item={previewItem} onClose={() => setPreviewItem(undefined)} />
        </section>
    );
}

function HomeWorkCard({ item, onPreview }: { item: PublicGalleryItem; onPreview: () => void }) {
    const [mediaFailed, setMediaFailed] = useState(false);
    const [duration, setDuration] = useState(0);
    const preview = item.preview;

    return (
        <article className={styles.workCard} data-testid="home-gallery-card">
            <button type="button" className={styles.workMedia} aria-label={`查看作品：${item.title}`} onClick={onPreview}>
                {mediaFailed || !preview || (preview.mediaType !== "image" && preview.mediaType !== "video") ? (
                    <span className={styles.mediaFallback} role="img" aria-label="作品预览不可用">
                        <ImageOff aria-hidden="true" />
                        <span>预览不可用</span>
                    </span>
                ) : preview.mediaType === "image" ? (
                    <LazyMediaImage src={imagePreviewUrl(preview.url, 640)} alt={item.title} containerClassName={styles.workImageWrap} imageClassName={styles.workImage} errorLabel="作品图片不可用" />
                ) : (
                    <video src={preview.url} muted playsInline preload="metadata" className={styles.workImage} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onError={() => setMediaFailed(true)} />
                )}
                {preview?.mediaType === "video" ? (
                    <span className={styles.playIcon}>
                        <Play aria-hidden="true" fill="currentColor" />
                    </span>
                ) : null}
                {preview?.mediaType === "video" && duration > 0 ? <span className={styles.duration}>{formatDuration(duration)}</span> : null}
                <span className={styles.workBody} data-gallery-work-body>
                    <span className={styles.workTitle}>{item.title}</span>
                </span>
            </button>
        </article>
    );
}

function HomeMediaPreview({ item, onClose }: { item?: PublicGalleryItem; onClose: () => void }) {
    const preview = item?.preview;
    const supported = preview?.mediaType === "image" || preview?.mediaType === "video";
    return (
        <Modal
            open={Boolean(item && supported)}
            onCancel={onClose}
            footer={null}
            centered
            width="auto"
            destroyOnHidden
            title={null}
            styles={{ container: { padding: 0, overflow: "hidden" }, body: { padding: 0, display: "flex", justifyContent: "center", alignItems: "center", maxHeight: "88dvh" } }}
        >
            {item && preview?.mediaType === "image" ? <img src={imagePreviewUrl(preview.url, 1920)} alt={item.title} className="block max-h-[88dvh] max-w-[min(92vw,1440px)] object-contain" /> : null}
            {item && preview?.mediaType === "video" ? <video src={preview.url} aria-label={item.title} className="block max-h-[88dvh] max-w-[min(92vw,1440px)] object-contain" controls autoPlay playsInline /> : null}
        </Modal>
    );
}

function GallerySkeleton() {
    return (
        <div className={styles.gallerySkeleton}>
            <span />
            <i />
            <i />
        </div>
    );
}

/** 作品广场为空时的替代内容：直接可点的创作场景，点了就带提示词进入创作。 */
const GALLERY_STARTERS = [
    { id: "brand", title: "品牌视觉", desc: "主视觉 / 海报 / 包装", prompt: "帮我设计一套品牌主视觉，风格简洁高级" },
    { id: "storyboard", title: "短视频分镜", desc: "脚本 → 分镜 → 成片", prompt: "写一个 15 秒产品短视频的分镜，并生成对应画面" },
    { id: "series", title: "系列插画", desc: "统一风格的多张画面", prompt: "生成一组风格统一的系列插画，主题是城市清晨" },
    { id: "commerce", title: "电商主图", desc: "白底图 / 场景图", prompt: "为这款产品生成电商主图和场景图，突出材质与卖点" },
    { id: "audio", title: "配乐旁白", desc: "BGM + 配音 + 字幕", prompt: "为这段视频配一段轻快的背景音乐和中文旁白" },
    { id: "agent", title: "Agent 编排", desc: "多步骤自动交付", prompt: "帮我编排一条从文案到成片的完整创作流程" },
] as const;

function GalleryStarters() {
    const { startCreating } = useHomeActions();
    return (
        <SpotlightGrid className={styles.starterGrid}>
            {GALLERY_STARTERS.map((item, index) => (
                <Reveal key={item.id} delay={index * 0.06} y={16} className={styles.revealItem}>
                    <button type="button" className={styles.starterCard} data-spotlight onClick={() => startCreating(item.prompt, "agent")}>
                        {/* 空态也要有「图像重量」：一张纯 CSS 的构图，比四行文字更像作品 */}
                        <span className={styles.starterCover} aria-hidden="true" data-tone={index % 3} data-motif={index}>
                            <i />
                            <b />
                        </span>
                        <span className={styles.starterMeta}>
                            <span className={styles.starterIndex} aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className={styles.starterGo} aria-hidden="true">
                                <ArrowUpRight />
                            </span>
                        </span>
                        <span className={styles.starterTitle}>{item.title}</span>
                        <span className={styles.starterDesc}>{item.desc}</span>
                    </button>
                </Reveal>
            ))}
        </SpotlightGrid>
    );
}

function formatDuration(seconds: number) {
    const safe = Math.max(0, Math.round(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}
