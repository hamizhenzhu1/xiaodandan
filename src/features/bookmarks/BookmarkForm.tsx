import { useState, type FormEvent } from "react";
import { bookmarkDraftSchema } from "../../schemas/appData";
import type { Bookmark, BookmarkDraft, Category } from "../../types/app";
import { Modal } from "../../components/Modal";

type BookmarkFormProps = {
  bookmark?: Bookmark;
  categories: Category[];
  defaultCategoryId?: string;
  onSubmit: (draft: BookmarkDraft) => void;
  onClose: () => void;
};

type FormErrors = Partial<Record<keyof BookmarkDraft, string>>;

export function BookmarkForm({
  bookmark,
  categories,
  defaultCategoryId,
  onSubmit,
  onClose,
}: BookmarkFormProps) {
  const [name, setName] = useState(bookmark?.name ?? "");
  const [specialNote, setSpecialNote] = useState(bookmark?.specialNote ?? "");
  const [url, setUrl] = useState(bookmark?.url ?? "");
  const [categoryId, setCategoryId] = useState(
    bookmark?.categoryId ?? defaultCategoryId ?? categories[0]?.id ?? "",
  );
  const [note, setNote] = useState(bookmark?.note ?? "");
  const [errors, setErrors] = useState<FormErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const draftResult = bookmarkDraftSchema.safeParse({ name, specialNote, url, categoryId, note });
    if (!draftResult.success) {
      const nextErrors: FormErrors = {};
      for (const issue of draftResult.error.issues) {
        const field = issue.path[0] as keyof BookmarkDraft | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      ...draftResult.data,
      specialNote: draftResult.data.specialNote || undefined,
      note: draftResult.data.note || undefined,
    });
  }

  return (
    <Modal
      title={bookmark ? "编辑网址" : "收藏一个新去处"}
      description={bookmark ? "更新信息后会自动保存在当前浏览器。" : "给常用网站留一个顺手的位置。"}
      onClose={onClose}
      labelledBy="bookmark-form-title"
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <label className="field full">
            <span>网站名称</span>
            <input
              aria-label="网站名称"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="例如：设计灵感"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && <small id="name-error">{errors.name}</small>}
          </label>

          <label className="field full">
            <span>
              特殊备注 <b>可选</b>
            </span>
            <input
              aria-label="特殊备注（可选）"
              value={specialNote}
              onChange={(event) => setSpecialNote(event.target.value)}
              placeholder="例如：朋友推荐、限时活动"
              aria-invalid={Boolean(errors.specialNote)}
            />
            <em className="character-count">{specialNote.length}/80</em>
            {errors.specialNote && <small>{errors.specialNote}</small>}
          </label>

          <label className="field full">
            <span>网址</span>
            <input
              aria-label="网址"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="example.com"
              aria-invalid={Boolean(errors.url)}
              aria-describedby={errors.url ? "url-error" : "url-hint"}
            />
            {errors.url ? (
              <small id="url-error">{errors.url}</small>
            ) : (
              <em id="url-hint">不限制网址格式，输入的内容会原样保存</em>
            )}
          </label>

          <label className="field">
            <span>分类</span>
            <select
              aria-label="分类"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
            >
              {categories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>

          <label className="field full">
            <span>
              备注 <b>可选</b>
            </span>
            <textarea
              aria-label="备注（可选）"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="写下一句提示，方便以后识别"
              rows={3}
              aria-invalid={Boolean(errors.note)}
            />
            <em className="character-count">{note.length}/200</em>
            {errors.note && <small>{errors.note}</small>}
          </label>
        </div>

        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            取消
          </button>
          <button className="button primary" type="submit">
            {bookmark ? "保存修改" : "添加网址"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
