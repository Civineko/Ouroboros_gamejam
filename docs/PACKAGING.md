# 原生打包

## 结构

```text
dist/                       Vue + Phaser 的唯一运行时代码
electron/main.cjs           桌面窗口、安全策略和本地文件入口
electron-builder.yml        macOS/Windows 产物配置
capacitor.config.ts         Android WebView 配置
android/                    应提交的 Capacitor 原生工程
resources/icon.svg          原生图标和启动图生成源
scripts/package-android.mjs Android 同步、编译和产物归档
```

原生壳不得拥有玩法状态。Electron 不开放 Node、IPC、外部导航、右键菜单、刷新或页面缩放；Android 使用沉浸式系统栏、横屏、无回弹 WebView，并通过 `src/platform/nativeAppLifecycle.ts` 把原生返回键和后台事件映射为现有游戏动作。

## macOS

要求 Node.js `>=22.13.0`。Apple Silicon 构建：

```bash
npm ci
npm run package:mac
```

产物位于 `release/desktop/mac-arm64/Ouroboros.app`。`.app` 是目录，传输前保留符号链接压缩：

```bash
ditto -c -k --sequesterRsrc --keepParent \
  release/desktop/mac-arm64/Ouroboros.app \
  release/desktop/Ouroboros-macOS-arm64.zip
```

Electron 自带 Chromium/WebGL。当前游戏 `app.asar` 约 6 MB，绝大部分包体来自 Electron Framework；聊天工具直接上传 `.app` 文件夹可能沿符号链接重复计算，必须发送 ZIP。

本地无 Developer ID 时只能生成未公证测试包。公开分发需要 Developer ID Application 签名和 Apple notarization，证书及密码不得进入仓库。

## Windows

```bash
npm ci
npm run package:win
```

产物为 `release/desktop/Ouroboros-<version>-Windows-x64.exe`。macOS Apple Silicon 交叉构建便携目标需要 Rosetta 运行 `makensis`；正式发布仍应在 `windows-latest` CI 或干净 Windows 机器上构建、安装并启动验证。

当前测试包未使用团队代码签名。公开分发前需要 PFX/Azure Trusted Signing，否则 Windows SmartScreen 可能警告。

## Android

要求：

- JDK 21
- Android SDK Platform 36
- Android SDK Build-Tools 35/36
- Gradle Wrapper 8.14.3（已包含在 `android/`）

本机 `android/local.properties` 只保存 SDK 绝对路径，不提交。构建：

```bash
npm ci
npm run android:assets   # 只在图标或启动图变化后执行
npm run package:android
```

产物为 `release/android/Ouroboros-<version>-debug.apk`。脚本会依次构建 Web、同步 Capacitor、执行 `assembleDebug` 并复制产物。

Debug APK 使用 Android 自动生成的调试证书，仅用于安装测试。Release 需要团队 JKS、alias 和密码；全部通过本机安全存储或 CI Secrets 注入，禁止提交 `*.jks`、`*.keystore`、`*.p12` 或明文密码。

验证命令：

```bash
apksigner verify --verbose --print-certs release/android/Ouroboros-<version>-debug.apk
adb install -r release/android/Ouroboros-<version>-debug.apk
```

## 发布验收

每个平台至少验证：离线启动、开始游戏、键鼠或触控转向、闭环、暂停/继续、结束、重开、音量、资源零 404。桌面检查窗口缩放和失焦暂停；Android 检查返回键、切后台、刘海安全区、横屏触控映射和恢复后不补算大帧。

PR 可以生成未签名测试产物。Tag 发布才允许读取签名 Secrets，并应使用 macOS、Windows、Android 各自的原生 CI runner 构建和验证。
