# Ouroboros 协作约定

本文件适用于整个仓库。开发、设计、美术和自动化 Agent 在改动前都应先阅读本文件；具体领域规则继续以 `docs/` 下的专题文档为准。

## 项目范围

- 本仓库只维护“衔尾蛇”游戏，不引入三消或原压缩包中的其他页面、后端和数据库代码。
- 前端使用 Vue 3，游戏运行时使用 Phaser，玩法规则使用纯 TypeScript。
- 优先扩展现有模块，不建立第二套状态、渲染、碰撞或资源加载系统。
- 改动应保持可测试、可重启、可在桌面和移动端运行。

## 常用命令

```bash
npm install
npm run dev
npm run check
npm test
npm run build
```

合并前至少执行 `npm run check`、`npm test` 和 `npm run build`。涉及画面、输入、相机或资源时，还要在浏览器中开始一局并做桌面/移动端视觉检查。

## 目录与职责

```text
src/app/                                      Vue 应用装配
src/features/ouroboros/
├── components/                               Vue 展示和用户意图
├── composables/                              Vue 与 Phaser 生命周期协调
├── engine/                                   纯 TypeScript 玩法规则
│   ├── enemies/                              敌人定义、生成、运动、碰撞
│   └── powerups/                             增益定义、生成、效果、调度
├── input/                                    原始输入到语义动作的映射
└── phaser/                                   Scene、渲染、碰撞、相机和资源
    └── assets/
        ├── assetCatalog.ts                   资源 key、路径、交付状态
        ├── preloadOuroborosArt.ts            只加载 ready 资源
        └── placeholders/                     程序绘制占位表现

public/assets/ouroboros/                      浏览器运行时正式美术
docs/                                         架构、玩法和美术交付协议
```

依赖方向：

```text
components -> composables -> phaser -> engine
     |                        |          ^
     +------------------------+----------| engine types

engine 不得依赖 Vue、DOM 或 Phaser
Phaser 可以读取 GameState，但不拥有玩法数值
Vue 只接收只读快照，不直接修改 GameState
```

更完整说明见 `docs/ARCHITECTURE.md`。敌人和增益分别遵守 `docs/ENEMIES.md`、`docs/POWER_UPS.md`。

## 新功能怎么放

1. 先确定规则归属和跨层类型；跨层字段、快照和领域事件放在 `engine/types.ts`。
2. 玩法数值与状态推进放在 `engine/`，并添加相邻的 `*.spec.ts` 测试。
3. 碰撞规则由引擎表达，通过 `CollisionSystem` 使用 Phaser 适配器，不在 Vue 中判断命中。
4. Phaser Scene 负责生命周期和输入转发，`OuroborosSceneView` 及其子模块负责表现。
5. Vue 组件只展示快照、发出用户意图；不要把 Phaser 对象放入响应式状态。
6. 新敌人优先扩展 catalog、生成器和行为组合；新增益优先扩展 `engine/powerups/`，不要把类型分支散落到主循环。
7. 通用数值放 `engine/config.ts`，资源元数据放 catalog，不在模板、Scene 或 painter 中重复定义玩法规则。

## 美术资源工作流

任何新增内容只要需要图片、贴图、spritesheet、特效图或品牌图标，就必须在实现同一个 PR 中登记 `docs/ART_ASSETS.md`，不能只留口头说明或代码注释。

### 1. 需求阶段

在正式美术尚未交付时，按以下顺序处理：

1. 在 `docs/ART_ASSETS.md` 的资源清单增加一行，写清优先级、名称、交付路径、尺寸/格式、运行时要求和当前占位位置。
2. 在文档对应优先级的 TODO 中增加可勾选任务；必要时补充锚点、朝向、帧数、帧率、透明边距、文件大小和移动端要求。
3. 在 `phaser/assets/assetCatalog.ts` 增加唯一 key 和资源记录，路径必须位于 `public/assets/ouroboros/`，初始 `status` 必须为 `todo`。
4. 需要新目录时建立语义明确的目录；目录暂时为空可以放 `.gitkeep`。
5. 用程序绘制或现有通用图标提供占位表现。Phaser 占位代码放 `phaser/assets/placeholders/`，不要把临时图片散落在 `src/`，也不要把绘图逻辑放进 `engine/`。

`todo` 资源不会被预加载，因此正式文件不存在时不会产生 404。Scene 和组件中禁止写 `assets/...` 裸路径，所有 Phaser 资源必须经 `assetCatalog.ts` 登记。

### 2. 正式资源交付

1. 美工把可直接运行的 PNG、WebP、SVG 或 spritesheet 放到清单约定的准确路径。PSD、Aseprite、Procreate 等源文件不要直接放进 `public/`。
2. 开发检查格式、透明背景、尺寸、锚点、朝向、压缩大小和缩小后的可辨识度。
3. 在 `assetCatalog.ts` 将对应 `status` 从 `todo` 改为 `ready`；不要在别处重复调用加载 API。
4. 表现层改为使用 catalog key 对应的 texture，并保留原有碰撞半径和玩法时机。
5. 在桌面和移动端验证加载、缩放、旋转、动画、遮挡和重启行为，确认控制台无 404 或纹理错误。
6. 在 `docs/ART_ASSETS.md` 勾选对应 TODO，并把资源清单的“当前占位”改成“正式资源已接入”或实际渲染入口。

### 3. 接入后的删除与清理

- 正式资源已经覆盖某个占位后，删除该类型不再使用的 painter、临时图形和 import；不要长期保留两套表现。
- 如果一个 placeholder 文件仍服务其他 `todo` 资源，只删除已替换类型的分支；所有类型都替换后再删除整个文件。
- 目录加入第一个真实资源后删除该目录的 `.gitkeep`。
- 不要删除 `assetCatalog.ts` 中正在使用的 key/记录，也不要删除 `ART_ASSETS.md` 的规格清单行；规格是后续替换和验收依据。已完成 TODO 应勾选，集中整理时可移动到“已完成”小节。
- 删除功能本身时，要同时删除运行时资源、catalog key/记录、预加载和渲染引用、占位实现、资源清单行及 TODO。最后用 `rg` 确认没有遗留引用，并清理真正为空的目录。
- 不要因为更换图片而修改碰撞体积、速度或生成规则；确有玩法变化时必须作为单独规则改动并补测试。

### 4. 命名与路径

- 正式资源根目录固定为 `public/assets/ouroboros/`。
- 文件名使用小写下划线和 `类型_对象_状态`，例如 `spr_enemy_tracker.png`、`sheet_hit_burst.png`。
- Phaser key 使用 `ouroboros.<domain>.<name>`，保持唯一且不依赖文件名。
- 移动角色默认朝右、中心锚点；其他规格以 `docs/ART_ASSETS.md` 为准。

## 删除或重构现有代码

- 先用 `rg` 查找调用者，再删除文件、导出或类型；不留下失效 import、死分支和重复实现。
- 不删除与当前任务无关的用户改动，不进行顺手的大范围格式化或目录迁移。
- 迁移职责时先建立新入口和测试，再删除旧入口；最终仓库中只保留一套有效实现。
- 重启必须恢复干净状态：没有遗留 timer、监听器、Phaser 对象或上局增益。

## 完成标准

- 玩法逻辑位于正确层级，并有针对行为风险的测试。
- 新增跨层数据有明确类型，Vue 未持有可变引擎状态。
- 新美术需求已登记资源清单、TODO、catalog 和占位位置。
- 已交付美术完成 `ready` 切换、占位清理和文档勾选。
- `npm run check`、`npm test`、`npm run build` 通过。
- 涉及画面的改动完成浏览器实机检查，无控制台错误、资源 404、遮挡或布局溢出。
