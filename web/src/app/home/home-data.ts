import type { SiteFriendLink, SiteSocialSettings } from "@/lib/auth/store-types";
import type { CreateAgentMode } from "@/lib/create-agent-prompt";
import { WORK_CATEGORIES } from "@/lib/work-publication-options";
import type { PublicGalleryItem } from "@/services/api/work-governance";

export type HomeSiteSettings = {
    title: string;
    logoUrl: string;
    seoDescription: string;
    footerCopyright: string;
    termsUrl: string;
    privacyUrl: string;
    friendLinks: SiteFriendLink[];
    socials: SiteSocialSettings;
};

export type HomeNavigationItem = {
    label: string;
    href: string;
    action: "link" | "protected" | "billing";
};

export const HOME_NAVIGATION = [
    { label: "创作 Agent", href: "/create", action: "protected" },
    { label: "短剧制作", href: "/drama", action: "protected" },
    { label: "作品广场", href: "/gallery", action: "link" },
    { label: "价格方案", href: "/billing", action: "billing" },
] as const satisfies readonly HomeNavigationItem[];

export const HOME_CREATION_MODES = [
    {
        id: "agent",
        label: "智能模式",
        icon: "agent",
        examples: ["生成一张科幻城市概念图", "制作一段产品宣传视频", "为电商产品生成详情页", "创作一个短剧分镜脚本"],
    },
    {
        id: "image",
        label: "AI 绘图",
        icon: "image",
        examples: ["生成电影感的未来城市概念图", "为美妆新品制作竖版宣传海报", "为电商产品生成详情页", "把参考图改成清透夏日广告"],
    },
    {
        id: "video",
        label: "AI 视频",
        icon: "video",
        examples: ["制作一段 10 秒新品发布短片", "生成竖屏咖啡品牌氛围广告", "让镜头缓慢向前推进", "制作一段产品功能演示视频"],
    },
    {
        id: "audio",
        label: "AI 音频",
        icon: "audio",
        examples: ["生成温暖自然的品牌介绍旁白", "制作沉稳的发布会开场音频", "将文案转换为轻快女声配音", "为短片生成自然男声旁白"],
    },
] as const;

export type HomeCreationMode = CreateAgentMode;

/* visual 决定卡片里那块「微缩画面」画什么：纯 CSS 拼的小场景，
 * 比一个通用图标更能说明这一步到底发生了什么，也更贴首屏液态玻璃的质感。 */
export const HOME_STEPS = [
    { number: "01", title: "选个类型", description: "图片、视频、音频、短剧，先不用定模型", visual: "type" },
    { number: "02", title: "说清要什么", description: "一句话就够，也能附参考图和首尾帧", visual: "prompt" },
    { number: "03", title: "交给系统", description: "自动匹配模型、尺寸和时长，中途断了也能接着取", visual: "run" },
    { number: "04", title: "结果直接用", description: "继续改、重新生成，或发布到作品广场", visual: "result" },
] as const;

export const HOME_ADVANTAGES = [
    { title: "改两个字就能用", description: "电商、海报、人像、分镜都有现成的", icon: "layers", visual: "templates" },
    { title: "不用自己挑模型", description: "按需求匹配模型、尺寸与时长", icon: "network", visual: "models" },
    { title: "关掉页面也能接着跑", description: "任务在服务端继续，回来直接看结果", icon: "history", visual: "task" },
    { title: "作品不会丢", description: "素材和成片都在账号里，随时回看下载", icon: "cloud", visual: "storage" },
] as const;

export const HOME_GALLERY_TABS = [{ id: "all", label: "全部" }, ...WORK_CATEGORIES.map((category) => ({ id: category, label: category }))] as const;

export type HomeGalleryTab = "all" | (typeof WORK_CATEGORIES)[number];

export function homeGalleryMatches(item: PublicGalleryItem, tab: HomeGalleryTab) {
    const mediaType = item.preview?.mediaType;
    if (mediaType !== "image" && mediaType !== "video") return false;
    return tab === "all" || item.category === tab;
}

export function homeGalleryTypeLabel(item: PublicGalleryItem) {
    return item.category;
}
