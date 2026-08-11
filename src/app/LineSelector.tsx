import type { LineId } from "./urlState";

interface LineSelectorProps {
  readonly activeLine: LineId;
  readonly onSelect: (lineId: LineId) => void;
}

export function LineSelector({ activeLine, onSelect }: LineSelectorProps) {
  return (
    <div className="line-selector" aria-label="场景版本">
      <button
        aria-pressed={activeLine === "line1"}
        className={activeLine === "line1" ? "is-active" : ""}
        onClick={() => onSelect("line1")}
      >
        <span>Line 1</span>
        <small>原始场景</small>
      </button>
      <button
        aria-pressed={activeLine === "line2"}
        className={activeLine === "line2" ? "is-active" : ""}
        onClick={() => onSelect("line2")}
      >
        <span>Line 2</span>
        <small>真实资产</small>
      </button>
    </div>
  );
}
