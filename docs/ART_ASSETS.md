# 衔尾蛇美术资源需求与 TODO

## 用途

本文档是美工、Phaser 表现开发与集成人员之间的交付协议。当前版本仍大量使用程序绘制占位图；美工按下列路径交付成品，开发通过统一资源清单接入，不应把图片散落到 Vue 组件或玩法引擎中。

## 目录约定

```text
public/assets/ouroboros/                      浏览器运行时成品
├── characters/snake/                         蛇头、蛇身、蛇尾
├── characters/enemies/                       敌人
├── environment/stage/                        场地
├── effects/                                  游戏特效
└── ui/                                       品牌与网页图标

src/features/ouroboros/phaser/assets/
├── assetCatalog.ts                           Phaser key、路径、交付状态
├── preloadOuroborosArt.ts                    只预加载 ready 资源
└── placeholders/                             尚未替换的程序绘制占位图
```

- PSD、Aseprite、Procreate 等可编辑源文件不要放进 `public/`；使用团队设计盘或 Git LFS 保存。
- 可直接运行的 PNG、WebP、SVG、spritesheet 才进入 `public/assets/ouroboros/`。
- 文件名使用 `类型_对象_状态`，全小写下划线，例如 `spr_enemy_tracker.png`。
- 新资源必须先登记 `assetCatalog.ts`，不允许在 Scene 中写裸路径。

## 统一规格

- 游戏世界：`1440 × 900`；玩家视口保持 `920 × 620`，由相机在世界边界内跟随蛇头。
- 风格：扁平、清晰轮廓、轻复古纸张感；优先保证缩小后的剪影识别，不依赖颜色区分类型。
- 色彩基线：场地蓝 `#48678f`、蛇身青绿 `#5c9e94`、珊瑚红 `#ef624f`、琥珀黄 `#f2ba49`、深墨色 `#263b42`。
- 角色成品使用透明背景、sRGB；主体四周至少保留 `8px` 透明安全边距。
- 蛇头与移动敌人默认朝右，运行时以中心点为旋转轴；静态敌人不旋转。
- 不把投影烘焙进角色图片，投影、闪烁、受击透明度由 Phaser 控制。
- 美术不得自行改变碰撞尺寸；蛇身宽 `22px`、蛇头视觉半径 `17px`、敌人显示直径约 `24–34px`。

## 资源清单

| 优先级 | 资源 | 交付路径 | 建议规格 | 运行时要求 | 当前占位 |
| --- | --- | --- | --- | --- | --- |
| P0 | 场地地砖 | `environment/stage/tex_stage_tile.webp` | `256×256` 无缝 WebP，≤ 100KB | 平铺覆盖 `1440×900` 世界，保持低细节 | `OuroborosSceneView.drawBackground` |
| P0 | 蛇头 | `characters/snake/spr_snake_head.png` | `64×64`，透明 PNG | 朝右、中心旋转，舌头不得超出画布 | `OuroborosSceneView.drawHead` |
| P0 | 蛇身条带 | `characters/snake/tex_snake_body_strip.png` | `64×32`，左右无缝 | 主体视觉厚度对应 `22px` | `OuroborosSceneView.drawBody` |
| P0 | 蛇尾 | `characters/snake/spr_snake_tail.png` | `48×48`，透明 PNG | 中心锚点，视觉半径约 `13px` | `OuroborosSceneView.drawBody` |
| P0 | 静态敌人 | `characters/enemies/spr_enemy_stationary.png` | `64×64`，透明 PNG | 方/盾类稳定剪影，不旋转 | `placeholders/enemyIconPainters.ts` |
| P0 | 游荡敌人 | `characters/enemies/spr_enemy_wanderer.png` | `64×64`，透明 PNG | 朝右，风筝/漂移类剪影 | `placeholders/enemyIconPainters.ts` |
| P0 | 追踪敌人 | `characters/enemies/spr_enemy_tracker.png` | `64×64`，透明 PNG | 朝右，箭头/眼类追踪剪影 | `placeholders/enemyIconPainters.ts` |
| P1 | 闭环粒子 | `effects/fx_capture_particle.png` | `32×32`，透明 PNG | 可着色，中心锚点 | Phaser 多边形闪光 |
| P1 | 命中特效 | `effects/sheet_hit_burst.png` | 单帧 `128×128`，6–8 帧横排 | 首尾帧透明，不改变命中时机 | 头部透明闪烁 |
| P2 | 品牌标志 | `ui/brand_mark.svg` | 正方形 SVG | 适配浅色背景，轮廓清晰 | Lucide `CircleDotDashed` |
| P2 | favicon | `ui/favicon.svg` | `64×64` SVG | 浏览器 16px 下仍可辨识 | 当前临时衔尾蛇图标 |

表中路径均相对于 `public/assets/ouroboros/`。

## 美术 TODO

### P0 核心玩法

- [ ] 输出场地背景，并确认敌人、蛇在其上仍有足够明度对比。
- [ ] 输出蛇头、无缝蛇身条带、蛇尾三件套。
- [ ] 输出静态、游荡、追踪三类敌人；仅看灰度剪影也必须可区分。
- [ ] 用游戏实际显示尺寸检查透明边距、旋转中心和朝向。
- [ ] 开发将 P0 条目在 `assetCatalog.ts` 标记为 `ready`，并替换对应占位渲染。

### P1 反馈效果

- [ ] 输出闭环净化粒子。
- [ ] 输出蛇头受击 spritesheet，并给出帧率建议。
- [ ] 在桌面和手机尺寸确认特效不遮挡蛇头、敌人或闭环边界。

### P2 品牌与 UI

- [ ] 替换品牌标志与临时 favicon。
- [ ] 评估生命、净化、成长图标是否继续使用 Lucide；需要定制时按 `ui/icon_*.svg` 交付。
- [ ] 整理暂停、开始、结束状态的插图需求；当前保持纯 UI，不阻塞 P0。

### P3 Boss 预留

- [ ] 玩法确定后补充 Boss 本体、攻击预警、受击与死亡动画规格。
- [ ] Boss 与普通敌人共用朝右、中心锚点约定，但使用独立 atlas，不塞入普通敌人图片。
- [ ] Boss 场地装饰不得伪装成地图碰撞边界。

## 验收清单

- [ ] 文件名、路径、尺寸与本文档一致。
- [ ] PNG/WebP 无多余白边、黑底或错误预乘透明边。
- [ ] 移动角色均朝右，旋转中心位于主体中心。
- [ ] 三类敌人在 `24px` 显示尺寸与灰度模式下仍能区分。
- [ ] 背景不在地图边缘伪造可碰撞墙体，也不在蛇头附近制造视觉障碍。
- [ ] 开发完成资源状态切换、桌面/手机截图和生产构建检查。

## 交付流程

1. 美工将运行时成品放到本文档指定路径，并在 TODO 中勾选对应条目。
2. Phaser 开发检查透明、尺寸与锚点，在 `assetCatalog.ts` 把对应 `status` 从 `todo` 改成 `ready`。
3. 表现层用正式 texture 替换 `placeholders/` 或 `OuroborosSceneView` 中对应绘制逻辑；玩法层与碰撞参数不随图片改动。
4. 完成 `npm run check`、`npm test`、`npm run build` 和桌面/手机视觉检查后提交。
