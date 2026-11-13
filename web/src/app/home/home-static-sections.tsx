import { Cloud, History, Layers3, Network } from "lucide-react";

import { HOME_ADVANTAGES, HOME_STEPS } from "./home-data";
import { Reveal, SectionHeading, SpotlightGrid } from "./home-motion";
import styles from "./home.module.css";

const advantageIcons = { layers: Layers3, network: Network, history: History, cloud: Cloud } as const;

/** 内容带的环境光层：sticky 在视口顶部，纯 CSS 缓慢漂移，不占文档高度。 */
export function HomeContentAura() {
    return (
        <div className={styles.contentAura} aria-hidden="true">
            <span className={styles.auraWarm} />
            <span className={styles.auraCool} />
            <span className={styles.auraVeil} />
        </div>
    );
}

export function HomeStepsSection() {
    return (
        <section className={styles.section} aria-labelledby="home-steps-title">
            <SectionHeading id="home-steps-title" index="01" label="创作流程" title="四步，从一句话到成片" subtitle="上一步的产物下一步直接能用，不用重新上传一遍" />
            <SpotlightGrid className={styles.stepsGrid}>
                {HOME_STEPS.map((step, index) => (
                    <Reveal key={step.number} delay={index * 0.07} className={styles.revealItem}>
                        <article className={styles.stepCard} data-spotlight>
                            <div className={styles.stepVisual} aria-hidden="true">
                                <span className={styles.stepNumber}>{step.number}</span>
                                <StepScene variant={step.visual} />
                            </div>
                            <div className={styles.stepCopy}>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </article>
                    </Reveal>
                ))}
            </SpotlightGrid>
        </section>
    );
}

/** 每张步骤卡里的小场景：只用 div 拼，不引入图片，深色态跟着 token 走。 */
function StepScene({ variant }: { variant: (typeof HOME_STEPS)[number]["visual"] }) {
    if (variant === "type") {
        return (
            <div className={styles.sceneChips}>
                <span data-active="true">图片</span>
                <span>视频</span>
                <span>音频</span>
                <span>短剧</span>
            </div>
        );
    }
    if (variant === "prompt") {
        return (
            <div className={styles.sceneField}>
                <div className={styles.sceneLines}>
                    <i />
                    <i />
                </div>
                <span className={styles.sceneThumb} />
            </div>
        );
    }
    if (variant === "run") {
        return (
            <div className={styles.sceneRun}>
                <div className={styles.sceneTags}>
                    <span>模型</span>
                    <span>尺寸</span>
                    <span>时长</span>
                </div>
                <div className={styles.sceneTrack}>
                    <i />
                </div>
            </div>
        );
    }
    return (
        <div className={styles.sceneTiles}>
            {Array.from({ length: 6 }, (_, index) => (
                <i key={index} data-tone={index % 3} data-play={index === 1 ? "true" : undefined} />
            ))}
        </div>
    );
}

export function HomeAdvantagesSection() {
    return (
        <section className={`${styles.section} ${styles.advantages}`} aria-labelledby="home-advantages-title">
            <SectionHeading id="home-advantages-title" index="03" label="平台能力" title="工具会换，作品不用重做" subtitle="模型、任务、素材都存在账号里，换设备或换模型都不用从头再来" />
            <SpotlightGrid className={styles.advantagesGrid}>
                {HOME_ADVANTAGES.map((advantage, index) => {
                    const Icon = advantageIcons[advantage.icon];
                    return (
                        <Reveal key={advantage.title} delay={index * 0.07} className={styles.revealItem}>
                            <article className={styles.advantageCard} data-spotlight>
                                <div className={styles.advantageCopy}>
                                    <span className={styles.advantageIcon} aria-hidden="true">
                                        <Icon />
                                    </span>
                                    <h3>{advantage.title}</h3>
                                    <p>{advantage.description}</p>
                                </div>
                                <div className={styles.advantageVisual} aria-hidden="true">
                                    <AdvantageScene variant={advantage.visual} />
                                </div>
                            </article>
                        </Reveal>
                    );
                })}
            </SpotlightGrid>
        </section>
    );
}

function AdvantageScene({ variant }: { variant: (typeof HOME_ADVANTAGES)[number]["visual"] }) {
    if (variant === "templates") {
        return (
            <div className={styles.sceneCards}>
                <i data-tone="0" />
                <i data-tone="1" />
                <i data-tone="2" />
            </div>
        );
    }
    if (variant === "models") {
        return (
            <div className={styles.sceneStack}>
                <i data-tone="0" />
                <i data-tone="1" />
                <i data-tone="2" />
            </div>
        );
    }
    if (variant === "task") {
        return (
            <div className={styles.sceneProgress}>
                <span className={styles.sceneTrack}>
                    <i />
                </span>
                <span className={styles.sceneDot} />
            </div>
        );
    }
    return (
        <div className={styles.scenePlates}>
            <i />
            <i />
            <i />
        </div>
    );
}
