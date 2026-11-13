import { Home } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
            <main className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-background px-6 py-10">
                <section className="w-full max-w-md text-center">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-lg border border-border bg-card text-2xl font-semibold tabular-nums tracking-tight text-muted-foreground">
                        404
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">页面不存在</h1>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">这个地址没有对应的页面，可能已经移动或被合并到其他入口。</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        <Link
                            href="/"
                            className="inline-flex h-10 items-center gap-2 rounded-md !bg-foreground px-4 text-sm font-medium !text-background transition hover:opacity-85"
                        >
                            <Home className="size-4" />
                            返回首页
                        </Link>
                        <Link
                            href="/gallery"
                            className="inline-flex h-10 items-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition hover:bg-muted"
                        >
                            逛逛作品广场
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
