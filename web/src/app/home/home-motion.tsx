"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

import styles from "./home.module.css";

/* 首屏之下统一的动效基座。
 * 之前下方各段都是静态 HTML + 一点 :hover，和首屏那块液态玻璃完全不是一个语感。
 * 这里只提供两件事：进入视口时的位移淡入、以及卡片上的指针柔光，
 * 具体视觉（颜色、圆角、投影）仍然留在 home.module.css 里，避免两套来源。 */

/** 与首屏曲线一致：先快后慢、末端极缓，动效停下来时不会「顿」一下。 */
const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
    children,
    className,
    delay = 0,
    y = 20,
    duration = 0.72,
}: {
    children: ReactNode;
    className?: string;
    /** 同组元素按序错开，用 index * 0.06 这种小步长即可。 */
    delay?: number;
    y?: number;
    duration?: number;
}) {
    const reduced = useReducedMotion();

    if (reduced) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: "0px 0px -8% 0px" }}
            transition={{ duration, delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
}

/** 指针落在 `[data-spotlight]` 子元素上时，把坐标写进它的 --spot-x / --spot-y。
 *  用一个监听挂在容器上，卡片数量变化时不用重新绑定。 */
function useSpotlight<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        // 触屏没有 hover，光斑跟着手指走反而像 bug
        if (window.matchMedia("(hover: none)").matches) return;

        let frame = 0;
        let latest: PointerEvent | null = null;

        const apply = () => {
            frame = 0;
            const event = latest;
            if (!event) return;
            const card = (event.target as HTMLElement | null)?.closest<HTMLElement>("[data-spotlight]");
            if (!card || !root.contains(card)) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
            card.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
        };

        const onMove = (event: PointerEvent) => {
            latest = event;
            if (!frame) frame = requestAnimationFrame(apply);
        };

        root.addEventListener("pointermove", onMove, { passive: true });
        return () => {
            root.removeEventListener("pointermove", onMove);
            if (frame) cancelAnimationFrame(frame);
        };
    }, []);

    return ref;
}

export function SpotlightGrid({ className, children }: { className?: string; children: ReactNode }) {
    const ref = useSpotlight<HTMLDivElement>();
    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}

/** 各段共用的表头：编号 + 小标签 + 标题 + 一句话。
 *  左对齐而不是居中 —— 首屏大标题本来就是左对齐的，下方全部居中会让两半像两个产品。 */
export function SectionHeading({ id, index, label, title, subtitle }: { id: string; index: string; label: string; title: string; subtitle: string }) {
    return (
        <Reveal className={styles.sectionHeading}>
            <span className={styles.sectionEyebrow}>
                <span aria-hidden="true" className={styles.sectionEyebrowIndex}>
                    {index}
                </span>
                {label}
            </span>
            <h2 id={id}>{title}</h2>
            <p>{subtitle}</p>
        </Reveal>
    );
}
