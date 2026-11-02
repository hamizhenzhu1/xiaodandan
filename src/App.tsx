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
  Copy,
  Leaf,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings2,
  Sun,
  X,
} from "lucide-react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { AuthScreen } from "./features/auth/AuthScreen";
import { WorkspaceSetup } from "./features/auth/WorkspaceSetup";
import { BookmarkCard } from "./features/bookmarks/BookmarkCard";
import { BookmarkForm } from "./features/bookmarks/BookmarkForm";
import { appReducer, type AppAction } from "./features/bookmarks/reducer";
import { SettingsPanel } from "./features/settings/SettingsPanel";
import {
  createWorkspace,
  getCurrentUser,
  joinWorkspace,
  listWorkspaces,
  loadWorkspaceData,
  saveWorkspaceData,
  signOut,
  subscribeToWorkspace,
  unsubscribeFromWorkspace,
  type SharedWorkspace,
} from "./services/cloud";
import { loadAppData, saveAppData, serializeAppData } from "./services/storage";
import { isSupabaseConfigured, supabase } from "./services/supabase";
import type { AppData, Bookmark, Theme } from "./types/app";
import { filterBookmarks } from "./utils/bookmarks";
import type { User } from "@supabase/supabase-js";

type BookmarkDashboardProps = {
  remoteData?: AppData;
  workspace?: SharedWorkspace;
  userEmail?: string;
  onDataChange?: (data: AppData, previousData: AppData) => Promise<void>;
  onSignOut?: () => void;
};

function BookmarkDashboard({
  remoteData,
  workspace,
  userEmail,
  onDataChange,
  onSignOut,
}: BookmarkDashboardProps) {
  const initialLoad = useMemo(
    () => (remoteData ? { data: remoteData } : loadAppData(window.localStorage)),
    [],
  );
  const [data, dispatch] = useReducer(appReducer, initialLoad.data);
  const [canPersist, setCanPersist] = useState(!initialLoad.error);
  const [storageWarning, setStorageWarning] = useState(initialLoad.error ?? "");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [preferredCategoryId, setPreferredCategoryId] = useState<string>();
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

  const sortedCategories = useMemo(
    () => data.categories.slice().sort((a, b) => a.order - b.order),
    [data.categories],
  );

  const visibleCategories = useMemo(() => {
    const categories =
      activeCategory === "all"
        ? sortedCategories
        : sortedCategories.filter((category) => category.id === activeCategory);
    if (!query.trim()) return categories;
    return categories.filter(
      (category) => filterBookmarks(data.bookmarks, query, category.id).length > 0,
    );
  }, [activeCategory, data.bookmarks, query, sortedCategories]);

  function notify(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2800);
  }

  function update(action: AppAction) {
    setCanPersist(true);
    const previousData = data;
    const nextData = appReducer(data, action);
    dispatch(action);
    if (onDataChange) {
      void onDataChange(nextData, previousData).catch(() => {
        dispatch({ type: "import", data: previousData });
        notify("云端保存失败，已恢复之前的数据");
      });
    }
  }

  useEffect(() => {
    if (onDataChange) return;
    if (!canPersist) return;
    try {
      saveAppData(window.localStorage, data);
    } catch {
      setStorageWarning("浏览器存储空间不足，本次修改可能无法在刷新后保留。 ");
    }
  }, [data, canPersist, onDataChange]);

  useEffect(() => {
    if (remoteData) dispatch({ type: "import", data: remoteData });
  }, [remoteData]);

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

  function openFormForCategory(categoryId?: string) {
    setPreferredCategoryId(categoryId);
    setShowForm(true);
  }

  function renderCategorySection(category: AppData["categories"][number]) {
    const bookmarks = filterBookmarks(data.bookmarks, query, category.id);
    const marketplaceClass = ["tmall", "jd", "dewu"].includes(category.id)
      ? `marketplace-${category.id}`
      : "marketplace-other";

    return (
      <section className={`category-collection ${marketplaceClass}`} key={category.id}>
        <header className="category-collection-header">
          <div className="category-title-group">
            <span className="category-emblem" aria-hidden="true">
              {category.name.slice(0, 1)}
            </span>
            <div>
              <p className="eyebrow">MARKETPLACE</p>
              <h2>{category.name}</h2>
            </div>
          </div>
          <div className="category-header-actions">
            <span>{bookmarks.length} 个网址</span>
            <button
              className="category-add-button"
              type="button"
              onClick={() => openFormForCategory(category.id)}
              aria-label={`添加到${category.name}`}
            >
              <Plus aria-hidden="true" size={16} /> 添加
            </button>
          </div>
        </header>

        {bookmarks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={bookmarks.map((bookmark) => bookmark.id)}
              strategy={rectSortingStrategy}
            >
              <div className="bookmark-grid">
                {bookmarks.map((bookmark) => (
                  <BookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    category={category}
                    onEdit={setEditingBookmark}
                    onDelete={setDeletingBookmark}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="empty-category">
            <p>还没有收藏网址</p>
            <button type="button" onClick={() => openFormForCategory(category.id)}>
              为{category.name}添加第一个网址 <ArrowRight aria-hidden="true" size={15} />
            </button>
          </div>
        )}
      </section>
    );
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

      {workspace && (
        <aside className="collaboration-bar" aria-label="共享收藏夹信息">
          <div>
            <strong>{workspace.name}</strong>
            <span>{userEmail}</span>
          </div>
          <div className="collaboration-actions">
            <span>
              邀请码 <code>{workspace.inviteCode}</code>
            </span>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(workspace.inviteCode);
                notify("邀请码已复制");
              }}
            >
              <Copy aria-hidden="true" size={15} /> 复制
            </button>
            <button type="button" onClick={onSignOut}>
              <LogOut aria-hidden="true" size={15} /> 退出
            </button>
          </div>
        </aside>
      )}

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
            onClick={() => openFormForCategory()}
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
              {workspace
                ? "两个人，一份共同收藏。添加与整理会安全同步到云端。"
                : "无需登录，不上传云端。收藏、整理、随时抵达——这里完全属于你。"}
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

          <div className="section-heading collections-overview">
            <div>
              <p className="eyebrow">SHOP COLLECTIONS</p>
              <h2>{activeCategory === "all" ? "平台收藏" : activeCategoryName}</h2>
            </div>
            <p>{filteredBookmarks.length} 个结果</p>
          </div>

          {query.trim() && filteredBookmarks.length === 0 ? (
            <div className="empty-state">
              <span>
                <Leaf aria-hidden="true" size={28} />
              </span>
              <h3>没有找到匹配的网址</h3>
              <p>试试更短的关键词，或者切换到其他分类。</p>
            </div>
          ) : (
            <div className="category-collections">
              {visibleCategories.map((category) => renderCategorySection(category))}
            </div>
          )}
        </section>
      </main>

      <footer className="site-footer">
        <span>
          {workspace ? `栖页 · ${workspace.name}已安全同步` : "栖页 · 数据只留在你的浏览器"}
        </span>
        <span>安静收藏，自在抵达</span>
      </footer>

      {(showForm || editingBookmark) && (
        <BookmarkForm
          bookmark={editingBookmark}
          categories={data.categories}
          defaultCategoryId={preferredCategoryId}
          onClose={() => {
            setShowForm(false);
            setEditingBookmark(undefined);
            setPreferredCategoryId(undefined);
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
            setPreferredCategoryId(undefined);
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

function CloudApp() {
  const [user, setUser] = useState<User | null>();
  const [workspaces, setWorkspaces] = useState<SharedWorkspace[]>([]);
  const [workspace, setWorkspace] = useState<SharedWorkspace>();
  const [remoteData, setRemoteData] = useState<AppData>();
  const [error, setError] = useState("");

  async function refreshWorkspaces(preferredId?: string) {
    const next = await listWorkspaces();
    setWorkspaces(next);
    setWorkspace(next.find((item) => item.id === preferredId) ?? next[0]);
  }

  async function refreshData(workspaceId: string) {
    try {
      setRemoteData(await loadWorkspaceData(workspaceId));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "读取共享收藏失败");
    }
  }

  useEffect(() => {
    if (!supabase) return;
    void getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) =>
      setUser(session?.user ?? null),
    );
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setWorkspaces([]);
      setWorkspace(undefined);
      setRemoteData(undefined);
      return;
    }
    void refreshWorkspaces().catch((reason) =>
      setError(reason instanceof Error ? reason.message : "读取收藏夹失败"),
    );
  }, [user]);

  useEffect(() => {
    if (!workspace) return;
    void refreshData(workspace.id);
    let timer: number | undefined;
    const channel = subscribeToWorkspace(workspace.id, () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void refreshData(workspace.id), 180);
    });
    return () => {
      window.clearTimeout(timer);
      void unsubscribeFromWorkspace(channel);
    };
  }, [workspace?.id]);

  if (!isSupabaseConfigured) {
    return (
      <main className="status-page">
        <h1>云端服务尚未配置</h1>
        <p>请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_PUBLISHABLE_KEY。</p>
      </main>
    );
  }
  if (user === undefined)
    return (
      <main className="status-page">
        <p>正在连接共同收藏夹…</p>
      </main>
    );
  if (!user) return <AuthScreen />;
  if (workspaces.length === 0) {
    return (
      <WorkspaceSetup
        onCreate={async (name) => refreshWorkspaces(await createWorkspace(name))}
        onJoin={async (code) => refreshWorkspaces(await joinWorkspace(code))}
        onSignOut={() => void signOut()}
      />
    );
  }
  if (!workspace || !remoteData)
    return (
      <main className="status-page">
        <p>{error || "正在载入共同收藏…"}</p>
      </main>
    );

  return (
    <BookmarkDashboard
      remoteData={remoteData}
      workspace={workspace}
      userEmail={user.email}
      onDataChange={(data, previousData) => saveWorkspaceData(workspace.id, previousData, data)}
      onSignOut={() => void signOut()}
    />
  );
}

function App() {
  const demoMode = new URLSearchParams(window.location.search).has("demo");
  return demoMode ? <BookmarkDashboard /> : <CloudApp />;
}

export default App;
