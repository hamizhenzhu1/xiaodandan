import { Download, FileJson, HardDrive, Monitor, Moon, Sun, Upload } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Modal } from "../../components/Modal";
import { MAX_IMPORT_BYTES, parseImportData } from "../../services/storage";
import type { AppData, Theme } from "../../types/app";

type SettingsPanelProps = {
  data: AppData;
  onThemeChange: (theme: Theme) => void;
  onExport: () => void;
  onImportReady: (data: AppData) => void;
  onClose: () => void;
};

const themeOptions: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

export function SettingsPanel({
  data,
  onThemeChange,
  onExport,
  onImportReady,
  onClose,
}: SettingsPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      setImportError("文件过大，请选择 1 MB 以内的 JSON 备份。 ");
      return;
    }
    if (!file.name.toLocaleLowerCase().endsWith(".json")) {
      setImportError("请选择 .json 格式的栖页备份文件。 ");
      return;
    }

    try {
      const imported = parseImportData(await file.text());
      setImportError("");
      onImportReady(imported);
    } catch {
      setImportError("无法导入：文件内容不是有效的栖页备份。 ");
    }
  }

  return (
    <Modal
      title="设置与数据"
      description="外观跟着你，数据也由你掌握。"
      onClose={onClose}
      labelledBy="settings-title"
    >
      <div className="settings-section">
        <div className="settings-heading">
          <div>
            <h3>显示主题</h3>
            <p>选择最舒服的阅读方式。</p>
          </div>
        </div>
        <div className="theme-options" role="radiogroup" aria-label="显示主题">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              className={data.settings.theme === value ? "theme-option active" : "theme-option"}
              type="button"
              role="radio"
              aria-checked={data.settings.theme === value}
              onClick={() => onThemeChange(value)}
            >
              <Icon aria-hidden="true" size={19} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-heading">
          <div>
            <h3>备份与恢复</h3>
            <p>导出 JSON 备份，换设备时可以随时恢复。</p>
          </div>
          <FileJson aria-hidden="true" size={22} />
        </div>
        <div className="data-actions">
          <button className="data-action" type="button" onClick={onExport}>
            <span>
              <Download aria-hidden="true" size={19} />
            </span>
            <b>导出备份</b>
            <small>{data.bookmarks.length} 个网址</small>
          </button>
          <button className="data-action" type="button" onClick={() => inputRef.current?.click()}>
            <span>
              <Upload aria-hidden="true" size={19} />
            </span>
            <b>导入备份</b>
            <small>将覆盖当前数据</small>
          </button>
          <input
            ref={inputRef}
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
          />
        </div>
        {importError && (
          <p className="inline-error" role="alert">
            {importError}
          </p>
        )}
      </div>

      <aside className="local-note">
        <HardDrive aria-hidden="true" size={20} />
        <p>
          <strong>数据仅保存在这个浏览器</strong>
          清理浏览器数据可能导致内容丢失，建议定期导出备份。
        </p>
      </aside>
    </Modal>
  );
}
