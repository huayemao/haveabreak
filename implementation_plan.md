# Goal Description

将 Goodisplay 的 NFC 墨水屏刷屏 Android App（原工程 `MyApplication1-v1.9.8.7 -EN`）重写为一个全新的 Tauri 应用，命名为 **“猫记” (MaoJi)**。
新应用将：
- 基于 Tauri 2.0 框架，构建面向 Android 移动端（主要）的刷屏工具，并保留桌面端兼容性。
- 前端页面在 Next.js Monorepo 中开发（暂时无需国际化，仅使用中文），采用 `DESIGN.md` 中定义的 **Neumorphism (Soft UI) 软拟物化设计风格**。
- 封装 NFC 刷屏的核心传输协议，使 Web 前端可以通过 TypeScript API 轻松调用。
- 扩展丰富的编辑能力与设计模板（待办、日历、名片、二维码、时钟、格言等），集成 Floyd-Steinberg 图像抖动算法，提供实时墨水屏像素级黑白/红白/四色预览。
- 优化用户体验，提供流畅的 NFC 刷屏引导、进度条和成功反馈。

---

## Original App Functionality Summary (原 App 功能总结)

原 App 是一个用于 Goodisplay NFC 墨水屏刷屏的原生 Android 应用程序，核心功能包含：
1. **尺寸与颜色设置**：支持单色、三色、四色等不同颜色模式，并针对 0.97", 1.54", 2.13", 2.66", 2.7", 2.9", 3.7", 4.2" 等多种规格的墨水屏定义了具体的硬件初始化指令和屏幕切换指令。
2. **图像采集与裁剪**：支持从相册或相机选择图片，并裁剪到墨水屏对应的物理分辨率。
3. **图像取模与转换（关键）**：
   - 墨水屏的数据寄存器要求使用**纵向扫描方式**（即 Y 轴像素每 8 个或 4 个打包为一个字节，X 轴逐行扫描，并在处理小尺寸屏幕时需要将图像顺时针旋转 90 度以实现物理对齐）。
   - 单色模式（模式 0）：黑色像素为 `0`，白色为 `1`。
   - 红白模式（模式 1）：红色像素为 `0`，白色为 `1`（传输前需进行 `0xFF - data` 翻转）。
   - 四色模式（4G）：每字节包含 4 个像素（每个像素 2 位），`00` 代表黑色，`01` 代表白色，`02` 代表黄色，`03` 代表红色。
4. **NFC 通信协议（IsoDep）**：
   - 当手机贴近墨水屏线圈触发 NFC 广播后，在 `onNewIntent` 中获取 `Tag` 实例。
   - 建立 `IsoDep` 连接并设置 50 秒的高超时时间。
   - 发送 IC DIY 控制指令：`F0DB020000`。
   - 发送屏幕初始化指令 1（来自 `data.java` 的 `setEpdInit`）。
   - 发送屏幕切换指令 2。
   - 分包发送图像数据：包长 250 字节，包头格式为 `F0 D2 <ScreenIndex> <ChunkIndex> <ChunkLen>`。对于某些尺寸（如 3.7", 4.2", 3色屏）需要分两次分别写入黑白通道（`ScreenIndex=0`）和红白通道（`ScreenIndex=1`）。
   - 发送物理刷新指令：单/三色屏为 `F0D4058000`，四色屏为 `F0D4858000`。
   - 监控连接状态，计算刷新等待时间（单色 2s，三色 16s，四色 20s）。

---

## User Review Required

> [!IMPORTANT]
> 1. **NFC 仅限 Android 移动端支持**：由于 NFC 刷屏必须借助手机的 NFC 芯片和天线，本应用的刷屏功能仅能在 Android 真机上运行。在桌面端（Windows/macOS）运行时，NFC 功能将自动处于“模拟/演示”状态，但编辑和模板设计能力均能正常使用。
> 2. **包名与标识符**：新应用将使用 Monorepo 统一的包名前缀，例如 `online.white_noise.maoji`。

---

## Proposed Changes

我们将更改分为以下四个部分：
1. **Monorepo 构建配置与 Tauri 应用初始化** (`apps/maoji`)
2. **Android 端的 NFC 插件封装** (使用 Kotlin 在 `gen/android` 下实现)
3. **Rust 端的本地桥接** (在 `apps/maoji/src-tauri` 下实现)
4. **Next.js Web 前端的 Neumorphic 编辑器与模板库** (`apps/web/app/[lang]/maoji`)

### 1. Monorepo & Tauri Setup

#### [NEW] [package.json](file:///d:/workspace/apps/haveabreak/apps/maoji/package.json)
创建 `@haveabreak/maoji` 依赖包，配置与 `@haveabreak/card` 类似。

#### [NEW] [index.html](file:///d:/workspace/apps/haveabreak/apps/maoji/index.html)
Tauri 的入口网页，直接重定向到 `/zh/maoji` 路由。

#### [NEW] [tauri.conf.json](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/tauri.conf.json)
Tauri 应用配置文件，指定 `frontendDist` 为 `../../web/out`，设置包名标识符为 `online.white_noise.maoji`，并允许 `nfc` 插件相关的权限配置。

#### [NEW] [Cargo.toml](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/Cargo.toml)
定义 `maoji` 的 Rust 编译配置，添加对 Tauri 核心和 JNI 支持的依赖。

#### [MODIFY] [package.json](file:///d:/workspace/apps/haveabreak/package.json)
在根目录的 `package.json` 中添加：
- `"tauri:maoji": "export TAURI_APP=maoji && cd apps/maoji && npx tauri"`
- 在 `devDependencies` 中添加对应的转译包声明。

---

### 2. Android NFC Native Plugin (Kotlin)

#### [NEW] [NfcPlugin.kt](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/gen/android/app/src/main/java/online/white_noise/maoji/NfcPlugin.kt)
编写一个 Tauri Kotlin 插件类，继承自 `app.tauri.plugin.Plugin`，提供如下功能：
- **`@Command fun enableNfc(invoke: Invoke)`**: 在当前 Activity 启用 NFC `enableForegroundDispatch` 监听。
- **`@Command fun disableNfc(invoke: Invoke)`**: 关闭 NFC 监听。
- **`@Command fun prepareWriteData(invoke: Invoke)`**: 接收 Web 端传入的屏幕参数（如 `epdColor`, `epdInch`）、初始化指令（`initCmd1`, `initCmd2`）以及处理好的黑白/红白数据数组（或 Base64 编码的二进制流），并将其缓存在内存中。
- 监听 `onNewIntent` 周期：
  - 当捕获到 `ACTION_TAG_DISCOVERED` 或 `ACTION_TECH_DISCOVERED` 时，提取 `Tag` 实例。
  - 若内存中有待写入的数据，自动启动后台线程执行 `IsoDep` 连接与分包写入流程。
  - 在写入过程中，使用 `trigger("write-progress", JSObject...)` 实时向 Web 端派发百分比进度。
  - 写入成功或失败后，分别派发 `write-success` 或 `write-error` 事件。

#### [NEW] [MainActivity.kt](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/gen/android/app/src/main/java/online/white_noise/maoji/MainActivity.kt)
扩展 `TauriActivity`，重写 `onNewIntent` 和生命周期钩子，确保将 NFC 发现事件派发给我们的 `NfcPlugin`。

#### [NEW] [AndroidManifest.xml](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/gen/android/app/src/main/AndroidManifest.xml)
配置 NFC 权限及硬件特征要求：
```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="true" />
```

---

### 3. Rust Native Bridge

#### [NEW] [lib.rs](file:///d:/workspace/apps/haveabreak/apps/maoji/src-tauri/src/lib.rs)
在 Rust 中注册 Android 原生插件：
```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "android")]
            app.handle().plugin(
                tauri::plugin::Builder::new("nfc")
                    .setup_with_android("online.white_noise.maoji", "NfcPlugin")
                    .build()
            )?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

### 4. Next.js Web Frontend (Chinese & Neumorphism)

我们将把猫记的主入口放在 `apps/web/app/[lang]/maoji` 下（自适应 Next.js `[lang]` 路由系统，中文为 `/zh/maoji`），包含以下关键模块：

#### [NEW] [MaojiPageClient.tsx](file:///d:/workspace/apps/haveabreak/apps/web/app/%5Blang%5D/maoji/MaojiPageClient.tsx)
猫记应用的主页面，完全使用 Neumorphism 风格。
- **顶栏**：带 Neumorphic 凹槽深度（`shadow-inset`）的分类切换，返回主页。
- **编辑器工作区**：
  - 显示拟真墨水屏的画布区（带有像素网格感和真实比例）。
  - 支持画布缩放、拖拽。
  - 提供图像抖动算法开关（Floyd-Steinberg Dithering），在前端将任意彩色图片转换为逼真的墨水屏抖动黑白效果。
- **模板选择面板**（卡片采用 `shadow-extruded`，悬停 `shadow-extruded-hover`，选中 `shadow-inset`）：
  - **待办清单 (Todo List)**：可自定义待办项，自动排列，带打钩效果。
  - **日历/日期 (Calendar)**：多种排版，显示今天日期、农历、星期。
  - **姓名牌 (Name Tag)**：适合展会、个人桌牌，支持大字和二维码。
  - **收款/名片二维码 (QR Code)**：输入 URL/文本，自动生成 QR Code 显示在屏幕中央。
  - **格言卡片 (Quotes)**：精美排版，LXGW 文楷字体。
  - **自由文本与涂鸦 (Free Text)**：可以添加多个文本框，支持选择字体、字号、加粗、对齐等。
- **墨水屏参数调节器**：
  - 侧边栏 Neumorphic 控制面板，用于选择墨水屏规格（2.13", 2.9" 等）和颜色种类。
  - 规格改变时，自动重置画布分辨率（如 2.9" -> 128x296）。
- **NFC 写入弹出层**：
  - 当点击“开始写入”时，弹出 Neumorphic 材质的 Dialog。
  - 提示用户贴近墨水屏。
  - 接收并展示来自 Native 插件的百分比进度条（使用 `shadow-inset-deep` 作为进度条轨道）。
  - 写入成功时播放轻微的触觉/声音反馈（如果是手机环境），并展示炫酷的成功状态。

#### [NEW] [types.ts](file:///d:/workspace/apps/haveabreak/apps/maoji/types.ts)
定义前端的墨水屏规格配置类型、设计元素类型、模板类型等。

#### [NEW] [storage.ts](file:///d:/workspace/apps/haveabreak/apps/maoji/storage.ts)
使用 `localStorage` 存储用户的“我的设计历史”，方便下次快速调用。

#### [NEW] [store.ts](file:///d:/workspace/apps/haveabreak/apps/maoji/store.ts)
使用 Zustand 管理编辑器画布状态（当前设计的元素、选中的模板、当前墨水屏配置）。

#### [NEW] [dither.ts](file:///d:/workspace/apps/haveabreak/apps/maoji/utils/dither.ts)
实现 Floyd-Steinberg 图像抖动及取模算法，将 Canvas 渲染为 1-bit（或红白、4色）字节流，为 NFC 传输做准备。

---

## Verification Plan

### Automated Tests
1. **编译测试**：
   - 运行 `pnpm run generate` 以测试 Next.js 的静态打包。
   - 运行 `pnpm --filter @haveabreak/maoji tauri build` 测试 Rust 端以及 Android 工程的完整编译流程。

### Manual Verification
1. **编辑器测试 (Web)**：
   - 在浏览器中打开 `/zh/maoji`，测试创建各种模板（日历、姓名牌、二维码等）。
   - 上传彩色图片，验证 Floyd-Steinberg 图像抖动生成的黑白/红白效果是否清晰逼真。
   - 更改墨水屏尺寸，检查画布是否正确重塑大小。
   - 尝试保存设计并重新加载。
2. **NFC 写入测试 (Android 真机)**：
   - 使用 Android 手机安装猫记编译出的 APK。
   - 点击“开始写入”，将手机 NFC 天线贴近 Goodisplay 墨水屏。
   - 观察是否正确捕获 NFC 标签，并开始 0% - 100% 数据写入。
   - 检查写入完成后墨水屏是否能正常启动刷新，并刷新出精美的 Neumorphic 设计。
