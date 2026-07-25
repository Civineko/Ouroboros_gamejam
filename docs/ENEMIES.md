# 敌人扩展协议

## 当前类型

| 类型 | 运动目标 | 群体行为 | 图标轮廓 |
| --- | --- | --- | --- |
| `stationary` | 保持生成位置 | 作为其他敌人的避障目标 | 珊瑚色堡垒方印 |
| `wanderer` | 定时随机改变朝向 | 分离、对齐、聚合 | 琥珀色游荡风筝 |
| `tracker` | 朝蛇头移动 | 分离、对齐、聚合 | 薄荷色箭头眼 |

颜色只用于加强识别，类型判断必须依靠 `kind`，视觉识别必须同时依靠轮廓。

## 数据流

```text
enemyCatalog ──> createEnemy ──> Enemy state
                                      │
enemyMotion <──── Game update <───────┘
     │
     └── seek / wander + Boids + overlap correction

Enemy state ──> assets/placeholders/enemyIconPainters ──> Phaser Graphics
```

`Enemy` 只保存可序列化状态。Phaser 对象、绘图函数和输入监听不得进入规则层。

## Boids 顺序

1. `wanderer` 计算随机朝向，`tracker` 计算蛇头方向。
2. 读取更新前的敌人快照，计算 separation、alignment、cohesion。
3. 平滑速度并更新位置。
4. 处理世界边界。
5. 执行圆形重叠校正，确保运动敌人保持最小间距。

## 新增类型

1. 在 `EnemyKind` 增加类型值。
2. 在 `enemyCatalog.ts` 登记颜色、速度倍率和是否运动。
3. 在 `enemyMotion.ts` 增加目标方向策略；通用 Boids 不应复制。
4. 在资源清单登记正式图片；未交付前才在 `assets/placeholders/enemyIconPainters.ts` 登记独立轮廓。
5. 添加行为和持续分离测试。
