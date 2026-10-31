import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} labelledBy="confirm-title">
      <div className="confirm-content">
        <span className={`confirm-icon ${tone}`}>
          <AlertTriangle aria-hidden="true" size={24} />
        </span>
        <p>{description}</p>
      </div>
      <div className="modal-actions">
        <button className="button secondary" type="button" onClick={onCancel}>
          取消
        </button>
        <button className={`button ${tone}`} type="button" onClick={onConfirm} autoFocus>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
