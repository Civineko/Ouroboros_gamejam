# Ouroboros runtime art

此目录只存放浏览器运行时直接加载的游戏美术成品，不存放 PSD、Aseprite、Procreate 等源文件。

```text
characters/snake/       蛇头、蛇身、蛇尾
characters/enemies/     各敌人类型
characters/bosses/      Boss 动作表与外置核心
environment/stage/      游戏场地与环境
effects/                命中、闭环等特效
ui/                     品牌与网页图标
audio/                  BGM、玩法音效及来源说明
```

文件名、尺寸、朝向、透明边距和完整 TODO 见 [美术资源需求](../../../docs/ART_ASSETS.md)。资源交付后，还需要在 `src/features/ouroboros/phaser/assets/assetCatalog.ts` 将对应状态从 `todo` 改为 `ready`。
