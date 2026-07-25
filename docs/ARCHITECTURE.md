# 前端架构与分工

## 目标

这套结构服务于一个单一游戏，而不是提前搭建多游戏平台。当前最重要的边界是：玩法规则可测试、Canvas 循环稳定、Vue 组件可独立迭代。

## 依赖方向

```text
components ──> composables ──> engine
     │               │
     │               ├──────> input
     │               └──────> rendering ──> engine types
     └───────────────────────> engine types

shared 不得依赖 features
engine 不得依赖 Vue、DOM 或 Canvas
rendering 不得修改 GameState
```

### `engine/`

玩法的唯一事实来源。`updateGame(state, delta)` 原地推进状态并返回领域事件，闭环、碰撞、成长、敌人刷新都在这里。它不能导入 Vue 或浏览器 API，因此可以在 Node 环境直接测试。

### `rendering/`

读取 `GameState` 并绘制 Canvas。这里可以改颜色、线条、光效和高 DPI 适配，但不能改变生命、得分、敌人或蛇身长度。

### `input/`

把原始按键映射为 `steer / toggle-pause` 等语义动作。未来加入手柄时，应新增适配器，不要把手柄按键写进引擎。

### `composables/`

Vue 与游戏内核的协调层。负责 `requestAnimationFrame`、帧间隔上限、HUD 同步和资源清理。它不实现碰撞或绘图细节。

### `components/`

只负责展示和派发用户意图。组件通过 props 接收快照，通过 emits 通知协调层。组件不得直接修改引擎对象。

## 推荐分工

| 角色 | 主要目录 | 合并前检查 |
| --- | --- | --- |
| 玩法 | `engine/`、对应 `*.spec.ts` | `npm test` |
| Canvas / 动效 | `rendering/`、`OuroborosStage.vue` | 桌面和手机截图 |
| UI / 交互 | `components/`、`styles/` | `npm run check`、响应式检查 |
| 集成 | `composables/`、`app/` | 测试、构建、生命周期清理 |

同一个需求如果跨层，先约定事件或类型，再分别实现。不要让 UI 分支直接传递可变的 `GameState`。

## 运行时流程

1. 输入层产生语义动作。
2. composable 将动作交给引擎。
3. composable 以当前帧间隔推进引擎，并将单帧间隔限制为 `0.034s`。
4. 引擎返回 `hit / capture / empty-loop / game-over` 事件。
5. composable 根据事件更新 HUD。
6. Canvas 每帧读取最新状态绘制，不参与规则判定。

## 改动规则

- 新玩法参数集中放到 `engine/config.ts`，不要散落在 Vue 模板。
- 新的跨层数据先加到 `engine/types.ts`，保持事件为可辨识联合类型。
- 每个规则修复至少新增一个纯函数或引擎测试。
- 热循环中避免创建 Vue 响应式对象；引擎状态保持普通 TypeScript 对象。
- 组件超过约 300 行时，优先按职责拆分，而不是继续堆条件分支。
- 只有真正跨功能复用的代码才能进入 `shared/`。
