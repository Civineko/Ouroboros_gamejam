<template>
  <aside class="intro-panel">
    <span class="kicker">LOOP TO SURVIVE</span>
    <h1>闭环，<br />然后吞噬。</h1>
    <p>只有蛇头与蛇尾相接形成完整圆环，才能消灭被围住的敌人。</p>
  </aside>
</template>

<style scoped>
.kicker {
  color: var(--teal-deep);
  font-size: 9px;
  font-weight: 900;
}

.intro-panel h1 {
  margin: 10px 0 13px;
  font-family: Georgia, "Songti SC", serif;
  font-size: 52px;
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
}

.intro-panel > p {
  margin: 0;
  color: var(--ink-soft);
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 820px) {
  .intro-panel h1 {
    margin: 5px 0 4px;
    font-size: 39px;
  }
}

@media (max-width: 560px) {
  .intro-panel h1 {
    font-size: 34px;
  }
}
</style>
