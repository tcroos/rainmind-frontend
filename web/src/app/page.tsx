import { redirect } from "next/navigation";

import { getInstallStatus } from "@/lib/server/install-status";
import { getPublicSiteSettings } from "@/lib/server/site-metadata";
import { HomeActionsProvider } from "./home/home-actions";
import { HomeAgentHero } from "./home/home-agent-hero";
import { HeroBackdrop } from "./home/hero-backdrop";
import { HomeCta, HomeFooter } from "./home/home-footer";
import { HomeGallery } from "./home/home-gallery";
import { HomeHeader } from "./home/home-header";
import { HomeAdvantagesSection, HomeContentAura, HomeStepsSection } from "./home/home-static-sections";
import styles from "./home/home.module.css";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const [install, site] = await Promise.all([getInstallStatus(), getPublicSiteSettings()]);
    if (!install.ready) redirect("/install");

    return (
        <HomeActionsProvider initialSite={site}>
            <main className={`app-scroll-page ${styles.root}`}>
                {/* 导航放在 heroShell 外面：sticky 只能在父级范围内生效，
                 * 挪进 heroShell 会让它在滚过首屏后跟着一起滚走。 */}
                <HomeHeader />
                <div className={styles.heroShell}>
                    <HeroBackdrop />
                    <HomeAgentHero />
                </div>
                <div className={styles.contentBand}>
                    <HomeContentAura />
                    <HomeStepsSection />
                    <HomeGallery />
                    <HomeAdvantagesSection />
                    <HomeCta />
                    <HomeFooter />
                </div>
            </main>
        </HomeActionsProvider>
    );
}
