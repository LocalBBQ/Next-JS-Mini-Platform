export function PinToggle({
  pinned,
  label,
  disabled,
  onToggle,
}: {
  pinned: boolean;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label}`}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className={`glass-chip shrink-0 rounded-full px-2.5 py-1 text-xs transition disabled:opacity-50 ${
        pinned ? "is-active" : "text-neutral-900/85 hover:bg-yellow-300"
      }`}
    >
      {pinned ? "Unpin" : "Pin"}
    </button>
  );
}

export function PinChip({
  active,
  label,
  onOpen,
  onUnpin,
}: {
  active: boolean;
  label: string;
  onOpen: () => void;
  onUnpin?: () => void;
}) {
  return (
    <span
      className={`glass-chip inline-flex items-center rounded-full text-sm transition ${
        active ? "is-active" : "text-neutral-900/85"
      }`}
    >
      <button type="button" className="px-3 py-1.5" onClick={onOpen}>
        {label}
      </button>
      {onUnpin ? (
        <button
          type="button"
          aria-label={`Unpin ${label}`}
          className="py-1.5 pr-3 pl-1"
          onClick={onUnpin}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
