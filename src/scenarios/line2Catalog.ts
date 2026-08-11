import type { LineId } from "../app/urlState";
import {
  VISUAL_SCENARIOS,
  type VisualScenario,
  type VisualScenarioId,
} from "./visualCatalog";

export interface TaskStage {
  readonly id: string;
  readonly label: string;
  readonly durationSec: number;
  readonly focusArmIds: readonly string[];
}

export interface Line2Scenario extends VisualScenario {
  readonly collaboration: string;
  readonly fault: string;
  readonly recovery: string;
  readonly oracle: string;
  readonly tools: readonly string[];
  readonly assets: readonly string[];
  readonly taskStages: readonly TaskStage[];
}

export const LINE2_SCENARIOS: readonly Line2Scenario[] = [
  {
    id: "demo01",
    number: "01",
    tabTitle: "精密电子",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "LINE 2 / ELECTRONICS INSPECTION",
    title: "精密电子检测、功能测试与上料",
    subtitle: "混料识别 · 正式交接 · 双面检测 · 探针测试 · A/B/NG 分流",
    missionCode: "L2-3E",
    missionTitle: "可追溯电子检测单元",
    missionCopy: "每件物料跨越识别、翻转、检测和测试工序，三臂形成连续流水。",
    arms: [
      { id: "ARM 1", role: "识别上料", detail: "混料盘 → 扫码 → 交接位", color: "cyan", segments: ["SINGULATE", "HANDOFF"] },
      { id: "ARM 2", role: "翻转检测", detail: "正反面相机与缓存位", color: "violet", segments: ["FLIP", "INSPECT"] },
      { id: "ARM 3", role: "测试分流", detail: "探针测试 → A/B/NG", color: "amber", segments: ["PROBE", "ROUTE"] },
    ],
    parts: [
      { id: "P1", task: "双面+功能测试", target: "A1", state: "READY" },
      { id: "P2", task: "双面+功能测试", target: "B1", state: "QUEUED" },
      { id: "P3", task: "背标缺失", target: "NG", state: "FAULT ONCE", fault: true },
      { id: "P4", task: "双面+功能测试", target: "B2", state: "QUEUED" },
      { id: "P5", task: "双面+功能测试", target: "A2", state: "QUEUED" },
    ],
    destinations: [
      { title: "A 上料盘", detail: "P1 / P5", tone: "green" },
      { title: "B 上料盘", detail: "P2 / P4", tone: "amber" },
      { title: "NG 隔离盒", detail: "P3", tone: "red" },
    ],
    equipment: ["ESD 混料盘与扫码器", "双面视觉翻转夹具", "测试探针、工具坞和分流盘"],
    collaboration: "Arm 1 保持 P1，Arm 2 闭合确认后完成正式交接；Arm 3 与前两臂流水重叠。",
    fault: "P3 的背面标记缺失，双面检测只注入一次外观业务异常。",
    recovery: "Arm 2 将 P3 放入旁路缓存，Arm 3 跳过功能测试并送入 NG，流水继续 P4/P5。",
    oracle: "P1→A1，P2→B1，P3→NG，P4→B2，P5→A2；探针归坞、库存守恒、三臂归位。",
    tools: ["平行夹爪", "翻转夹具", "功能测试探针"],
    assets: ["battery", "box", "tray", "scanner"],
    taskStages: [
      { id: "scan", label: "上料与扫码", durationSec: 3, focusArmIds: ["ARM 1"] },
      { id: "handoff", label: "双臂正式交接", durationSec: 3, focusArmIds: ["ARM 1", "ARM 2"] },
      { id: "inspect", label: "翻转与双面检测", durationSec: 4, focusArmIds: ["ARM 2"] },
      { id: "probe", label: "探针功能测试", durationSec: 4, focusArmIds: ["ARM 3"] },
      { id: "route", label: "A/B/NG 分流", durationSec: 3, focusArmIds: ["ARM 3"] },
    ],
  },
  {
    id: "demo02",
    number: "02",
    tabTitle: "汽车线束",
    armLabel: "四臂",
    armCount: 4,
    eyebrow: "LINE 2 / HARNESS ROUTING",
    title: "汽车低压线束强协作布线",
    subtitle: "三锚点协同控线 · 末端插接 · C1–C3 压扣 · C2 补压恢复",
    missionCode: "L2-4H",
    missionTitle: "三锚点线束布线板",
    missionCopy: "三臂同时保持线束形态与张力，第四臂完成卡扣和终检。",
    arms: [
      { id: "ARM 1", role: "起点锚定", detail: "S0 插接并持续保持", color: "cyan", segments: ["SEAT S0", "HOLD"] },
      { id: "ARM 2", role: "中段控线", detail: "随动保持张力", color: "violet", segments: ["ANCHOR MID", "TENSION"] },
      { id: "ARM 3", role: "末端布线", detail: "路径引导 → S1", color: "amber", segments: ["ROUTE", "SEAT S1"] },
      { id: "ARM 4", role: "压扣终检", detail: "C1–C3/B1 与复核", color: "cyan", segments: ["PRESS", "VERIFY"] },
    ],
    parts: [
      { id: "S0", task: "起始连接器", target: "LOCKED", state: "READY" },
      { id: "S1", task: "末端连接器", target: "LOCKED", state: "QUEUED" },
      { id: "C1", task: "卡扣压紧", target: "CLOSED", state: "QUEUED" },
      { id: "C2", task: "半锁止补压", target: "CLOSED", state: "FAULT ONCE", fault: true },
      { id: "C3/B1", task: "卡扣与分支", target: "CLOSED", state: "QUEUED" },
    ],
    destinations: [
      { title: "路径合格", detail: "RMS ≤25 mm", tone: "green" },
      { title: "张力窗口", detail: "0.25–0.75", tone: "amber" },
      { title: "C2 恢复", detail: "RE-PRESS", tone: "red" },
    ],
    equipment: ["倾斜线束布线板", "S0/S1 与 C1–C3 卡扣", "压扣工具坞与终检相机"],
    collaboration: "Arm 1/2/3 在屏障后建立起点、中段、末端三锚点，Arm 4 压扣期间持续 HoldWhile。",
    fault: "C2 首次只进入半锁止状态，到位检测返回失败。",
    recovery: "Arm 4 撤回、重新对准并二次压紧 C2，其他三臂维持锚点与张力。",
    oracle: "S0/S1 锁定，C1–C3/B1 闭合，路径 RMS≤25 mm，张力合格，四臂释放并归位。",
    tools: ["平行夹爪", "线束压扣头", "到位检测相机"],
    assets: ["box", "scanner", "tray"],
    taskStages: [
      { id: "anchors", label: "三锚点同步建立", durationSec: 4, focusArmIds: ["ARM 1", "ARM 2", "ARM 3"] },
      { id: "route", label: "随动控线与末端插接", durationSec: 5, focusArmIds: ["ARM 2", "ARM 3"] },
      { id: "clips", label: "C1–C3 顺序压扣", durationSec: 5, focusArmIds: ["ARM 4"] },
      { id: "recover", label: "C2 撤回补压", durationSec: 4, focusArmIds: ["ARM 1", "ARM 2", "ARM 3", "ARM 4"] },
      { id: "verify", label: "路径与张力终检", durationSec: 3, focusArmIds: ["ARM 4"] },
    ],
  },
  {
    id: "demo03",
    number: "03",
    tabTitle: "食品装盒",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "LINE 2 / FLEXIBLE CARTONING",
    title: "食品多规格装盒、封签与称重",
    subtitle: "订单供料 · 纸盒成型保持 · 协同装填 · 标签检测 · 称重分流",
    missionCode: "L2-3F",
    missionTitle: "U 形柔性包装单元",
    missionCopy: "供料、持盒和装填互相依赖，缺标签产品在称重后被真实分流。",
    arms: [
      { id: "ARM 1", role: "订单供料", detail: "A/B 食品 → 装填缓存", color: "cyan", segments: ["SUPPLY", "BUFFER"] },
      { id: "ARM 2", role: "成型持盒", detail: "蓝/黄盒库 → 夹具", color: "violet", segments: ["ERECT", "HOLD"] },
      { id: "ARM 3", role: "装填质检", detail: "装入 → 封签 → 称重", color: "amber", segments: ["LOAD", "INSPECT"] },
    ],
    parts: [
      { id: "K1", task: "A 产品", target: "BLUE-1", state: "READY" },
      { id: "K2", task: "B 产品", target: "YELLOW-1", state: "QUEUED" },
      { id: "K3", task: "日期标签缺失", target: "NG", state: "FAULT ONCE", fault: true },
      { id: "K4", task: "B 产品", target: "YELLOW-2", state: "QUEUED" },
      { id: "K5", task: "A 产品", target: "BLUE-2", state: "QUEUED" },
    ],
    destinations: [
      { title: "蓝盒出料", detail: "K1 / K5", tone: "green" },
      { title: "黄盒出料", detail: "K2 / K4", tone: "amber" },
      { title: "NG 滑道", detail: "K3", tone: "red" },
    ],
    equipment: ["食品供料与订单缓存", "蓝/黄纸盒库和成型夹具", "封签器、电子秤与 NG 滑道"],
    collaboration: "Arm 2 持盒谓词持续为真，Arm 3 才能装填；Arm 1 同时准备下一订单。",
    fault: "K3 外侧日期标签缺失，称重后视觉复核拒收。",
    recovery: "Arm 3 将 K3 送入 NG，清空称重位并继续 K4/K5，不把缺陷件改判合格。",
    oracle: "K1→Blue-1，K2→Yellow-1，K3→NG，K4→Yellow-2，K5→Blue-2；盒/产品守恒、三臂归位。",
    tools: ["食品适配吸具", "纸盒成型夹具", "封签头"],
    assets: ["box", "tray", "electronic-scale", "apple"],
    taskStages: [
      { id: "supply", label: "订单供料", durationSec: 3, focusArmIds: ["ARM 1"] },
      { id: "carton", label: "纸盒成型与保持", durationSec: 4, focusArmIds: ["ARM 2"] },
      { id: "load", label: "协同装填", durationSec: 4, focusArmIds: ["ARM 2", "ARM 3"] },
      { id: "seal", label: "封签与称重", durationSec: 4, focusArmIds: ["ARM 3"] },
      { id: "route", label: "合格/NG 分流", durationSec: 3, focusArmIds: ["ARM 3"] },
    ],
  },
  {
    id: "demo04",
    number: "04",
    tabTitle: "构件装配",
    armLabel: "四臂",
    armCount: 4,
    eyebrow: "LINE 2 / SUPPORTED ASSEMBLY",
    title: "构件定位、紧固与质量扫描",
    subtitle: "主梁保持 · 连接板对中 · 侧向支撑 · F1/F2 紧固 · 接缝扫描",
    missionCode: "L2-4A",
    missionTitle: "四臂持续支撑装配岛",
    missionCopy: "三臂维持装配体基准与支撑，工具臂完成紧固和故障补作业。",
    arms: [
      { id: "ARM 1", role: "主梁保持", detail: "主梁 → 中央夹具", color: "cyan", segments: ["PLACE BEAM", "HOLD"] },
      { id: "ARM 2", role: "连接板对中", detail: "板件 → 90° 基准", color: "violet", segments: ["ALIGN PLATE", "HOLD"] },
      { id: "ARM 3", role: "工具作业", detail: "工具坞 → F1/F2", color: "amber", segments: ["TOOL PICK", "FASTEN"] },
      { id: "ARM 4", role: "支撑复检", detail: "侧向支撑与接缝扫描", color: "cyan", segments: ["SUPPORT", "SCAN"] },
    ],
    parts: [
      { id: "BEAM", task: "基准保持", target: "FIXTURE", state: "READY" },
      { id: "PLATE", task: "90° 对中", target: "DATUM", state: "QUEUED" },
      { id: "F1", task: "第一次紧固", target: "INSTALLED", state: "QUEUED" },
      { id: "F2", task: "到位失败补作", target: "INSTALLED", state: "FAULT ONCE", fault: true },
      { id: "SEAM", task: "质量扫描", target: "PASS", state: "QUEUED" },
    ],
    destinations: [
      { title: "夹具接管", detail: "ASSEMBLY OK", tone: "green" },
      { title: "F2 补作", detail: "RE-ALIGN", tone: "amber" },
      { title: "保持互锁", detail: "HOLD REQUIRED", tone: "red" },
    ],
    equipment: ["中央装配夹具与基准面", "电动螺丝刀/探针工具坞", "支撑垫与接缝扫描器"],
    collaboration: "Arm 1/2/4 持续满足保持与支撑，Arm 3 才能进入 F1/F2 工具区。",
    fault: "F2 第一次到位开关失败，工具动作不能直接跳到完成。",
    recovery: "Arm 3 撤回、重新对准并补作 F2，Arm 4 复扫；其余两臂全程保持。",
    oracle: "板梁 90°±3°、基准误差≤15 mm、F1/F2/接缝通过、夹具接管、工具归坞、四臂归位。",
    tools: ["平行夹爪", "电动螺丝刀", "低能量检测探头"],
    assets: ["screwdriver", "box", "scanner"],
    taskStages: [
      { id: "place", label: "主梁与连接板就位", durationSec: 5, focusArmIds: ["ARM 1", "ARM 2"] },
      { id: "support", label: "三臂同步保持", durationSec: 3, focusArmIds: ["ARM 1", "ARM 2", "ARM 4"] },
      { id: "f1", label: "取工具并紧固 F1", durationSec: 4, focusArmIds: ["ARM 3"] },
      { id: "f2", label: "F2 失败与补作", durationSec: 5, focusArmIds: ["ARM 1", "ARM 2", "ARM 3", "ARM 4"] },
      { id: "scan", label: "接缝扫描与夹具接管", durationSec: 4, focusArmIds: ["ARM 4"] },
    ],
  },
  {
    id: "demo05",
    number: "05",
    tabTitle: "智能药房",
    armLabel: "四臂",
    armCount: 4,
    eyebrow: "LINE 2 / PHARMACY VERIFICATION",
    title: "智能药房双处方纠错与包装",
    subtitle: "A/B/C 分区拣选 · 双订单汇合 · 扫码计数 · 错药补拣 · PASS 门控包装",
    missionCode: "L2-4P",
    missionTitle: "四臂处方闭环工作站",
    missionCopy: "拣选、复核、纠错和包装各有独立角色，未通过处方不能进入包装位。",
    arms: [
      { id: "ARM 1", role: "A 区拣选", detail: "A1/A2 → 双订单盘", color: "cyan", segments: ["PICK A", "MERGE"] },
      { id: "ARM 2", role: "B/C 区拣选", detail: "B/C 货位 → 双订单盘", color: "violet", segments: ["PICK BC", "REPICK B1"] },
      { id: "ARM 3", role: "扫码纠错", detail: "汇合扫码、计数与退回", color: "amber", segments: ["VERIFY", "RETURN B3"] },
      { id: "ARM 4", role: "包装交付", detail: "PASS 门 → 封签 → 窗口", color: "cyan", segments: ["PACKAGE", "DELIVER"] },
    ],
    parts: [
      { id: "RX-01", task: "A1+B2", target: "SEALED", state: "READY" },
      { id: "RX-02", task: "A2+B1+C1", target: "SEALED", state: "QUEUED" },
      { id: "B3", task: "错误药盒", target: "RETURN BIN", state: "FAULT ONCE", fault: true },
      { id: "B1", task: "补拣正确药盒", target: "RX-02", state: "RECOVERY" },
      { id: "GATE", task: "处方 PASS 门控", target: "PACKAGE", state: "LOCKED" },
    ],
    destinations: [
      { title: "RX-01 包装", detail: "A1 + B2", tone: "green" },
      { title: "RX-02 包装", detail: "A2 + B1 + C1", tone: "amber" },
      { title: "退回箱", detail: "B3", tone: "red" },
    ],
    equipment: ["A/B/C 分区药架", "双处方汇合盘、扫码器和计数台", "PASS 包装门、封签器与取药窗口"],
    collaboration: "Arm 1/2 并行拣选，Arm 3 使用订单 ZoneLock 复核；只有 PASS 后 Arm 4 获得包装区锁。",
    fault: "固定种子下 RX-02 首次误取 B3，扫码与处方集合比较产生一次错药异常。",
    recovery: "Arm 3 将 B3 放入 return bin，Arm 2 补取 B1；复扫通过后才解锁 Arm 4。",
    oracle: "RX-01={A1,B2}，RX-02={A2,B1,C1}，B3 在退回箱；两包封签、库存守恒、四臂归位。",
    tools: ["药盒平行夹爪", "固定扫码器", "包装封签头"],
    assets: ["pill-bottle", "box", "scanner", "tray"],
    taskStages: [
      { id: "pick", label: "A/B/C 并行拣选", durationSec: 4, focusArmIds: ["ARM 1", "ARM 2"] },
      { id: "merge", label: "双订单汇合与扫码", durationSec: 4, focusArmIds: ["ARM 3"] },
      { id: "fault", label: "B3 错药识别与退回", durationSec: 4, focusArmIds: ["ARM 3"] },
      { id: "repick", label: "Arm 2 补拣 B1", durationSec: 4, focusArmIds: ["ARM 2", "ARM 3"] },
      { id: "pack", label: "PASS 门控包装交付", durationSec: 5, focusArmIds: ["ARM 4"] },
    ],
  },
  {
    id: "demo06",
    number: "06",
    tabTitle: "岭南果品",
    armLabel: "三臂",
    armCount: 3,
    eyebrow: "LINE 2 / FRUIT PROCESSING",
    title: "岭南果品分选、去核与复作业",
    subtitle: "柔性抓取旋检 · 正式交接 · 定向去核 · 开口复核 · G5 二次去核",
    missionCode: "L2-3G",
    missionTitle: "柔性果品加工流水线",
    missionCopy: "分选、去核和复核形成连续流水，去核不完全的 G5 真实返回复作位。",
    arms: [
      { id: "ARM 1", role: "柔性旋检", detail: "浅盘取果 → 旋转检查", color: "cyan", segments: ["SOFT PICK", "INSPECT"] },
      { id: "ARM 2", role: "定向去核", detail: "交接 → 夹具 → 去核", color: "violet", segments: ["ORIENT", "PIT"] },
      { id: "ARM 3", role: "复核装盘", detail: "开口复核 → 成品/复作", color: "amber", segments: ["VERIFY", "PACK"] },
    ],
    parts: [
      { id: "G1/G3", task: "合格去核", target: "PRODUCT", state: "READY" },
      { id: "G2", task: "成熟度不足", target: "UNRIPE", state: "QUALITY" },
      { id: "G4", task: "表面缺陷", target: "NG", state: "QUALITY" },
      { id: "G5", task: "去核不完全", target: "REWORK", state: "FAULT ONCE", fault: true },
      { id: "G6", task: "合格去核", target: "PRODUCT", state: "QUEUED" },
    ],
    destinations: [
      { title: "四格成品盘", detail: "G1/G3/G5/G6", tone: "green" },
      { title: "待熟区", detail: "G2", tone: "amber" },
      { title: "NG / 果核", detail: "G4 + 4 pits", tone: "red" },
    ],
    equipment: ["浅盘、软指与旋转视觉位", "定向夹具、去核头和复作位", "透明四格盘、待熟/NG/果核箱"],
    collaboration: "Arm 1 向 Arm 2 正式交接合格果，Arm 2 去核后 Arm 3 复核并决定成品或复作。",
    fault: "G5 首次去核后仍检测到果核；G2/G4 只是品质分类，不增加故障次数。",
    recovery: "Arm 3 将 G5 放入 rework，Arm 2 二次短行程去核，Arm 3 再检通过后装盘。",
    oracle: "G1/G3/G5/G6 去核入四格盘，四枚果核入 pit bin，G2 待熟、G4 NG，三臂归位。",
    tools: ["柔性软指", "定向夹具", "低力去核头"],
    assets: ["apple", "tray", "box"],
    taskStages: [
      { id: "inspect", label: "柔性取果与旋转检查", durationSec: 4, focusArmIds: ["ARM 1"] },
      { id: "handoff", label: "合格果正式交接", durationSec: 3, focusArmIds: ["ARM 1", "ARM 2"] },
      { id: "pit", label: "定向与低力去核", durationSec: 4, focusArmIds: ["ARM 2"] },
      { id: "verify", label: "开口与果核复核", durationSec: 3, focusArmIds: ["ARM 3"] },
      { id: "rework", label: "G5 二次去核并装盘", durationSec: 5, focusArmIds: ["ARM 2", "ARM 3"] },
    ],
  },
];

export function getScenarios(lineId: "line2"): readonly Line2Scenario[];
export function getScenarios(lineId: "line1"): readonly VisualScenario[];
export function getScenarios(lineId: LineId): readonly VisualScenario[];
export function getScenarios(lineId: LineId): readonly VisualScenario[] {
  return lineId === "line2" ? LINE2_SCENARIOS : VISUAL_SCENARIOS;
}

export function getScenario(lineId: "line2", id: VisualScenarioId): Line2Scenario;
export function getScenario(lineId: "line1", id: VisualScenarioId): VisualScenario;
export function getScenario(lineId: LineId, id: VisualScenarioId): VisualScenario;
export function getScenario(lineId: LineId, id: VisualScenarioId): VisualScenario {
  const scenario = getScenarios(lineId).find((candidate) => candidate.id === id);
  if (!scenario) throw new Error(`Unknown ${lineId} scenario: ${id}`);
  return scenario;
}
