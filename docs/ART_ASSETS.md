# 衔尾蛇美术与音频资源需求

## 用途与范围

本文档是美工、音频、Vue UI、Phaser 表现开发与集成人员之间的交付协议。审计范围以当前已实现的全屏 UI、新手引导、三类敌人、五种增益、首个 Boss、碰撞、闭环、暂停和结束状态为准，不包含其他尚未实现的玩法。

当前版本的美术大量使用 Phaser 程序绘制、Lucide 图标与 CSS 作为占位；首个 Boss 的战斗音乐、冲刺、出场、核心命中和击败音频已经接入，其他音频仍待交付。审计范围包含首个 Boss“噬环者”及其外置核心、冲撞预警和危险尾迹。所有成品必须随 Windows `.exe` 和 Android `.apk` 离线打包；浏览器预览不是最终交付物。

### 优先级与状态

- `P0`：核心玩法识别和基本声音反馈，正式发布前必须完成。
- `P1`：现有玩法的必要状态反馈，完成后才算表现闭环。
- `P2`：品牌和重复体验优化，不阻塞核心玩法验收。
- `TODO`：尚未交付或尚未在运行时接入。
- `READY`：成品已接入，并通过 `.exe`、`.apk` 真机/实机验收。
- 文档表格使用大写状态；`assetCatalog.ts` 中对应值仍使用现有的小写 `"todo"` / `"ready"`。

表格中的资源条目是长期交付记录。资源完成后把状态从 `TODO` 改为 `READY`，不要删除条目；应删除的是已经没有引用的程序占位、临时图标和空目录占位文件。

## 目录约定

```text
public/assets/ouroboros/                       最终安装包内的运行时成品
├── characters/snake/                         蛇头、蛇身、蛇尾
├── characters/enemies/                       三类敌人
├── characters/bosses/                        Boss 本体与核心
├── environment/stage/                        场地
├── items/powerups/                           五种增益道具
├── effects/                                  命中、闭环与增益状态反馈
├── ui/                                       品牌与应用图标
└── audio/
    ├── music/                                BGM 与结束短曲
    ├── sfx/gameplay/                         受击、闭环、护盾
    ├── sfx/powerups/                         五种增益拾取音
    └── ui/                                   开始、暂停、继续、重开反馈

src/features/ouroboros/phaser/assets/
├── assetCatalog.ts                           Phaser key、路径、交付状态
├── preloadOuroborosArt.ts                    只预加载 READY 美术
└── placeholders/                             尚未替换的程序绘制占位

src/features/ouroboros/phaser/audio/           集中式运行时音频接入
├── audioCatalog.ts                           key、路径、分类、音量与循环配置
├── preloadOuroborosAudio.ts                  统一预加载已登记音频
└── OuroborosAudioController.ts               解锁、播放、暂停与生命周期管理
```

- PSD、Aseprite、Procreate、工程采样和未压缩音频母带不要放进 `public/`；使用团队设计盘或 Git LFS 保存。
- `public/` 只放安装包运行时直接读取的 PNG、WebP、SVG、spritesheet 和压缩音频。
- 美术命名使用 `类型_对象_状态`，全小写下划线，例如 `spr_enemy_tracker.png`。
- 音频使用 `bgm_`、`stinger_`、`sfx_`、`ui_` 前缀；变体以 `_01`、`_02` 结尾。
- Phaser 世界资源必须先登记到 `assetCatalog.ts`，不允许在 Scene 中写裸路径。
- Vue 覆盖层资源路径必须集中在单一常量模块后再接入，不要在多个组件模板中重复硬编码。
- 音频统一登记到 `audioCatalog.ts`；Scene 只发送现有状态或 `GameEvent`，不直接散写文件路径和混音参数。

## 美术统一规格

- 游戏世界：`1440 x 900`；视口由全屏容器决定，相机在世界边界内跟随蛇头。
- 风格：扁平、清晰轮廓、轻复古纸张感；优先保证缩小后的剪影识别，不依赖颜色区分类型。
- 色彩基线：场地蓝 `#48678f`、蛇身青绿 `#5c9e94`、珊瑚红 `#ef624f`、琥珀黄 `#f2ba49`、深墨色 `#263b42`。
- 角色成品使用透明背景、sRGB；主体四周至少保留 `8px` 透明安全边距。
- 蛇头与移动敌人默认朝右，运行时以中心点为旋转轴；静态敌人不旋转。
- 不把投影、到期闪烁或受击透明度烘焙进图片，这些状态由 Phaser 控制。
- 美术不得自行改变碰撞尺寸；蛇身宽 `22px`、蛇头视觉半径 `17px`、敌人显示直径约 `24-34px`。
- UI 状态图标需在 Android 小屏和 Windows 高 DPI 下保持轮廓清晰，不包含不可缩放的小字。

## 美术资源清单

表中路径均相对于 `public/assets/ouroboros/`。

| 优先级 | 状态 | 资源 | 交付路径 | 建议规格 | 运行时要求 | 当前占位 / 缺口 |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | TODO | 场地地砖 | `environment/stage/tex_stage_tile.webp` | `256x256` 无缝 WebP，<= 100KB | 平铺覆盖世界，低细节，不伪造碰撞边界 | `OuroborosSceneView.drawBackground` 网格 |
| P0 | TODO | 蛇头 | `characters/snake/spr_snake_head.png` | `64x64` 透明 PNG | 朝右、中心旋转，舌头不得超出画布 | `OuroborosSceneView.drawHead` |
| P0 | TODO | 蛇身条带 | `characters/snake/tex_snake_body_strip.png` | `64x32`，左右无缝 | 主体视觉厚度对应 `22px` | `OuroborosSceneView.drawBody` 线条 |
| P0 | TODO | 蛇尾 | `characters/snake/spr_snake_tail.png` | `48x48` 透明 PNG | 中心锚点，视觉半径约 `13px` | `OuroborosSceneView.drawBody` 圆形 |
| P0 | TODO | 静态敌人 | `characters/enemies/spr_enemy_stationary.png` | `64x64` 透明 PNG | 方/盾类稳定剪影，不旋转 | `placeholders/enemyIconPainters.ts` |
| P0 | TODO | 游荡敌人 | `characters/enemies/spr_enemy_wanderer.png` | `64x64` 透明 PNG | 朝右，风筝/漂移类剪影 | `placeholders/enemyIconPainters.ts` |
| P0 | TODO | 追踪敌人 | `characters/enemies/spr_enemy_tracker.png` | `64x64` 透明 PNG | 朝右，箭头/眼类追踪剪影 | `placeholders/enemyIconPainters.ts` |
| P0 | READY | 噬环者本体（动作表第 0 帧） | `characters/bosses/sheet_boss_devourer_actions.png` | 第 0 帧 `160x160` 透明 PNG | 朝右、中心旋转；阶段色由护甲环表达，冲撞预警时程序染红 | 已并入正式动作表，不再单独打包静态本体 |
| P0 | READY | 噬环者外置核心 | `characters/bosses/spr_boss_devourer_core.png` | `64x64` 透明 PNG | 中心锚点；运行时距本体中心约 `155px`；缩小后仍明显可圈取 | 正式贴图已接入，重组时变暗加叉，暴露时显示捕获环 |
| P0 | READY | 噬环者动作差分 | `characters/bosses/sheet_boss_devourer_actions.png` | `1120x160` 透明 PNG，横排 7 帧，每帧 `160x160` | 全部朝右、中心锚点和脚底基线固定；见下方帧位定义 | 正式 spritesheet 已接入，状态映射位于 `bossArtFrames.ts` |
| P1 | TODO | 护环道具 | `items/powerups/spr_powerup_shield.png` | `48x48` 透明 PNG | 盾形、浅蓝主色、中心锚点 | `placeholders/powerUpIconPainters.ts` |
| P1 | TODO | 回生道具 | `items/powerups/spr_powerup_heal.png` | `48x48` 透明 PNG | 十字形、珊瑚红主色、中心锚点 | `placeholders/powerUpIconPainters.ts` |
| P1 | TODO | 凝滞道具 | `items/powerups/spr_powerup_stasis.png` | `48x48` 透明 PNG | 雪花形、紫蓝主色、中心锚点 | `placeholders/powerUpIconPainters.ts` |
| P1 | TODO | 疾行道具 | `items/powerups/spr_powerup_haste.png` | `48x48` 透明 PNG | 闪电形、琥珀黄主色、中心锚点 | `placeholders/powerUpIconPainters.ts` |
| P1 | TODO | 共鸣道具 | `items/powerups/spr_powerup_resonance.png` | `48x48` 透明 PNG | 同心环形、青绿主色、中心锚点 | `placeholders/powerUpIconPainters.ts` |
| P1 | TODO | 闭环净化粒子 | `effects/fx_capture_particle.png` | `32x32` 透明 PNG | 可着色、中心锚点；仅用于成功净化 | Phaser 多边形闪光 |
| P1 | TODO | 命中特效 | `effects/sheet_hit_burst.png` | 单帧 `128x128`，6-8 帧横排 | `10-14fps`，首尾帧透明；敌人消失与蛇头受击共用，不改变命中时机 | 蛇头透明闪烁 |
| P1 | TODO | 通用增益拾取特效 | `effects/sheet_powerup_collect.png` | 单帧 `64x64`，6 帧横排 | `12-16fps`，单色可着色，五种道具按定义颜色复用 | 当前仅让场上道具直接消失 |
| P1 | TODO | 增益激活光环 | `effects/fx_buff_aura.png` | `96x96` 透明 PNG | 单色可着色；护环常驻，疾行/共鸣短暂强调；凝滞仍以敌人色调反馈 | HUD 有倒计时，场内缺少持续状态反馈 |
| P1 | READY | Boss 冲撞蓄力 | `effects/fx_boss_charge_warning.png` | `64x64` 透明 PNG | 中心锚点、可染色；预警阶段在 Boss 身后旋转放大 | 正式贴图已接入，并叠加全屏红闪、路线走廊和警报文案 |
| P1 | TODO | Boss 腐蚀尾迹 | `effects/fx_boss_corrosive_trail.png` | `64x64` 透明 PNG | 可平铺叠加、边缘柔和；不得遮住蛇头和闭环边界 | Phaser 半透明圆形占位 |
| P2 | TODO | 品牌标志 | `ui/brand_mark.svg` | 正方形 SVG | 适配浅色背景和高 DPI，轮廓清晰 | Lucide `CircleDotDashed` |
| P2 | TODO | favicon | `ui/favicon.svg` | `64x64` SVG | Windows 窗口和浏览器 `16px` 下可辨识 | 当前临时衔尾蛇图标 |

### 增益状态复用规则

- 场上道具图标和 Vue `PowerUpBar` 必须复用同一套五种图形，不再制作一套 HUD 图标。
- 护环需要明确的常驻光环；护盾抵消一次伤害后立即消失。
- 回生是即时效果，只播放拾取特效和血量恢复反馈，不制作常驻状态图。
- 凝滞通过移动敌人的统一降速色调/透明度表现，不需要额外逐敌人贴图。
- 疾行与共鸣可复用 `fx_buff_aura.png` 的不同颜色和短暂缩放；倒计时仍由 Vue HUD 表示。
- 护环抵消伤害时复用 `fx_buff_aura.png` 的破裂缩放与 `sheet_hit_burst.png` 的着色版本，不增加单独贴图。
- 增益到期闪烁、场上道具脉冲、闭环范围和受击无敌闪烁继续由程序控制，不烘焙成多份图片。

### Boss 动作差分帧位

`sheet_boss_devourer_actions.png` 横向排列，不留帧间空隙；从左到右：

1. `0 待机`：当前站姿，用作动作回落与加载失败基准。
2. `1 追猎 A`：前腿迈出、身体轻微前倾。
3. `2 追猎 B`：后腿迈出、身体轻微压低，与 A 交替形成移动感。
4. `3 蓄力`：重心后移、四肢抓地、头朝目标，不烘焙红光。
5. `4 冲刺`：身体向前拉伸、四肢收拢，右侧轮廓明确尖锐。
6. `5 硬直`：刹停或踉跄、头部下压，用于冲刺后的安全窗口。
7. `6 受击`：身体后仰、表情收紧，不烘焙白闪或伤痕。

每帧保持原本 `160x160` 透明画布、主体中心和脚底高度一致，四周至少 `8px` 透明安全边距。颜色、投影、红色蓄力、受击闪白、阶段色和粒子都由程序处理；不需要为三个阶段重复绘制整套差分。可选的“击败/瓦解”帧暂不需要，现有程序爆炸会完全覆盖本体。

项目方交付的原图为 `3360x590` RGB PNG，棋盘格和底部动作标签已烘焙。运行时版本已确定性裁切、去除背景与标签，并规范为上述 `1120x160` RGBA spritesheet；不把交付原图或重复静态本体打进安装包。

### 不需要单独制作的美术

- 开始、暂停、继续、重开和结束状态继续使用现有 Lucide 图标与 CSS 覆盖层；除非整体 UI 重新定稿，否则不制作重复 SVG。
- 点击/拖动转向反馈使用 Phaser 圆环、缩放和淡出绘制，不新增透明 PNG。
- Boss 吸收敌人连线、冲撞路线、召唤波纹、阶段扩散波、屏外方向箭头、核心捕获指引环、全屏红闪和击败方法 HUD，以及击败时的核心内爆、三重冲击波、放射光束和战果 HUD 由程序绘制，不制作固定方向贴图；冲撞蓄力复用已交付的 `fx_boss_charge_warning.png`，击败粒子后续复用通用 `fx_capture_particle.png`，爆心可复用 `sheet_hit_burst.png`。
- 教学完成复用闭环净化反馈，空环复用程序绘制的闭环闪光，不为同一动作制作第二套图片。
- 场上道具脉冲、到期闪烁、蛇头无敌闪烁和敌人碰撞分离均由程序控制。

## 音频规格

### 格式与母带

- 音频母带：`48kHz / 24-bit WAV`，保存在团队设计盘或 Git LFS，不进入 `public/`。
- 新制作的正式 BGM 默认使用 `48kHz` 立体声 OGG Vorbis，建议 `96-128kbps`，循环点必须无爆音；项目方直接提供的 MP3 可以原格式接入，但只能保留一份运行时编码。
- 新制作的 SFX/UI 默认使用 `48kHz` 单声道 OGG Vorbis，建议 `64-96kbps`。当前三个程序生成的 Boss 短音为 `22.05kHz / 16-bit` 单声道 WAV，总计约 `163KB`，用于避免引入额外转码依赖。
- 当前 Boss BGM 使用 HTML5 Audio 流式播放，避免 Android WebView 将 `180.61s` 立体声音乐整体解码进内存；最终 `.exe`/`.apk` 打包链固定后仍需验证 MP3/WAV 解码，再决定是否统一转为 OGG。
- 所有文件首尾去除无意义静音，非循环短音尾部保留自然衰减，禁止归一化到 `0dBFS`。

### 响度与混音基线

- BGM：约 `-18 LUFS-I`，True Peak `<= -1dBTP`。
- 关键玩法 SFX（受击、净化、护盾）：约 `-16` 至 `-14 LUFS`，True Peak `<= -1dBTP`。
- 增益与 UI：约 `-20` 至 `-16 LUFS`，True Peak `<= -2dBTP`。
- 结束短曲：约 `-16 LUFS-I`，True Peak `<= -1dBTP`；播放时 BGM 在 `150-250ms` 内淡出。
- 以上是素材交付基线，最终以游戏内同时播放测试为准；不得通过把所有素材推到同一峰值来获得响度。

## 音频资源清单

表中路径均相对于 `public/assets/ouroboros/`；Boss 音频已经接入，其余条目仍为 `TODO`。

| 优先级 | 状态 | 资源 | 交付路径 | 时长 / 循环 | 事件触发点 | 建议响度 | 当前占位 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P0 | TODO | 游戏 BGM | `audio/music/bgm_gameplay_loop.ogg` | `45-75s`，无缝循环 | `startRound()` 后启动；暂停时暂停，继续时从原位置恢复 | `-18 LUFS-I` | 无声 |
| P0 | TODO | UI 确认 | `audio/ui/ui_confirm.ogg` | `0.12-0.30s`，不循环 | 开始、继续、重新开始按钮；首次点击同时解锁 AudioContext | `-20` 至 `-18 LUFS` | 无声 |
| P0 | TODO | UI 暂停 | `audio/ui/ui_pause.ogg` | `0.12-0.30s`，不循环 | `togglePause()` 切换到暂停时 | `-20` 至 `-18 LUFS` | 无声 |
| P0 | TODO | 蛇头受击 | `audio/sfx/gameplay/sfx_player_hit.ogg` | `0.20-0.50s`，不循环 | `GameEvent: hit` 且 `lives > 0` | `-16` 至 `-14 LUFS` | 无声 |
| P0 | TODO | 闭环净化 | `audio/sfx/gameplay/sfx_loop_capture.ogg` | `0.35-0.80s`，不循环 | `GameEvent: capture`；同一帧只播放一次，不按敌人数叠声 | `-16` 至 `-14 LUFS` | 无声 |
| P0 | TODO | 游戏结束短曲 | `audio/music/stinger_game_over.ogg` | `1.20-2.20s`，不循环 | `GameEvent: game-over`；致命受击不再单独播放 `sfx_player_hit` | `-16 LUFS-I` | 无声 |
| P1 | TODO | 空环反馈 | `audio/sfx/gameplay/sfx_loop_empty.ogg` | `0.20-0.50s`，不循环 | `GameEvent: empty-loop` | `-20` 至 `-18 LUFS` | 无声 |
| P1 | TODO | 护环抵消 | `audio/sfx/gameplay/sfx_shield_block.ogg` | `0.25-0.60s`，不循环 | `GameEvent: shield-blocked` | `-16` 至 `-14 LUFS` | 无声 |
| P1 | TODO | 五种增益拾取音 | `audio/sfx/powerups/sfx_powerup_{shield,heal,stasis,haste,resonance}.ogg` | 各 `0.25-0.65s`，不循环 | `GameEvent: power-up-collected`，按 `kind` 选择 | `-18` 至 `-16 LUFS` | 无声 |
| P1 | READY | Boss 战斗 BGM | `audio/music/bgm_boss_devourer.mp3` | `180.61s`，循环 | `GameEvent: boss-spawned` 后开始；预览已有 Boss 时在开始按钮手势内同步启动；击败、失败或重开时停止 | 运行时音量 `0.56`，最终母带响度待复核 | 项目方提供的 `The_Hunter_s_Last_March.mp3` 已接入 |
| P1 | READY | Boss 冲刺 | `audio/sfx/gameplay/sfx_boss_charge.mp3` | `1.67s`，不循环 | `GameEvent: boss-charge`，每次进入冲刺只播放一次 | 运行时音量 `0.30`，最终母带响度待复核 | 项目方提供的 `大狗大狗叫叫叫-单句.mp3` 已接入并降低混音音量 |
| P1 | READY | Boss 出场 | `audio/sfx/gameplay/sfx_boss_spawn.wav` | `1.10s`，不循环 | `GameEvent: boss-spawned` | 运行时音量 `0.68` | `scripts/generate_boss_sfx.py` 程序生成并接入 |
| P1 | READY | Boss 核心命中 | `audio/sfx/gameplay/sfx_boss_core_hit.wav` | `0.48s`，不循环 | `GameEvent: boss-hit` | 运行时音量 `0.76` | `scripts/generate_boss_sfx.py` 程序生成并接入 |
| P1 | READY | Boss 击败 | `audio/sfx/gameplay/stinger_boss_defeated.wav` | `2.20s`，不循环 | `GameEvent: boss-defeated`，先停止 Boss BGM | 运行时音量 `0.72` | `scripts/generate_boss_sfx.py` 程序生成并接入 |
| P2 | TODO | BGM 备用循环 | `audio/music/bgm_gameplay_loop_02.ogg` | `45-75s`，无缝循环 | 仅用于降低长局重复感；与主循环同响度、同调性 | `-18 LUFS-I` | 无 |

五种增益拾取音的完整文件名为：

- `sfx_powerup_shield.ogg`
- `sfx_powerup_heal.ogg`
- `sfx_powerup_stasis.ogg`
- `sfx_powerup_haste.ogg`
- `sfx_powerup_resonance.ogg`

### 不需要制作的音频

- 不为蛇的持续移动、相机跟随或每帧转向制作循环声，避免疲劳和移动端声道占用。
- 当前没有普通敌人攻击、对白和环境交互，不制作对应音频；Boss 只使用清单中已有明确事件的五类声音。
- 触控拖动只需要视觉反馈，不在连续 `pointermove` 上播放声音。
- 敌人刷新没有公开 `GameEvent`，本轮不制作刷新音；后续只有在事件接口明确后再登记。

## 现有事件接入约定

音频控制器只消费现有状态与事件，不能修改判定顺序：

| 现有入口 | 表现行为 |
| --- | --- |
| `startRound()` | 在用户点击/触摸后解锁音频，播放 `ui_confirm`，启动或重置 BGM。 |
| `togglePause()` -> 暂停 | 播放 `ui_pause`，暂停 BGM 与尚未结束的非必要 SFX。 |
| `togglePause()` -> 继续 | 播放 `ui_confirm`，从原播放位置恢复 BGM，不新建第二个循环实例。 |
| `GameEvent: hit` | 非致命时播放受击音；致命时交给 `game-over` 短曲，避免双重峰值。 |
| `GameEvent: capture` | 播放一次净化音；首次教学闭环复用同一资源，不额外发明教学音。 |
| `GameEvent: empty-loop` | 播放低优先级空环音，不遮盖受击和结束反馈。 |
| `GameEvent: power-up-collected` | 按 `kind` 播放对应拾取音。 |
| `GameEvent: shield-blocked` | 播放护环抵消音，优先级高于普通增益拾取音。 |
| `GameEvent: game-over` | 淡出并停止 BGM，播放结束短曲；重新开始时停止旧短曲。 |
| `GameEvent: boss-spawned` | 播放出场音并启动唯一一条 Boss BGM 实例。 |
| `GameEvent: boss-charge` | 停止尚未结束的同类冲刺音，再播放一次项目方提供的冲刺语音。 |
| `GameEvent: boss-hit` | 播放短促核心破甲音，不中断 Boss BGM。 |
| `GameEvent: boss-defeated` | 停止 Boss BGM，播放击败短曲；重开时清理残留声音。 |

## Windows 与 Android 约束

- `.exe` 和 `.apk` 必须包含全部 P0/P1 运行时资源，不得依赖 CDN、网络字体、远程音频或首次启动下载。
- 路径大小写必须与文件完全一致；只使用 Vite/打包壳层可解析的相对资源路径，不使用本机绝对路径。
- Android 禁止绕过用户手势自动播放。首次“开始游戏”点击负责解锁音频；解锁失败时游戏仍可无声运行。
- 应用进入后台、锁屏或失焦时暂停 BGM 和长音；返回前台时只恢复此前处于运行状态的声音，不覆盖用户手动暂停。
- 同时播放声道建议 Windows `<= 8`、Android `<= 6`；同一事件同一帧只发声一次。
- 运行时音频压缩文件总量建议 `<= 8MB`；Android 同时解码音频内存建议 `<= 32MB`，只常驻一条 BGM。
- 避免把大尺寸透明序列拆成大量独立 PNG；优先使用单张 spritesheet，并保证纹理边长不超过常见 Android GPU 的 `2048px` 安全档。
- 美术按实际显示尺寸制作，避免在 Android 上加载远高于需求的 2x/4x 透明纹理；UI SVG 需在目标壳层中验证渲染一致性。
- 发布验收必须在断网状态下安装并启动 `.exe` 与 `.apk`，完整走过开始、教学闭环、暂停/继续、碰撞受击、增益拾取、护环抵消和结束/重开。

## TODO

### P0 核心玩法

- [ ] 输出场地背景，并确认蛇和三类敌人在其上保持足够明度对比。
- [ ] 输出蛇头、无缝蛇身条带、蛇尾三件套。
- [ ] 输出静态、游荡、追踪三类敌人；灰度剪影也必须可区分。
- [ ] 交付主 BGM、UI 确认/暂停、受击、闭环净化和结束短曲。
- [ ] 开发把 P0 美术接入 `assetCatalog.ts`，并建立集中式音频目录与控制器。
- [ ] 在 Windows `.exe` 和 Android `.apk` 中完成断网核心流程验收。

### P1 状态反馈

- [ ] 输出五种增益图标；在 `24px` 显示尺寸下仍能凭剪影区分，并同时供场上道具与 HUD 使用。
- [ ] 输出闭环粒子、命中特效、通用增益拾取和增益光环。
- [ ] 开发用 Phaser 补齐触控转向反馈，并继续复用现有 Lucide 状态图标。
- [ ] 交付空环、护环抵消和五种增益拾取音。
- [ ] 验证触控反馈不遮住蛇头，增益光环不改变碰撞体积，特效不遮挡闭环边界。
- [ ] 验证暂停、后台、恢复和重开不会重复创建 BGM 实例。

### P2 品牌与重复体验

- [ ] 替换品牌标志与临时 favicon。
- [ ] 评估生命、净化等 HUD 图标是否继续使用 Lucide；只有确需定制时再按 `ui/icon_*.svg` 登记，避免装饰性膨胀。
- [ ] 主循环完成并验证后，再决定是否制作第二条同调性 BGM。

### P1 Boss 战

- [x] 接入噬环者本体与外置核心，核心在 Android 小屏下仍能清楚识别。
- [x] 交付并接入 7 帧噬环者动作差分 spritesheet，替换旧静态本体；移动双帧按游戏时间切换，暂停时同步冻结。
- [x] 接入 Boss 冲撞蓄力贴图，并与路线走廊、全屏红闪和警报文案组合。
- [ ] 输出可复用腐蚀尾迹；冲撞路线继续由 Phaser 绘制，不额外制作固定方向贴图。
- [x] 接入 Boss 战斗 BGM、冲刺、出场、核心命中和击败音频，并集中登记到 `audioCatalog.ts`。
- [ ] 在 Windows `.exe` 与 Android `.apk` 中复核两段项目方音频的授权、响度、循环边界和解码兼容性。
- [ ] 验证三阶段护甲、凝滞减速、共鸣双倍破甲和护环抵挡行为。
- [ ] 在 Windows 窗口和 Android 触屏下完成积分触发、预警躲避、闭环破甲和击败流程。

## 接入与清理流程

1. 制作人员按本文档路径交付运行时成品；母版留在设计盘或 Git LFS。
2. 开发检查尺寸、透明、锚点、响度、循环点和文件大小。美术登记到 `assetCatalog.ts`；音频登记到 `audioCatalog.ts`。
3. 只有文件存在且目标平台加载成功后，才能把本表状态从 `TODO` 改成 `READY`、把 `assetCatalog.ts` 的对应值改成 `"ready"`，并勾选对应 TODO。
4. 表现层使用正式 texture/audio key 替换占位；图片、特效和声音不得改变碰撞、增益时长、敌人移动或事件顺序。
5. 单项替换时只删除对应 painter 分支。三类敌人全部接入后再删除 `enemyIconPainters.ts`；五种增益全部接入后再删除 `powerUpIconPainters.ts`。
6. `drawBackground`、`drawHead`、`drawBody` 中的程序占位只有在对应正式资源全部可用且不再作为加载失败回退时才删除。
7. Lucide 状态图标在三个正式 SVG 都接入后删除对应 import；仍被按钮或 HUD 使用的 Lucide 图标不得误删。
8. 目录内第一个真实资源提交后删除该目录的 `.gitkeep`；不要保留无引用的临时图片、测试音频或重复编码格式。
9. 资源表条目保留作为契约和历史，更新状态及“当前占位”说明；不要因为接入完成而删除条目。
10. 完成 `npm run check`、`npm test`、`npm run build`，再执行 Windows、Android 断网安装与完整流程验收。

## 验收清单

- [ ] 文件名、大小写、路径、尺寸与本文档一致，安装包内无远程依赖。
- [ ] PNG/WebP 无多余白边、黑底或错误预乘透明；SVG 在 Windows 和 Android 均正常显示。
- [ ] 移动角色朝右且旋转中心位于主体中心；图片替换后碰撞体积没有变化。
- [ ] 三类敌人与五种增益在 `24px` 和灰度模式下仍能区分。
- [ ] 背景不伪造碰撞墙体，特效和触控反馈不遮挡蛇头、敌人或闭环边界。
- [ ] 音频无削波、爆音、循环断点或重复实例；暂停、后台和恢复行为正确。
- [ ] `.exe` 与 `.apk` 在断网状态可进入游戏并完成开始、教学、暂停、受击、闭环、增益、结束和重开。
- [ ] 正式资源接入后，相关程序占位、临时图标、`.gitkeep` 与无引用文件已按规则清理。
