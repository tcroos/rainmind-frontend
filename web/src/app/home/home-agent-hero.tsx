"use client";

import { ArrowRight } from "lucide-react";

import { useHomeActions } from "./home-actions";
import styles from "./home-agent-hero.module.css";

export function HomeAgentHero() {
    const { startCreating } = useHomeActions();

    return (
        <section className={styles.hero} aria-labelledby="home-hero-title">
            <div className={styles.heroInner}>
                <div className={styles.heroCopy}>
                    <span className={styles.heroKicker}>
                        <span className={styles.heroKickerDot} aria-hidden="true" />
                        图片 · 视频 · 音频 · 短剧
                    </span>

                    <h1 id="home-hero-title" className={styles.heroTitle}>
                        <span className={styles.heroTitleAccent}>让每个想法</span>
                        <span className={styles.heroTitleSub}>直接变成作品</span>
                    </h1>

                    <p className={styles.heroSubtitle}>一句话说清要什么，也可以丢一张参考图。图片、视频、配音、短剧，都在同一个输入框里出片。</p>

                    <div className={styles.heroActions}>
                        <button type="button" className={styles.heroCta} onClick={() => startCreating("", "agent")}>
                            <span className={styles.heroCtaLabel}>
                                <span>立即开始创作</span>
                                <span aria-hidden="true">立即开始创作</span>
                            </span>
                            <span className={styles.heroCtaIcon} aria-hidden="true">
                                <ArrowRight />
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className={styles.heroCue} aria-hidden="true">
                <span>SCROLL</span>
                <span className={styles.heroCueLine} />
            </div>
        </section>
    );
}
