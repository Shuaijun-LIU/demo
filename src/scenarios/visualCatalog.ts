export type VisualScenarioId =
  | "demo01"
  | "demo02"
  | "demo03"
  | "demo04"
  | "demo05"
  | "demo06";

export type Accent = "cyan" | "violet" | "amber";
export type DestinationTone = "green" | "amber" | "red";

export interface VisualArm {
  readonly id: string;
  readonly role: string;
  readonly detail: string;
  readonly color: Accent;
  readonly segments: readonly [string, string];
}

export interface VisualPart {
  readonly id: string;
  readonly task: string;
  readonly target: string;
  readonly state: string;
  readonly fault?: boolean;
}

export interface VisualDestination {
  readonly title: string;
  readonly detail: string;
  readonly tone: DestinationTone;
}

export interface VisualScenario {
  readonly id: VisualScenarioId;
  readonly number: string;
  readonly tabTitle: string;
  readonly armLabel: string;
  readonly armCount: 3 | 4;
  readonly eyebrow: string;
  readonly title: string;
  readonly subtitle: string;
  readonly missionCode: string;
  readonly missionTitle: string;
  readonly missionCopy: string;
  readonly parts: readonly VisualPart[];
  readonly arms: readonly VisualArm[];
  readonly destinations: readonly VisualDestination[];
  readonly equipment: readonly string[];
}

export const VISUAL_SCENARIOS: readonly VisualScenario[] = [
  {
    id: "demo01",
    number: "01",
    tabTitle: "精密元器件",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "DEMO 01 / ELECTRONICS INSPECTION",
    title: "精密元器件检测与上料",
    subtitle: "三臂环绕工位 · 五件物料 · 双面视觉检测 · 功能测试与分流",
    missionCode: "3A",
    missionTitle: "三臂检测工位",
    missionCopy: "确认上料、双面检测、测试分流的空间关系",
    arms: [
      { id: "ARM 1", role: "上料", detail: "混料盘 → 交接区", color: "cyan", segments: ["FEED P1", "PREP P2"] },
      { id: "ARM 2", role: "双面检测", detail: "交接区 → 视觉工位", color: "violet", segments: ["RECEIVE P1", "INSPECT P1"] },
      { id: "ARM 3", role: "测试分拣", detail: "测试台 → A / B / NG", color: "amber", segments: ["TEST P1", "ROUTE A1"] },
    ],
    parts: [
      { id: "P1", task: "双臂交接", target: "A1", state: "READY" },
      { id: "P2", task: "双面检测", target: "B1", state: "QUEUED" },
      { id: "P3", task: "背标复核", target: "NG", state: "FAULT SCRIPT", fault: true },
      { id: "P4", task: "功能测试", target: "B2", state: "QUEUED" },
      { id: "P5", task: "功能测试", target: "A2", state: "QUEUED" },
    ],
    destinations: [
      { title: "A 合格品", detail: "A1 / A2", tone: "green" },
      { title: "B 合格品", detail: "B1 / B2", tone: "amber" },
      { title: "NG 隔离", detail: "P3 缺陷", tone: "red" },
    ],
    equipment: ["混料输送线与 P1–P5", "双面视觉检测门架", "功能测试台与三向料框"],
  },
  {
    id: "demo02",
    number: "02",
    tabTitle: "汽车线束",
    armLabel: "四臂",
    armCount: 4,
    eyebrow: "DEMO 02 / HARNESS ROUTING",
    title: "汽车低压线束四臂布线",
    subtitle: "四臂围绕布线板 · 连接器定位 · 线束入槽 · 卡扣锁止与复核",
    missionCode: "4H",
    missionTitle: "四臂线束工位",
    missionCopy: "确认长线束、布线板、卡扣与四臂可达区",
    arms: [
      { id: "ARM 1", role: "左端上料", detail: "连接器 A → 定位座", color: "cyan", segments: ["LOAD CONN-A", "HOLD LEFT"] },
      { id: "ARM 2", role: "右端上料", detail: "连接器 B → 定位座", color: "violet", segments: ["LOAD CONN-B", "HOLD RIGHT"] },
      { id: "ARM 3", role: "线束入槽", detail: "中段理线 → 卡槽", color: "amber", segments: ["ROUTE HARNESS", "PRESS CLIPS"] },
      { id: "ARM 4", role: "锁止复核", detail: "卡扣锁止 → 视觉复核", color: "cyan", segments: ["LOCK CLIPS", "VERIFY PATH"] },
    ],
    parts: [
      { id: "C-A", task: "左端定位", target: "J01", state: "READY" },
      { id: "C-B", task: "右端定位", target: "J08", state: "READY" },
      { id: "H-01", task: "协同布线", target: "BOARD", state: "QUEUED" },
      { id: "CL-4", task: "卡扣锁止", target: "CLIP 4", state: "QUEUED" },
      { id: "CL-6", task: "缺扣复核", target: "REWORK", state: "FAULT SCRIPT", fault: true },
    ],
    destinations: [
      { title: "完成工位", detail: "HARNESS OK", tone: "green" },
      { title: "返修工位", detail: "CLIP REWORK", tone: "amber" },
      { title: "异常隔离", detail: "MISSING CLIP", tone: "red" },
    ],
    equipment: ["全尺寸低压线束布线板", "八组定位卡槽与连接器座", "末端视觉复核门架"],
  },
  {
    id: "demo03",
    number: "03",
    tabTitle: "食品装盒",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "DEMO 03 / FLEXIBLE CARTONING",
    title: "食品多规格装盒",
    subtitle: "三臂并行供料 · S / M / L 三规格纸盒 · 组合装箱 · 称重剔除",
    missionCode: "3F",
    missionTitle: "柔性装盒工位",
    missionCopy: "确认三条供料线、开盒台与称重分流布局",
    arms: [
      { id: "ARM 1", role: "开盒供盒", detail: "纸盒库 → 成型位", color: "cyan", segments: ["ERECT CARTON", "PRESENT BOX"] },
      { id: "ARM 2", role: "组合装填", detail: "食品线 → S / M / L", color: "violet", segments: ["PICK PRODUCTS", "PACK ORDER"] },
      { id: "ARM 3", role: "封盒分流", detail: "封盖 → 称重 → 出料", color: "amber", segments: ["CLOSE CARTON", "ROUTE ORDER"] },
    ],
    parts: [
      { id: "O-21", task: "S 规格装盒", target: "S", state: "READY" },
      { id: "O-22", task: "M 规格装盒", target: "M", state: "QUEUED" },
      { id: "O-23", task: "L 规格装盒", target: "L", state: "QUEUED" },
      { id: "O-24", task: "组合装填", target: "M", state: "QUEUED" },
      { id: "O-25", task: "欠重剔除", target: "NG", state: "FAULT SCRIPT", fault: true },
    ],
    destinations: [
      { title: "合格出料", detail: "S / M / L", tone: "green" },
      { title: "补料复称", detail: "UNDERWEIGHT", tone: "amber" },
      { title: "NG 剔除", detail: "ORDER O-25", tone: "red" },
    ],
    equipment: ["三规格纸盒库与开盒台", "双食品供料输送线", "动态称重与 NG 剔除滑道"],
  },
  {
    id: "demo04",
    number: "04",
    tabTitle: "大型构件",
    armLabel: "四臂",
    armCount: 4,
    eyebrow: "DEMO 04 / LARGE ASSEMBLY",
    title: "大型构件四臂协同装配",
    subtitle: "四臂同步抓持 · 长梁对中 · 横撑插装 · 双侧紧固与安全互锁",
    missionCode: "4A",
    missionTitle: "大型构件装配岛",
    missionCopy: "确认长构件、四基座、装配夹具与共享区尺度",
    arms: [
      { id: "ARM 1", role: "左端举升", detail: "长梁左端 → 定位架", color: "cyan", segments: ["GRIP LEFT", "LIFT SYNC"] },
      { id: "ARM 2", role: "右端举升", detail: "长梁右端 → 定位架", color: "violet", segments: ["GRIP RIGHT", "LIFT SYNC"] },
      { id: "ARM 3", role: "横撑插装", detail: "横撑料架 → 装配孔", color: "amber", segments: ["FETCH BRACE", "INSERT BRACE"] },
      { id: "ARM 4", role: "双侧紧固", detail: "螺栓盘 → 扭矩复核", color: "cyan", segments: ["FASTEN BOLTS", "TORQUE CHECK"] },
    ],
    parts: [
      { id: "BEAM-L", task: "同步举升", target: "FIXTURE", state: "READY" },
      { id: "BEAM-R", task: "同步举升", target: "FIXTURE", state: "READY" },
      { id: "BRACE", task: "横撑插装", target: "SLOT", state: "QUEUED" },
      { id: "BOLT-1", task: "左侧紧固", target: "18 Nm", state: "QUEUED" },
      { id: "BOLT-2", task: "滑牙恢复", target: "REWORK", state: "FAULT SCRIPT", fault: true },
    ],
    destinations: [
      { title: "装配完成", detail: "TORQUE OK", tone: "green" },
      { title: "二次紧固", detail: "RE-TORQUE", tone: "amber" },
      { title: "安全保持", detail: "FAULT HOLD", tone: "red" },
    ],
    equipment: ["双梁同步举升夹具", "横撑与紧固件料架", "四臂共享区安全光幕"],
  },
  {
    id: "demo05",
    number: "05",
    tabTitle: "智能药房",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "DEMO 05 / PHARMACY RECOVERY",
    title: "智能药房错拣纠正",
    subtitle: "三臂货架拣选 · 处方复核 · 错药拦截 · 原位回库与补拣",
    missionCode: "3P",
    missionTitle: "处方拣选工作站",
    missionCopy: "确认药品墙、处方周转箱、复核台和隔离箱",
    arms: [
      { id: "ARM 1", role: "左柜拣选", detail: "A 区药架 → 处方箱", color: "cyan", segments: ["PICK A-ZONE", "PLACE TOTE"] },
      { id: "ARM 2", role: "右柜拣选", detail: "B 区药架 → 处方箱", color: "violet", segments: ["PICK B-ZONE", "PLACE TOTE"] },
      { id: "ARM 3", role: "复核纠错", detail: "视觉复核 → 回库 / 补拣", color: "amber", segments: ["VERIFY RX", "RECOVER ERROR"] },
    ],
    parts: [
      { id: "RX-31", task: "处方拣选", target: "TOTE 1", state: "READY" },
      { id: "MED-A", task: "左柜取药", target: "TOTE 1", state: "QUEUED" },
      { id: "MED-B", task: "右柜取药", target: "TOTE 1", state: "QUEUED" },
      { id: "MED-X", task: "错药回库", target: "BIN B4", state: "FAULT SCRIPT", fault: true },
      { id: "MED-C", task: "补拣复核", target: "TOTE 1", state: "QUEUED" },
    ],
    destinations: [
      { title: "处方完成", detail: "RX VERIFIED", tone: "green" },
      { title: "原位回库", detail: "RETURN BIN", tone: "amber" },
      { title: "错药隔离", detail: "MED-X", tone: "red" },
    ],
    equipment: ["双侧可视化药品货架", "处方周转箱输送台", "条码视觉复核与错药隔离箱"],
  },
  {
    id: "demo06",
    number: "06",
    tabTitle: "岭南果品",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "DEMO 06 / FRUIT SORTING",
    title: "岭南果品分选去核复作业",
    subtitle: "三臂柔性抓取 · 外观分级 · 去核加工 · 卡果恢复与果核分流",
    missionCode: "3G",
    missionTitle: "果品分选加工线",
    missionCopy: "确认果品输送、分级盘、去核机与副产物料箱",
    arms: [
      { id: "ARM 1", role: "柔性上料", detail: "散料带 → 视觉盘", color: "cyan", segments: ["PICK FRUIT", "PRESENT VISION"] },
      { id: "ARM 2", role: "分级去核", detail: "分级盘 → 去核夹具", color: "violet", segments: ["GRADE FRUIT", "LOAD PITTER"] },
      { id: "ARM 3", role: "复作分流", detail: "成品 / 果核 / 卡果恢复", color: "amber", segments: ["UNLOAD PITTER", "RECOVER JAM"] },
    ],
    parts: [
      { id: "F-41", task: "外观分级", target: "GRADE A", state: "READY" },
      { id: "F-42", task: "去核加工", target: "PITTER", state: "QUEUED" },
      { id: "F-43", task: "尺寸分级", target: "GRADE B", state: "QUEUED" },
      { id: "F-44", task: "卡果恢复", target: "REWORK", state: "FAULT SCRIPT", fault: true },
      { id: "PIT-4", task: "果核分流", target: "BYPRODUCT", state: "QUEUED" },
    ],
    destinations: [
      { title: "A 级果品", detail: "PREMIUM", tone: "green" },
      { title: "B 级加工", detail: "PROCESS", tone: "amber" },
      { title: "复作 / 果核", detail: "RECOVERY", tone: "red" },
    ],
    equipment: ["柔性上料与视觉分级带", "双工位自动去核夹具", "A/B 分级箱与果核副产物箱"],
  },
];

export function getVisualScenario(id: VisualScenarioId): VisualScenario {
  const scenario = VISUAL_SCENARIOS.find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown visual scenario: ${id}`);
  return scenario;
}
