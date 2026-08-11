# Line2 六场景浏览器检查点

本目录由 Playwright 1.49.1 在 1600×1000 Chromium 视口下生成。六张图均来自真实 Vite 页面和 MuJoCo WASM 加载结果，不是静态概念图。

## 快速检查

- 总览：`line2-six-scene-contact-sheet.jpg`
- Demo01：`demo01-line2-workcell.png`
- Demo02：`demo02-line2-workcell.png`
- Demo03：`demo03-line2-workcell.png`
- Demo04：`demo04-line2-workcell.png`
- Demo05：`demo05-line2-workcell.png`
- Demo06：`demo06-line2-workcell.png`

上线后可直接替换 URL 中的场景编号：

```text
https://shuaijun-liu.github.io/demo/?line=line2&scene=demo01
https://shuaijun-liu.github.io/demo/?line=line2&scene=demo05
```

## 本检查点已验证

- 六个独立 Line2 MJCF 均成功加载，并显示 WebGL canvas；
- Demo01/03/06 为三台 Panda，Demo02/04/05 为四台 Panda；
- 页面与场景均为 Z-up，桌面、机械臂和工装方向一致；
- 每场均显示真实资产清单、五阶段连续任务路径、协作约束、一次业务故障、恢复动作和终态判据；
- RoboTwin2 GLB 视觉资产的请求无 404，浏览器控制台无 error；
- Line1 可从 Line2 URL 切回且场景编号保持不变。

## 复现

```bash
npm run test:e2e
```

浏览器测试位于 `tests/e2e/line2-scenes.spec.ts`。截图是当前工位构型与任务就绪度的验收产物；后续对象级抓取、交接、工具接触和分流轨迹将以同一 canonical object ID 接入，不需要重搭场景。
