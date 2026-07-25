# 增益道具扩展协议

## 当前规则

场上最多存在一个道具。道具每 `12–18s` 尝试刷新一次，存在 `10s` 后消失；刷新点位于蛇头附近，同时避开蛇身、敌人和世界边缘。满生命时不刷新回生，已有护环时不刷新护环。

| 类型 | 效果 | 持续时间 | 叠加规则 |
| --- | --- | --- | --- |
| `shield` | 抵消下一次蛇头伤害 | 直到触发 | 最多 1 层 |
| `heal` | 恢复 1 点生命 | 即时 | 不超过生命上限 |
| `stasis` | 敌人速度变为 `0.55×` | `5s` | 再次拾取刷新时间 |
| `haste` | 蛇速 `1.18×`，转向 `1.12×` | `5s` | 再次拾取刷新时间 |
| `resonance` | 首尾闭环距离由 `34` 放宽到 `48` | `8s` | 再次拾取刷新时间 |

拾取判定在敌人移动和蛇头受击之前执行，因此同一帧取得的护环或凝滞会立即生效。持续效果只保存 `kind + remaining`，基础速度和闭环规则不被永久修改。

## 模块边界

```text
engine/types.ts                         跨层类型与领域事件
engine/powerups/powerUpCatalog.ts       名称、权重、时长、碰撞半径
engine/powerups/powerUpSpawn.ts         资格筛选、权重抽取、安全点规划
engine/powerups/powerUpEffects.ts       效果应用、倒计时、运行时修正值
engine/powerups/powerUpSystem.ts        TTL、刷新、拾取的单帧调度
phaser/OuroborosSceneView.ts            场内道具同步与动画
phaser/assets/assetCatalog.ts            正式资源 key、路径与交付状态
components/PowerUpBar.vue               只读增益状态展示
```

规则层不导入 Phaser 或 Vue。Phaser 不决定效果数值，Vue 不持有可变 `GameState`。`HudSnapshot.buffs` 以 `5Hz` 更新，用于显示倒计时，不增加每帧 Vue 响应式开销。

## 新增一种道具

1. 在 `PowerUpKind` 中加入类型；若为持续效果，同时加入 `TimedPowerUpKind`。
2. 在 `powerUpCatalog.ts` 登记权重、时长、半径和名称。
3. 在 `powerUpEffects.ts` 实现即时处理或派生修正值，并补规则测试。
4. 如有特殊刷新资格，在 `powerUpSpawn.ts` 添加纯函数条件并补点位测试。
5. 在 `assetCatalog.ts`、`PowerUpBar.vue` 和 `ART_ASSETS.md` 登记表现；资源未交付时再添加程序占位。
6. 验证重复拾取、暂停、重新开始、到期和同帧碰撞顺序。

不要为每种道具建立 Scene 子类，也不要在 `gameEngine.ts` 中继续堆叠图标或美术判断。只有需要独立生命周期的复杂实体（例如可被敌人摧毁的道具）才升级为单独系统。
