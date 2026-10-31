import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import {
  ArrowRight,
  Bookmark as BookmarkIcon,
  Leaf,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { BookmarkCard } from "./features/bookmarks/BookmarkCard";
import { BookmarkForm } from "./features/bookmarks/BookmarkForm";
import { appReducer, type AppAction } from "./features/bookmarks/reducer";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import { loadAppData, saveAppData, serializeAppData } from "./services/storage";
import type { AppData, Bookmark, Theme } from "./types/app";
import { filterBookmarks } from "./utils/bookmarks";

function App() {
  const initialLoad = useMemo(() => loadAppData(window.localStorage), []);
  const [data, dispatch] = useReducer(appReducer, initialLoad.data);
  const [canPersist, setCanPersist] = useState(!initialLoad.error);
  const [storageWarning, setStorageWarning] = useState(initialLoad.error ?? "");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark>();
  const [deletingBookmark, setDeletingBookmark] = useState<Bookmark>();
  const [showSettings, setShowSettings] = useState(false);
  const [importCandidate, setImportCandidate] = useState<AppData>();
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | undefined>(undefined);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filteredBookmarks = useMemo(
    () => filterBookmarks(data.bookmarks, query, activeCategory),
    [data.bookmarks, query, activeCategory],
  );

  function notify(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }

  function update(action: AppAction) {
    setCanPersist(true);
    dispatch(action);
  }

  useEffect(() => {
    if (!canPersist) return;
    try {
      saveAppData(window.localStorage, data);
    } catch {
      setStorageWarning("浏览器存储空间不足，本次修改可能无法在刷新后保留。 ");
    }
  }, [data, canPersist]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const dark =
        data.settings.theme === "dark" || (data.settings.theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
    };
    applyTheme();
    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [data.settings.theme]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    update({ type: "reorder", activeId: String(active.id), overId: String(over.id) });
    notify("顺序已更新");
  }

  function handleExport() {
    const blob = new Blob([serializeAppData(data)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `栖页备份-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify("备份已导出");
  }

  function cycleTheme() {
    const order: Theme[] = ["system", "light", "dark"];
    const index = order.indexOf(data.settings.theme);
    const nextTheme = order[(index + 1) % order.length] ?? "system";
    update({ type: "theme", theme: nextTheme });
    notify(
      nextTheme === "dark"
        ? "已切换为深色主题"
        : nextTheme === "light"
          ? "已切换为浅色主题"
          : "主题将跟随系统",
    );
  }

  const activeCategoryName =
    activeCategory === "all"
      ? "全部收藏"
      : (data.categories.find((category) => category.id === activeCategory)?.name ?? "全部收藏");

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="site-header">
        <a className="brand" href="#main" aria-label="栖页首页">
          <span className="brand-mark">
            <Leaf aria-hidden="true" size={21} />
          </span>
          <span>
            <strong>栖页</strong>
            <small>LINKHAVEN</small>
          </span>
        </a>
        <nav className="header-actions" aria-label="页面工具">
          <button
            className="round-button"
            type="button"
            onClick={cycleTheme}
            aria-label="切换显示主题"
          >
            {data.settings.theme === "dark" ? (
              <Moon aria-hidden="true" size={19} />
            ) : (
              <Sun aria-hidden="true" size={19} />
            )}
          </button>
          <button
            className="round-button"
            type="button"
            onClick={() => setShowSettings(true)}
            aria-label="打开设置"
          >
            <Settings2 aria-hidden="true" size={19} />
          </button>
          <button
            className="button primary compact"
            type="button"
            aria-label="添加新网址"
            onClick={() => setShowForm(true)}
          >
            <Plus aria-hidden="true" size={18} /> 添加网址
          </button>
        </nav>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> 你的网络栖息地
            </p>
            <h1 id="hero-title">
              把喜欢的网页，
              <br />
              <em>留在顺手的地方。</em>
            </h1>
            <p className="hero-description">
              无需登录，不上传云端。收藏、整理、随时抵达——这里完全属于你。
            </p>
          </div>
          <div className="hero-stat" aria-label={`已收藏 ${data.bookmarks.length} 个网址`}>
            <span>
              <BookmarkIcon aria-hidden="true" size={22} />
            </span>
            <div>
              <strong>{String(data.bookmarks.length).padStart(2, "0")}</strong>
              <small>个网址已安放</small>
            </div>
          </div>
        </section>

        {storageWarning && (
          <aside className="warning-banner" role="alert">
            <p>{storageWarning}</p>
            {!canPersist && (
              <button
                type="button"
                onClick={() => {
                  setCanPersist(true);
                  setStorageWarning("");
                  notify("已开始使用空白数据");
                }}
              >
                使用空白数据 <ArrowRight aria-hidden="true" size={15} />
              </button>
            )}
          </aside>
        )}

        <section className="workspace" aria-label="网址收藏">
          <div className="toolbar">
            <label className="search-box">
              <Search aria-hidden="true" size={19} />
              <span className="visually-hidden">搜索网址</span>
              <input
                aria-label="搜索网址"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索名称、网址或备注…"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="清空搜索">
                  <X aria-hidden="true" size={16} />
                </button>
              )}
            </label>
            <div className="category-tabs" role="tablist" aria-label="按分类筛选">
              <button
                className={activeCategory === "all" ? "active" : ""}
                type="button"
                role="tab"
                aria-selected={activeCategory === "all"}
                onClick={() => setActiveCategory("all")}
              >
                全部 <span>{data.bookmarks.length}</span>
              </button>
              {data.categories
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((category) => {
                  const count = data.bookmarks.filter(
                    (bookmark) => bookmark.categoryId === category.id,
                  ).length;
                  return (
                    <button
                      key={category.id}
                      className={activeCategory === category.id ? "active" : ""}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === category.id}
                      onClick={() => setActiveCategory(category.id)}
                    >
                      {category.name} <span>{count}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="section-heading">
            <div>
              <p className="eyebrow">COLLECTION</p>
              <h2>{activeCategoryName}</h2>
            </div>
            <p>{filteredBookmarks.length} 个结果</p>
          </div>

          {filteredBookmarks.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredBookmarks.map((bookmark) => bookmark.id)}
                strategy={rectSortingStrategy}
              >
                <div className="bookmark-grid">
                  {filteredBookmarks.map((bookmark) => (
                    <BookmarkCard
                      key={bookmark.id}
                      bookmark={bookmark}
                      category={data.categories.find(
                        (category) => category.id === bookmark.categoryId,
                      )}
                      onEdit={setEditingBookmark}
                      onDelete={setDeletingBookmark}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="empty-state">
              <span>
                <Leaf aria-hidden="true" size={28} />
              </span>
              <h3>{data.bookmarks.length === 0 ? "这里还很安静" : "没有找到匹配的网址"}</h3>
              <p>
                {data.bookmarks.length === 0
                  ? "收藏第一个常用网站，让这片空间慢慢长起来。"
                  : "试试更短的关键词，或者切换到其他分类。"}
              </p>
              {data.bookmarks.length === 0 && (
                <button className="button primary" type="button" onClick={() => setShowForm(true)}>
                  <Plus aria-hidden="true" size={18} /> 添加第一个网址
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>栖页 · 数据只留在你的浏览器</span>
        <span>安静收藏，自在抵达</span>
      </footer>

      {(showForm || editingBookmark) && (
        <BookmarkForm
          bookmark={editingBookmark}
          categories={data.categories}
          onClose={() => {
            setShowForm(false);
            setEditingBookmark(undefined);
          }}
          onSubmit={(draft) => {
            if (editingBookmark) {
              update({ type: "update", id: editingBookmark.id, draft });
              notify("网址已更新");
            } else {
              update({ type: "add", draft });
              notify("网址已添加");
            }
            setShowForm(false);
            setEditingBookmark(undefined);
          }}
        />
      )}

      {deletingBookmark && (
        <ConfirmDialog
          title="删除这个网址？"
          description={`“${deletingBookmark.name}”将从栖页中移除，此操作无法撤销。`}
          confirmLabel="确认删除"
          onCancel={() => setDeletingBookmark(undefined)}
          onConfirm={() => {
            update({ type: "delete", id: deletingBookmark.id });
            setDeletingBookmark(undefined);
            notify("网址已删除");
          }}
        />
      )}

      {showSettings && (
        <SettingsPanel
          data={data}
          onClose={() => setShowSettings(false)}
          onThemeChange={(theme) => update({ type: "theme", theme })}
          onExport={handleExport}
          onImportReady={(candidate) => setImportCandidate(candidate)}
        />
      )}

      {importCandidate && (
        <ConfirmDialog
          title="用备份覆盖当前数据？"
          description={`备份中包含 ${importCandidate.bookmarks.length} 个网址。导入后，当前的 ${data.bookmarks.length} 个网址会被替换。`}
          confirmLabel="确认导入"
          tone="primary"
          onCancel={() => setImportCandidate(undefined)}
          onConfirm={() => {
            update({ type: "import", data: importCandidate });
            setImportCandidate(undefined);
            setShowSettings(false);
            setActiveCategory("all");
            notify("备份已恢复");
          }}
        />
      )}

      <div className={toast ? "toast visible" : "toast"} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

export default App;
