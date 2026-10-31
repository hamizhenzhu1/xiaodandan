import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Bookmark, Category } from "../../types/app";
import { getFaviconUrl, getHostname } from "../../utils/url";

type BookmarkCardProps = {
  bookmark: Bookmark;
  category?: Category;
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
};

export function BookmarkCard({ bookmark, category, onEdit, onDelete }: BookmarkCardProps) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bookmark.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`bookmark-card ${isDragging ? "dragging" : ""}`}
    >
      <div className="card-topline">
        <span className="category-pill">{category?.name ?? "未分类"}</span>
        <div className="card-actions">
          <button
            className="card-icon-button drag-handle"
            type="button"
            aria-label={`拖动排序：${bookmark.name}`}
            title="拖动排序"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" size={17} />
          </button>
          <button
            className="card-icon-button"
            type="button"
            aria-label={`编辑 ${bookmark.name}`}
            onClick={() => onEdit(bookmark)}
          >
            <Pencil aria-hidden="true" size={16} />
          </button>
          <button
            className="card-icon-button danger-ghost"
            type="button"
            aria-label={`删除 ${bookmark.name}`}
            onClick={() => onDelete(bookmark)}
          >
            <Trash2 aria-hidden="true" size={16} />
          </button>
        </div>
      </div>

      <a
        className="bookmark-link"
        href={bookmark.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`打开 ${bookmark.name}`}
      >
        <span className="site-icon" aria-hidden="true">
          {!faviconFailed && getFaviconUrl(bookmark.url) ? (
            <img src={getFaviconUrl(bookmark.url)} alt="" onError={() => setFaviconFailed(true)} />
          ) : (
            <b>{bookmark.name.slice(0, 1).toLocaleUpperCase()}</b>
          )}
        </span>
        <span className="bookmark-copy">
          <strong>{bookmark.name}</strong>
          <span>{getHostname(bookmark.url)}</span>
        </span>
        <ExternalLink className="external-icon" aria-hidden="true" size={18} />
      </a>

      <p className={bookmark.note ? "card-note" : "card-note muted"}>
        {bookmark.note || "点击卡片，前往这个网站"}
      </p>
    </article>
  );
}
