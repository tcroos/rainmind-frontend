import type { Metadata } from "next";
import { Database, Eye, FileDown, MailCheck, Sparkles, Trash2 } from "lucide-react";

import { LegalDocument } from "@/components/legal/legal-document";
import { getPublicSiteSettings } from "@/lib/server/site-metadata";

const UPDATED_AT = "2026 年 8 月 13 日";

const highlights = [
    { title: "创作内容由你掌控", body: "你的对话、项目、提示词和媒体用于提供你主动请求的功能，不会被公开展示，除非你明确发布作品或分享内容。", icon: Eye },
    { title: "AI 请求会经过第三方", body: "当你使用文本、图片、视频或音频生成时，必要的提示词、参数和你选择的参考素材会发送给实际执行任务的模型服务商。", icon: Sparkles },
    { title: "支持查阅、导出与注销", body: "你可以在个人中心管理资料、查看订单与积分记录、导出账户数据，并提交或撤回账户注销申请。", icon: FileDown },
] as const;

const sections = [
    {
        title: "我们处理哪些信息",
        paragraphs: [
            "账号信息：用户名、显示名称、邮箱、头像、加密后的密码凭据、登录与安全记录，以及你同意本政策和服务条款的版本与时间。",
            "创作与项目数据：你提交的文字、提示词、附件、创作会话、Canvas、短剧、素材、生成参数、任务状态和生成结果。",
            "交易与权益数据：订单、支付渠道返回的交易状态、套餐、积分余额与流水、优惠券和退款记录。我们不在页面中保存或展示完整银行卡信息。",
            "设备与运行信息：为保障登录、安全、限流和故障排查而处理的 IP 地址、浏览器信息、请求时间、错误和必要审计记录。",
        ],
    },
    {
        title: "我们为什么处理这些信息",
        paragraphs: [
            "用于创建和保护账号、恢复你的会话与项目、执行生成任务、展示与下载结果、完成支付和积分结算，以及响应你主动发起的客服、安全和注销请求。",
            "用于防止滥用、欺诈、越权访问和重复扣费，定位服务故障，并履行适用法律要求。我们只在实现相应功能所需的范围内处理信息。",
        ],
    },
    {
        title: "AI 与自动化处理",
        paragraphs: [
            "创作 Agent 会先理解你的本轮需求，再选择当前可用的模型和参数。内部规划提示词、模型选择过程和执行规则不会作为你的公开内容展示。",
            "模型服务可能处理你的提示词、参考素材和任务参数，并生成文字或媒体结果。不同模型服务商的数据保留与训练政策可能不同；请避免提交身份证件、财务信息、医疗信息、未公开商业秘密等不必要的敏感内容。",
            "AI 结果可能不准确、不完整或与现实不符。发布、商用或用于重要决策前，请自行核验事实、版权、肖像和合规风险。",
        ],
    },
    {
        title: "我们何时向第三方提供信息",
        paragraphs: [
            "我们只会在提供具体功能所需时，将必要信息交给模型服务、支付服务、邮件发送服务、对象存储或内容分发服务。第三方只会收到完成相应任务所需的数据。",
            "当法律法规、司法或监管机关依法要求，或为了保护用户、平台和他人的合法权益时，我们可能依法披露必要信息。我们不会出售你的个人信息。",
        ],
    },
    {
        title: "保存期限与安全",
        paragraphs: [
            "账号、项目、会话和长期素材通常保存到你删除相应内容或注销账号；发送前的临时附件只保存在当前页面内存，发送后才会作为账户资产保存。订单、支付、退款、安全审计等记录会按适用法律及争议处理需要保留必要期限。",
            "我们采取访问控制、加密凭据、媒体归属校验、短期签名地址、操作审计和备份等措施保护数据。但任何网络服务都无法承诺绝对安全，请妥善保护密码并及时报告异常。",
        ],
    },
    {
        title: "你的选择与权利",
        paragraphs: [
            "你可以在个人中心修改个人资料和密码，查看订单、积分与消费记录，下载自己有权限访问的媒体，并导出账户数据。",
            "你可以删除创作会话、Canvas、短剧、素材或发布记录。系统会先检查其他项目是否仍在引用同一媒体；仍被合法引用的文件会保留到引用解除，避免其他项目静默失效。",
            "你可以在个人中心提交账户注销申请，并在受理前撤回。注销处理会删除或去标识化可删除的账户与创作数据；依法必须保留的交易、安全和争议记录会在法定期限内隔离保存。",
        ],
    },
    {
        title: "未成年人、政策更新与联系",
        paragraphs: [
            "如果你未达到所在地独立同意网络服务的法定年龄，应在监护人阅读并同意后使用本服务。请勿上传未成年人的敏感信息或不当内容。",
            "我们可能因功能、供应商或法律变化更新本政策。重要变化会通过站内公告、登录或重新同意流程提示，并保留你注册时同意的政策版本记录。",
            "如需提出隐私查阅、更正、删除、注销或投诉请求，请先使用个人中心和帮助中心提供的入口；需要人工处理时，请通过站点运营方公布的客服渠道联系。",
        ],
    },
] as const;

export async function generateMetadata(): Promise<Metadata> {
    const site = await getPublicSiteSettings();
    return {
        title: `隐私政策 | ${site.title}`,
        description: `了解 ${site.title} 如何处理账号、创作内容、AI 请求、交易和媒体数据，以及你可以行使的选择与权利。`,
        alternates: { canonical: "/privacy" },
        robots: { index: true, follow: true },
    };
}

export default async function PrivacyPage() {
    const site = await getPublicSiteSettings();
    return (
        <LegalDocument
            kicker="隐私与数据保护"
            title="隐私政策"
            description={`本政策面向 ${site.title} 用户，说明我们在你注册、创作、购买和管理账户时如何处理信息，以及你可以如何控制自己的数据。`}
            updatedAt={UPDATED_AT}
            currentPath="/privacy"
            highlights={highlights}
            sections={sections}
            notes={[
                { icon: Database, text: "业务数据按账号和具体功能范围读取。" },
                { icon: MailCheck, text: "验证码只用于验证当前操作并在有效期后失效。" },
                { icon: Trash2, text: "删除与注销按引用和法定保留边界执行。" },
            ]}
        />
    );
}
