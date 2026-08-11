# Line2 asset provenance

All files in this directory are copied from the local RoboTwin2.0 object asset package. The package's `assets/objects/README.md` declares `MIT License`; the preserved license text is in `public/licenses/robotwin2-assets-MIT.txt`.

No source asset was overwritten. Line2 uses the smallest recognizable local variant to keep GitHub Pages loading practical. Collision variants are intentionally used for several objects because they retain the real object silhouette at a much smaller public size; the apple and screwdriver use their textured visual variants.

| Public file | RoboTwin2 source path under `assets/objects/` | Bytes | SHA-256 | Use |
|---|---|---:|---|---|
| `battery.glb` | `061_battery/collision/base3.glb` | 19,480 | `bc245f5e8c61b8802fc2cc39f5bbae4cd922f19494a5b4a7b8de308d36139fcd` | Demo01 electronic parts |
| `box.glb` | `037_box/visual/base0.glb` | 13,132 | `74a45e5ea7cde9a2cae63ef5aab5ea3b461f55c336650fd580264c09c8b3200a` | Cartons, connectors and medicine boxes |
| `tray.glb` | `008_tray/collision/base0.glb` | 222,048 | `77d926998fb1a58ea2c2951be3221fff561c5e8df5af317fa0dd23bdbd6b7373` | Feed, merge and output trays |
| `scanner.glb` | `024_scanner/collision/base4.glb` | 268,572 | `8fb8f2076e95ec412281ae5b55a0113e93caecc387916fa7fdc88c6fbd3432ad` | SKU, seam and pharmacy verification |
| `electronic-scale.glb` | `072_electronicscale/collision/base5.glb` | 186,376 | `397518ae577b2fc78b0bec72a0fae3137bd8669bab40efd738dc95dd113a9b8e` | Demo03 weight check |
| `screwdriver.glb` | `032_screwdriver/visual/base0.glb` | 1,699,896 | `800789c5692a9b791b37b2a06f9caf1f069a6a1266e07bd48683548f7d737c8b` | Demo04 tool dock |
| `pill-bottle.glb` | `080_pillbottle/collision/base5.glb` | 442,732 | `1a52f483221d8b41955ad77ccd76fc945d932ef054a04d8d053466dadad1a5aa` | Demo05 medicine objects |
| `apple.glb` | `035_apple/visual/base0.glb` | 1,671,820 | `80dcf0a725dd720073862af880e8830a52355b73050d5d6573712b41c17dcb8f` | Demo03 food proxy and Demo06 fruit |

Total public GLB size: 4,524,056 bytes. Each asset is below 15 MB and the complete set is below the 45 MB Line2 budget.
