"use client";

import { useEffect, useRef } from "react";

import styles from "./hero-backdrop.module.css";

const VERTEX_SHADER = `#version 300 es
void main() {
    vec2 pos = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
    gl_Position = vec4(pos * 2.0 - 1.0, 0.0, 1.0);
}`;

/**
 * Pass 1 — Swirl + ChromaFlow，渲染进 sceneTexture（对应 FlutedGlass 的 requiresRTT）。
 * 公式逐行对齐 shaders@2.5.135 的 Swirl / ChromaFlow fragmentNode：
 *   Swirl      : 三层 sin/cos 域扭曲干涉条纹，detail=1.7 / speed=1 / blend=50
 *   ChromaFlow : 128² 位移场 + 染料场，5 tap 平滑，预乘 alpha 叠加在 Swirl 之上
 * 原版 up/down/left/right 四色在 GlazeBackdrop 里全部传同一个 accent，所以液体是单色的；
 * 炫彩完全来自 Pass 2 的 RGB 色散，不要在这里加彩虹色。
 */
const SCENE_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uField;   // R/G = displacement(编码到 0..1), B = liquid density
uniform float uTheme;

out vec4 outColor;

// three.js WebGPURenderer 在线性空间计算、最终编码回 sRGB
vec3 srgbToLinear(vec3 c) {
    return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c));
}

vec2 flowAt(vec2 uv) {
    return texture(uField, uv).rg * 2.0 - 1.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    float t = uTime;

    // ── Swirl（detail=1.7, speed=1, blend=50）──────────────
    float detail = 1.7;

    float f1 = detail;
    vec2 d1 = vec2(
        uv.x + sin(uv.y * f1 * 1.7 + t * 0.8) * 0.12 + cos(uv.x * f1 * 0.9 - t * 0.5) * 0.05,
        uv.y + cos(uv.x * f1 * 1.3 - t * 0.6) * 0.12 + sin(uv.y * f1 * 1.1 + t * 0.7) * 0.05
    );
    float p1 = sin(d1.x * f1 * 2.1 + d1.y * f1 * 1.8 + t * 0.4);

    float f2 = detail * 2.1;
    vec2 d2 = vec2(
        d1.x + cos(d1.y * f2 * 2.7 - t * 0.45) * 0.07 + sin(d1.x * f2 * 1.9 + t * 0.6) * 0.04,
        d1.y + sin(d1.x * f2 * 2.3 + t * 0.65) * 0.07 + cos(d1.y * f2 * 1.6 - t * 0.4) * 0.04
    );
    float p2 = cos(d2.x * f2 * 1.4 - d2.y * f2 * 1.9 + t * 0.35);

    float f3 = detail * 3.7;
    vec2 d3 = vec2(
        d2.x + sin(d2.y * f3 * 1.8 + t * 0.85) * 0.04 + cos(d2.x * f3 * 1.3 - t * 0.55) * 0.025 + sin((d2.x + d2.y) * f3 * 0.7 + t * 0.9) * 0.02,
        d2.y + cos(d2.x * f3 * 1.6 - t * 0.75) * 0.04 + sin(d2.y * f3 * 1.1 + t * 0.5) * 0.025 + cos((d2.x + d2.y) * f3 * 0.8 - t * 0.95) * 0.02
    );
    float p3 = sin(d3.x * f3 * 1.1 + d3.y * f3 * 1.5 - t * 0.55);

    float combined = p1 * 0.45 + p2 * 0.35 + p3 * 0.2;
    float blendFactor = smoothstep(0.3, 0.7, combined * 0.5 + 0.5);
    float shimmer = sin(t * 2.5 + combined * 8.0) * 0.015 + 1.0;

    // GlazeBackdrop 的颜色 token
    vec3 swirlA = srgbToLinear(uTheme < 0.5 ? vec3(1.0) : vec3(0.102, 0.086, 0.043));          // #ffffff / #1a160b
    vec3 swirlB = srgbToLinear(uTheme < 0.5 ? vec3(0.941) : vec3(0.055, 0.043, 0.020));       // #f0f0f0 / #0e0b05
    vec3 baseColor = srgbToLinear(uTheme < 0.5 ? vec3(1.0) : vec3(0.082, 0.067, 0.027));      // #ffffff / #151107
    // 液态玻璃的 accent 与 home.module.css 的 --brand-500 保持同一个值：
    // 原版是纯饱和橙 #ff5f03，和页面上的 #e2671f / #a05f0b 并排会显得「荧光」。
    vec3 accent = srgbToLinear(uTheme < 0.5 ? vec3(0.886, 0.404, 0.122) : vec3(0.910, 0.706, 0.290)); // #e2671f / #e8b44a

    vec3 swirl = mix(swirlA, swirlB, blendFactor) * shimmer;

    // ── ChromaFlow（5 tap 平滑 + 方向权重 + 预乘 alpha）────
    vec2 px = vec2(1.0 / 128.0);
    float smoothLiquid = texture(uField, uv).b;
    smoothLiquid += texture(uField, uv + vec2(px.x, 0.0)).b;
    smoothLiquid += texture(uField, uv + vec2(0.0, px.y)).b;
    smoothLiquid += texture(uField, uv - vec2(px.x, 0.0)).b;
    smoothLiquid += texture(uField, uv - vec2(0.0, px.y)).b;
    smoothLiquid *= 0.2;
    // 回到原版 smoothstep(0, .1)：这条曲线很陡，0.086 就接近满值，
    // 所以「微动可见」不需要靠压低阈值；它反而会把 dist 外圈的极淡染料
    // （<0.02）一刀切掉 —— 之前换成 exp(-11x) 就是这里出错，边缘淡雾全部显形，
    // 深色底上直接铺成半屏金色。微动的可见性交给 MIN_RADIUS 保障。
    float liquidIntensity = smoothstep(0.0, 0.12, smoothLiquid);

    vec2 flow = flowAt(uv);
    flow += flowAt(uv + vec2(px.x, 0.0));
    flow += flowAt(uv + vec2(0.0, px.y));
    flow += flowAt(uv - vec2(px.x, 0.0));
    flow += flowAt(uv - vec2(0.0, px.y));
    flow *= 0.2;

    float flowMagnitude = length(flow);
    float hasFlow = smoothstep(0.01, 0.1, flowMagnitude);
    vec2 dir = flow / (flowMagnitude + 0.001);

    float rightA = smoothstep(0.0, 0.7, max(dir.x, 0.0));
    float leftA = smoothstep(0.0, 0.7, max(-dir.x, 0.0));
    float upA = smoothstep(0.0, 0.7, max(dir.y, 0.0));
    float downA = smoothstep(0.0, 0.7, max(-dir.y, 0.0));
    float hw = leftA + rightA;
    float vw = upA + downA;
    vec3 horizontal = accent * hw;
    vec3 vertical = accent * vw;
    vec3 directional = (horizontal * hw + vertical * vw) / (hw + vw + 0.001);
    vec3 chroma = mix(baseColor, directional, hasFlow);
    // 微动的位移量小于 8bit 场纹理的一个量化级，hasFlow 恒为 0；浅色态 baseColor
    // 与 Swirl 同为白色，就会「有染料但看不见」。给低速留一点最低暖色混入；
    // 再乘 (1 - 高浓度) 让这份补偿只作用于微弱液体，不给慢速的大片拖尾额外加橙。
    float lowSpeedTint = (1.0 - hasFlow) * (1.0 - smoothstep(0.35, 0.85, liquidIntensity));
    chroma = mix(chroma, accent, 0.6 * lowSpeedTint);

    // normal blend：ChromaFlow 输出预乘 alpha，叠在 Swirl 之上
    vec3 scene = swirl * (1.0 - liquidIntensity) + chroma * liquidIntensity;
    outColor = vec4(scene, 1.0);
}`;

/**
 * Pass 2 — FlutedGlass → FilmGrain。
 * 一比一对齐 shaders@2.5.135：
 *   angle 31° / frequency 8 / shape rounded / softness 1 / refraction 4 /
 *   aberration 0.61 / lightAngle -90 / highlight 0.12 / highlightSoftness 0 /
 *   speed 0.15 / edges mirror / FilmGrain strength 0.05, animated false
 * 原版 createAnimatedTime(...).negate()，条格相位是 u*freq - t*speed，条纹沿 +u 漂移。
 * 关键：原版用 three.js 的 screenUV（y 向下），我们用 gl_FragCoord（y 向上）。
 * 若直接用 y 向上的坐标算 u，法线会镜像成「右上」，条格就往 ↗ 跑；
 * 必须换成 y 向下的屏幕坐标，法线才朝右下，条格从左上角往右下角漂移（↘）。
 */
const GLASS_FRAGMENT_SHADER = `#version 300 es
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform sampler2D uScene;

out vec4 outColor;

vec3 linearToSrgb(vec3 c) {
    c = max(c, vec3(0.0));
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c));
}

// edges="mirror"
vec2 mirrorUV(vec2 uv) {
    vec2 m = mod(abs(uv), 2.0);
    return vec2(m.x >= 1.0 ? 2.0 - m.x : m.x, m.y >= 1.0 ? 2.0 - m.y : m.y);
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 uv = frag / uRes;                      // y 向上：采样 sceneTexture
    vec2 screen = vec2(uv.x, 1.0 - uv.y);      // y 向下：等价于原版 screenUV
    float aspect = uRes.x / uRes.y;

    const float ANGLE = 0.5410521;              // 31deg
    float cosA = cos(ANGLE);
    float sinA = sin(ANGLE);

    vec2 centered = screen - 0.5;
    vec2 aspCorr = vec2(centered.x * aspect, centered.y);
    float u = aspCorr.x * cosA + aspCorr.y * sinA;   // 法线朝右下

    float frequency = 8.0;
    float drift = -uTime * 0.15;                // speed=0.15 取负 → 沿 +u 漂移（↘）
    float cellPos = (fract(u * frequency + drift) - 0.5) * 2.0;

    // shape="rounded", softness=1 → exp = mix(8, 3, 1) = 3
    float absCell = max(abs(cellPos), 1e-4);
    float slope = sign(cellPos) * pow(absCell, 3.0);

    float halfCell = 0.5 / frequency;
    float refrU = -slope * 4.0 * halfCell;      // refraction=4
    // 原版在 screenUV（y 向下）上叠加偏移；采样纹理是 y 向上，故垂直分量取反
    vec2 refrOff = vec2(refrU * cosA / aspect, -refrU * sinA);
    vec2 refrUV = uv + refrOff;

    float chrU = refrU * 0.61 * 0.5;            // aberration=0.61
    vec2 chrOff = vec2(chrU * cosA / aspect, -chrU * sinA);

    // 真实 RGB 色散：原版的虹彩只来自这里
    vec3 col = vec3(
        texture(uScene, mirrorUV(refrUV + chrOff)).r,
        texture(uScene, mirrorUV(refrUV)).g,
        texture(uScene, mirrorUV(refrUV - chrOff)).b
    );

    // 高光：标量白色针尖，lightAngle=-90 → hx=-0.7071, hy=0.7071
    float slopeSq = min(slope * slope, 1.0);
    float nz = sqrt(max(0.0, 1.0 - slopeSq));
    const float HX = -0.70710678;
    const float HY = 0.70710678;
    float nDotH = max(slope * HX + nz * HY, 0.0);
    float shininess = exp2(8.0);                // highlightSoftness=0 → 256
    float fresnel = pow(1.0 - nz, 5.0);
    float spec = pow(nDotH, shininess) * (0.04 + 0.96 * fresnel) * 0.12;
    col += vec3(spec);

    // FilmGrain strength=0.05, bias=2, animated=false（静态、暗部加权）
    float grain = fract(sin(dot(frag, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0;
    float brightness = clamp(dot(col, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
    float darkFactor = pow(1.0 - brightness + 1e-6, 2.0);
    col += grain * darkFactor * 0.005;          // strength * 0.1，在线性空间叠加

    outColor = vec4(linearToSrgb(col), 1.0);
}`;

const GRID = 128;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
    const shader = gl.createShader(type);
    if (!shader) {
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("[hero-backdrop] shader compile failed:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function buildProgram(gl: WebGL2RenderingContext, vertex: WebGLShader, fragmentSource: string) {
    const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!fragment) {
        return null;
    }
    const program = gl.createProgram();
    if (!program) {
        return null;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("[hero-backdrop] program link failed:", gl.getProgramInfoLog(program));
        return null;
    }
    return { program, fragment };
}

/**
 * 入口页液态玻璃背景。
 * 对齐 GlazeBackdrop 的四层结构：Swirl → ChromaFlow → FlutedGlass → FilmGrain。
 * CPU 侧按 ChromaFlow 的 128² 位移场 / 染料场算法逐帧平流，鼠标停手即停止注入。
 */
export function HeroBackdrop() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const gl = canvas.getContext("webgl2", {
            alpha: false,
            antialias: false,
            depth: false,
            stencil: false,
            powerPreference: "high-performance",
        });
        if (!gl) {
            return;
        }

        const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
        if (!vertex) {
            return;
        }
        const scenePass = buildProgram(gl, vertex, SCENE_FRAGMENT_SHADER);
        const glassPass = buildProgram(gl, vertex, GLASS_FRAGMENT_SHADER);
        if (!scenePass || !glassPass) {
            return;
        }

        const sceneUniforms = {
            res: gl.getUniformLocation(scenePass.program, "uRes"),
            time: gl.getUniformLocation(scenePass.program, "uTime"),
            field: gl.getUniformLocation(scenePass.program, "uField"),
            theme: gl.getUniformLocation(scenePass.program, "uTheme"),
        };
        const glassUniforms = {
            res: gl.getUniformLocation(glassPass.program, "uRes"),
            time: gl.getUniformLocation(glassPass.program, "uTime"),
            scene: gl.getUniformLocation(glassPass.program, "uScene"),
        };

        // ── RTT 目标纹理（原版用浮点 render target，避免线性空间暗部色带）──
        let floatRTT = Boolean(gl.getExtension("EXT_color_buffer_float"));
        const sceneTexture = gl.createTexture();
        const framebuffer = gl.createFramebuffer();
        if (!sceneTexture || !framebuffer) {
            return;
        }
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // ── ChromaFlow 的两个 128² 场 ─────────────────────
        const cells = GRID * GRID;
        const dispX = new Float32Array(cells);
        const dispY = new Float32Array(cells);
        const liquid = new Float32Array(cells);
        const nextDispX = new Float32Array(cells);
        const nextDispY = new Float32Array(cells);
        const nextLiquid = new Float32Array(cells);
        const pixels = new Uint8Array(cells * 4);
        for (let i = 0; i < cells; i += 1) {
            pixels[i * 4] = 128;
            pixels[i * 4 + 1] = 128;
            pixels[i * 4 + 3] = 255;
        }

        const fieldTexture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, GRID, GRID, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // 归一化 UV（y 向上），与 gl_FragCoord / WebGL 纹理方向一致
        const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
        let prevX = 0.5;
        let prevY = 0.5;
        let smoothedVelX = 0;
        let smoothedVelY = 0;
        let aspect = 1;
        let hasPointer = false;

        const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

        /* 逐行对齐 ChromaFlow.onBeforeRender（shaders@2.5.135）：
         *   vel = Δpointer/dt，EMA .85/.15 → speed
         *   effectiveRadius = radius*.05 * min(speed²*20, 1)   ← 速度决定拖尾「宽度」
         *   speedMultiplier = min(speed*10, 1)                  ← 速度决定「浓度」
         *   disp   += vel_ema * influence * (intensity*100*dt*.01)
         *   liquid +=         influence * (intensity*100*dt*.01) * speedMultiplier
         * 原版每渲染帧注入一次、且一直在衰减（1 - dt/1）。这里把物理固定到 60Hz 来复现
         * 它的 60fps 行为：每步 dt 恒定，掉帧补子步但注入量不随帧率漂移。
         * 微微移动时 speed 很小 → 半径小但 speedMultiplier 仍 > 0，会聚出细亮点；
         * 快速划动时半径与浓度同时饱和 → 形成更宽更亮的一条带。 */
        const FIXED_DT = 1 / 60;
        const MAX_SUBSTEPS = 4;
        const FOLLOW_RATE = 320;       // 原版 mouseX.value = pointer.x 是「直接用」，
                                       // 没有任何缓动：速度、位移、拖尾宽度都取真实值。
                                       // 320/s 在 60Hz 下 follow≈0.995，等价于直接跟随，
                                       // 只留极小的一层平滑吃掉 pointermove 的抖动。
        const FOLLOW_EPS = 0.0002;     // 死区要小：微动不能被吸附吃掉
        const RADIUS = 3.5 * 0.04;    // GlazeBackdrop radius=3.5；缩到 0.14 UV，
                                       // 让液体的「核」更集中，不被 refraction=4 沿条格
                                       // 拉成整条光柱（原版液体本就很淡，拉扯后仍在线下）
        const MIN_RADIUS = 0.042;      // 抗网格量化：微动时 speed² 让半径塌到不足 1 cell，
                                       // 5-tap 平滑会把那点染料直接稀释掉。给个下限让它成一小片。
        // 深色底上金色与暗底的对比远强于浅色底的白橙，同一强度会糊成半屏金块，
        // 所以按主题分开；否则「随速度变宽」在深色态会直接变成大面积色块。
        const INTENSITY_LIGHT = 0.75;
        const INTENSITY_DARK = 0.32;
        const MOMENTUM = 13;           // GlazeBackdrop momentum=13
        const DECAY = 1;               // 划动中原版是 1 - dt/1
        const DECAY_IDLE = 0.8;        // 停手后略快于原版，退得干净但不「啪」一下消失
        let theme = document.documentElement.classList.contains("dark") ? 1 : 0;

        /** 局部高斯注入：等价原版全网格遍历中 dist < effectiveRadius*2 的那一圈 */
        const inject = (
            cx: number,
            cy: number,
            velX: number,
            velY: number,
            radius: number,
            speedMultiplier: number,
            k: number
        ) => {
            const aspectX = aspect >= 1 ? aspect : 1;
            const aspectY = aspect >= 1 ? 1 : 1 / aspect;
            const reach = radius * 2;
            const x0 = Math.max(0, Math.floor((cx - reach / aspectX) * GRID));
            const x1 = Math.min(GRID - 1, Math.ceil((cx + reach / aspectX) * GRID));
            const y0 = Math.max(0, Math.floor((cy - reach / aspectY) * GRID));
            const y1 = Math.min(GRID - 1, Math.ceil((cy + reach / aspectY) * GRID));
            const r2 = radius * radius;
            const reach2 = reach * reach;
            for (let y = y0; y <= y1; y += 1) {
                const cellY = (y + 0.5) / GRID;
                const ddy = (cellY - cy) * aspectY;
                for (let x = x0; x <= x1; x += 1) {
                    const cellX = (x + 0.5) / GRID;
                    const ddx = (cellX - cx) * aspectX;
                    const d2 = ddx * ddx + ddy * ddy;
                    if (d2 >= reach2) {
                        continue;
                    }
                    const idx = y * GRID + x;
                    const influence = Math.exp(-d2 / r2);
                    nextDispX[idx] = clamp(nextDispX[idx] + velX * influence * k, -1, 1);
                    nextDispY[idx] = clamp(nextDispY[idx] + velY * influence * k, -1, 1);
                    nextLiquid[idx] = clamp(nextLiquid[idx] + influence * k * speedMultiplier, 0, 1);
                }
            }
        };

        /** 单个固定物理步：对齐 ChromaFlow.onBeforeRender 的 fade → advect → inject */
        const step = (dt: number) => {
            // ① 指针朝事件目标指数缓动，把一次大跳跃拆成连续轨迹
            const follow = 1 - Math.exp(-FOLLOW_RATE * dt);
            pointer.x += (pointer.tx - pointer.x) * follow;
            pointer.y += (pointer.ty - pointer.y) * follow;
            if (Math.abs(pointer.tx - pointer.x) < FOLLOW_EPS) {
                pointer.x = pointer.tx;
            }
            if (Math.abs(pointer.ty - pointer.y) < FOLLOW_EPS) {
                pointer.y = pointer.ty;
            }

            const rawVX = (pointer.x - prevX) / dt;   // 瞬时速度（UV/s）
            const rawVY = (pointer.y - prevY) / dt;
            smoothedVelX = smoothedVelX * 0.85 + rawVX * 0.15;
            smoothedVelY = smoothedVelY * 0.85 + rawVY * 0.15;

            const speed = Math.hypot(smoothedVelX, smoothedVelY);
            // 原版门槛是「瞬时」|velX|+|velY| > .01。1~2px/帧的微动也过线，
            // 不能用平滑后速度或路径长度做门槛，否则微动会被整段抹掉。
            const moving = hasPointer && Math.abs(rawVX) + Math.abs(rawVY) > 0.01;

            // ② 衰减：划动中沿用原版 1 - dt/1（靠持续衰减平衡慢速的逐帧累积）；
            //    停手后换 0.55s，尾巴退得更干脆，不会在深色底上留一层脏影。
            const flowFadeRate = 1 - dt / DECAY;
            const liquidFadeRate = 1 - dt / (moving ? DECAY : DECAY_IDLE);
            for (let i = 0; i < cells; i += 1) {
                nextDispX[i] = clamp(dispX[i] * flowFadeRate, -1, 1);
                nextDispY[i] = clamp(dispY[i] * flowFadeRate, -1, 1);
                nextLiquid[i] = clamp(liquid[i] * liquidFadeRate, 0, 1);
            }

            // ③ 半拉格朗日平流：把染料沿位移场往回采样（momentum=13）
            const flowSpeed = MOMENTUM * 50 * dt;
            for (let y = 0; y < GRID; y += 1) {
                for (let x = 0; x < GRID; x += 1) {
                    const idx = y * GRID + x;
                    if (Math.abs(dispX[idx]) <= 0.001 && Math.abs(dispY[idx]) <= 0.001) {
                        continue;
                    }
                    const ax = x - dispX[idx] * flowSpeed;
                    const ay = y - dispY[idx] * flowSpeed;
                    const x0 = Math.floor(ax);
                    const y0 = Math.floor(ay);
                    const x1 = x0 + 1;
                    const y1 = y0 + 1;
                    if (x0 < 0 || y0 < 0 || x1 >= GRID || y1 >= GRID) {
                        continue;
                    }
                    const fx = ax - x0;
                    const fy = ay - y0;
                    const i00 = y0 * GRID + x0;
                    const i01 = y0 * GRID + x1;
                    const i10 = y1 * GRID + x0;
                    const i11 = y1 * GRID + x1;
                    nextLiquid[idx] = clamp(
                        (liquid[i00] * (1 - fx) * (1 - fy) +
                            liquid[i01] * fx * (1 - fy) +
                            liquid[i10] * (1 - fx) * fy +
                            liquid[i11] * fx * fy) *
                            liquidFadeRate,
                        0,
                        1
                    );
                }
            }

            // ④ 每步在当前指针位置注入一次（对应原版每渲染帧一次）。速度差异全部来自
            //    effectiveRadius（宽度）与 speedMultiplier（浓度），不再按路径长度归一化掉。
            if (moving) {
                const effectiveRadius = Math.max(MIN_RADIUS, RADIUS * Math.min(speed * speed * 20, 1));
                // 原版是 min(speed*10, 1)，微动时接近 0 → 注入量不足以越过 smoothstep 阈值，
                // 浅色态（液体与 Swirl 同为白）就完全看不见。给 0.35 的下限只在「真的在动」时
                // 生效，不会像调阈值那样把消散尾巴的边缘也点亮。
                const speedMultiplier = Math.min(Math.max(speed * 10, 0.35), 1);
                const k = (theme ? INTENSITY_DARK : INTENSITY_LIGHT) * 100 * FIXED_DT * 0.01;
                if (effectiveRadius > 1e-5) {
                    inject(pointer.x, pointer.y, smoothedVelX, smoothedVelY, effectiveRadius, speedMultiplier, k);
                }
            }

            dispX.set(nextDispX);
            dispY.set(nextDispY);
            liquid.set(nextLiquid);
            prevX = pointer.x;
            prevY = pointer.y;
        };

        const upload = () => {
            for (let i = 0; i < cells; i += 1) {
                pixels[i * 4] = Math.round((dispX[i] * 0.5 + 0.5) * 255);
                pixels[i * 4 + 1] = Math.round((dispY[i] * 0.5 + 0.5) * 255);
                pixels[i * 4 + 2] = Math.round(liquid[i] * 255);
                pixels[i * 4 + 3] = 255;
            }
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GRID, GRID, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        };

        // ── 尺寸 / 指针 / 主题 ────────────────────────────
        const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        let reduced = motionQuery.matches;
        let width = 1;
        let height = 1;
        let cssWidth = 1;
        let cssHeight = 1;

        const resize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 1);
            cssWidth = Math.max(1, rect.width);
            cssHeight = Math.max(1, rect.height);
            aspect = cssWidth / cssHeight;
            width = Math.max(1, Math.round(cssWidth * dpr));
            height = Math.max(1, Math.round(cssHeight * dpr));
            canvas.width = width;
            canvas.height = height;

            const attachScene = () => {
                gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    floatRTT ? gl.RGBA16F : gl.RGBA8,
                    width,
                    height,
                    0,
                    gl.RGBA,
                    floatRTT ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE,
                    null
                );
                gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
                if (floatRTT && gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
                    floatRTT = false;
                    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
                    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0);
                }
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            };
            attachScene();
        };

        const draw = (seconds: number) => {
            // Pass 1 → sceneTexture
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(0, 0, width, height);
            gl.useProgram(scenePass.program);
            gl.uniform2f(sceneUniforms.res, width, height);
            gl.uniform1f(sceneUniforms.time, seconds);
            gl.uniform1f(sceneUniforms.theme, theme);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
            gl.uniform1i(sceneUniforms.field, 1);
            gl.drawArrays(gl.TRIANGLES, 0, 3);

            // Pass 2 → 屏幕
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, width, height);
            gl.useProgram(glassPass.program);
            gl.uniform2f(glassUniforms.res, width, height);
            gl.uniform1f(glassUniforms.time, seconds);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
            gl.uniform1i(glassUniforms.scene, 0);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        };

        let raf = 0;
        let lastTs = 0;
        let elapsed = 0;
        let accumulator = 0;

        const frame = (ts: number) => {
            raf = window.requestAnimationFrame(frame);
            const dtMs = lastTs ? Math.min(100, ts - lastTs) : FIXED_DT * 1000;
            lastTs = ts;
            elapsed += dtMs * 0.001;

            // 固定步长推进：60fps 每帧 1 步，掉帧时补多个子步，轨迹始终连续
            accumulator = Math.min(accumulator + dtMs * 0.001, FIXED_DT * MAX_SUBSTEPS);
            let steps = 0;
            while (accumulator >= FIXED_DT && steps < MAX_SUBSTEPS) {
                step(FIXED_DT);
                accumulator -= FIXED_DT;
                steps += 1;
            }

            upload();
            draw(elapsed);
        };

        const start = () => {
            window.cancelAnimationFrame(raf);
            lastTs = 0;
            accumulator = 0;
            if (reduced) {
                draw(elapsed);
                return;
            }
            raf = window.requestAnimationFrame(frame);
        };

        const stop = () => {
            window.cancelAnimationFrame(raf);
            raf = 0;
        };

        const onPointerMove = (event: PointerEvent) => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
                return;
            }
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            if (x < -0.1 || y < -0.1 || x > 1.1 || y > 1.1) {
                return;
            }
            const tx = x;
            const ty = 1 - y;
            if (!hasPointer) {
                // 首次进入直接对齐，避免从 (0.5, 0.5) 跳过来炸出一坨液体
                pointer.x = pointer.tx = tx;
                pointer.y = pointer.ty = ty;
                prevX = tx;
                prevY = ty;
                hasPointer = true;
                return;
            }
            pointer.tx = tx;
            pointer.ty = ty;
        };

        const onVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        };

        const applyTheme = () => {
            theme = document.documentElement.classList.contains("dark") ? 1 : 0;
            if (reduced) {
                draw(elapsed);
            }
        };

        const themeObserver = new MutationObserver(applyTheme);
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        const resizeObserver = new ResizeObserver(() => {
            resize();
            if (reduced) {
                draw(elapsed);
            }
        });
        resizeObserver.observe(canvas);

        const onMotionChange = () => {
            reduced = motionQuery.matches;
            start();
        };

        const onContextLost = (event: Event) => {
            event.preventDefault();
            stop();
        };

        resize();
        start();
        window.addEventListener("pointermove", onPointerMove, { passive: true });
        document.addEventListener("visibilitychange", onVisibility);
        canvas.addEventListener("webglcontextlost", onContextLost);
        motionQuery.addEventListener("change", onMotionChange);

        return () => {
            stop();
            themeObserver.disconnect();
            resizeObserver.disconnect();
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("visibilitychange", onVisibility);
            canvas.removeEventListener("webglcontextlost", onContextLost);
            motionQuery.removeEventListener("change", onMotionChange);
            gl.deleteTexture(fieldTexture);
            gl.deleteTexture(sceneTexture);
            gl.deleteFramebuffer(framebuffer);
            gl.deleteProgram(scenePass.program);
            gl.deleteProgram(glassPass.program);
            gl.deleteShader(scenePass.fragment);
            gl.deleteShader(glassPass.fragment);
            gl.deleteShader(vertex);
        };
    }, []);

    return (
        <div className={styles.backdrop} aria-hidden="true">
            <canvas ref={canvasRef} className={styles.canvas} />
        </div>
    );
}
