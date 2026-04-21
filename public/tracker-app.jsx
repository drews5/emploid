/* global React, ReactDOM */
const { useEffect, useMemo, useState } = React;
const APP_STAGES = window.TRACKER.STAGES;
const {
  Column,
  ComposerModal,
  DetailPanel,
  Funnel,
  Icon,
  I,
  Toolbar,
  buildListingUrl,
  enforceExclusiveFlags,
  isHotApp,
  isStalledApp,
  loadTrackerBoard,
  matchesSearch,
  normalizeApp,
  saveTrackerBoard,
  sortApps,
  todayStr,
  withinPeriod,
} = window.TrackerUI;

function emptyDraft(stageId) {
  return {
    role: '',
    company: '',
    stage: stageId || 'saved',
    listingUrl: '',
    location: '',
    salary: '',
    trust: 80,
    applied: '',
    notes: '',
    hot: false,
    stall: false,
  };
}

function App() {
  const [apps, setApps] = useState(() => loadTrackerBoard(window.TRACKER.initial));
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [sortBy, setSortBy] = useState('priority');
  const [period, setPeriod] = useState('30');
  const [dragId, setDragId] = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [menuStageId, setMenuStageId] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft('saved'));
  const [toast, setToast] = useState('');

  useEffect(() => {
    saveTrackerBoard(apps);
  }, [apps]);

  useEffect(() => {
    function handleSync() {
      setApps(loadTrackerBoard(window.TRACKER.initial));
    }
    window.addEventListener('emploid:tracker-updated', handleSync);
    return () => window.removeEventListener('emploid:tracker-updated', handleSync);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedApp = useMemo(
    () => apps.find((app) => app.id === detailId) || null,
    [apps, detailId]
  );

  const counts = useMemo(() => ({
    all: apps.length,
    week: apps.filter((app) => withinPeriod(app, '7')).length,
    hot: apps.filter((app) => isHotApp(app)).length,
    stall: apps.filter((app) => isStalledApp(app)).length,
  }), [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      if (!matchesSearch(app, search)) return false;
      if (filter === 'week' && !withinPeriod(app, '7')) return false;
      if (filter === 'hot' && !isHotApp(app)) return false;
      if (filter === 'stall' && !isStalledApp(app)) return false;
      return true;
    });
  }, [apps, filter, search]);

  const updateApps = (updater) => {
    setApps((previous) => enforceExclusiveFlags(updater(previous).map((app) => normalizeApp(app))));
  };

  const updateOneApp = (appId, updater) => {
    updateApps((previous) => previous.map((app) => {
      if (app.id !== appId) return app;
      return {
        ...updater(app),
        updatedAt: todayStr,
      };
    }));
  };

  const openComposer = (stageId) => {
    setDraft(emptyDraft(stageId || 'saved'));
    setComposerOpen(true);
    setMenuStageId(null);
  };

  const clearFilters = () => {
    setFilter('all');
    setSearch('');
    setGroupBy('none');
    setSortBy('priority');
    setToast('Tracker filters cleared.');
  };

  const onDragStart = (event, app) => {
    setDragId(app.id);
    event.dataTransfer.effectAllowed = 'move';
    event.currentTarget.classList.add('dragging');
  };

  const onDragEnd = (event) => {
    event.currentTarget.classList.remove('dragging');
    setDragId(null);
    setDropCol(null);
  };

  const onDragOver = (stageId) => (event) => {
    event.preventDefault();
    if (dropCol !== stageId) setDropCol(stageId);
  };

  const onDrop = (stageId) => (event) => {
    event.preventDefault();
    if (!dragId) return;
    updateOneApp(dragId, (app) => ({ ...app, stage: stageId }));
    setDropCol(null);
    setDragId(null);
    setToast(`Moved application to ${APP_STAGES.find((stage) => stage.id === stageId).label}.`);
  };

  const handleStageChange = (appId, stageId) => {
    updateOneApp(appId, (app) => ({
      ...app,
      stage: stageId,
      applied: stageId === 'saved' ? app.applied : (app.applied || todayStr),
      stall: stageId === 'interview' || stageId === 'offer' ? false : app.stall,
    }));
    setToast(`Status updated to ${APP_STAGES.find((stage) => stage.id === stageId).label}.`);
  };

  const handleToggleFlag = (appId, flag) => {
    setApps((previous) => {
      const current = previous.find((app) => app.id === appId);
      const nextValue = current ? !current[flag] : false;

      return enforceExclusiveFlags(previous.map((app) => {
        if (app.id === appId) {
          return normalizeApp({
            ...app,
            [flag]: nextValue,
            updatedAt: todayStr,
          });
        }

        if (nextValue) {
          return normalizeApp({
            ...app,
            [flag]: false,
          });
        }

        return app;
      }));
    });
    setToast(flag === 'hot' ? 'Hot flag updated.' : 'Stalled flag updated.');
  };

  const handleOpenListing = (app) => {
    window.open(buildListingUrl(app), '_blank', 'noopener,noreferrer');
    updateOneApp(app.id, (entry) => ({ ...entry }));
    setToast('Opened the listing in a new tab.');
  };

  const handleDraftChange = (key, value) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
  };

  const handleDraftSubmit = (event) => {
    event.preventDefault();
    const nextApp = normalizeApp({
      id: undefined,
      role: draft.role.trim(),
      company: draft.company.trim(),
      stage: draft.stage,
      trust: Math.max(0, Math.min(100, Number(draft.trust) || 0)),
      salary: draft.salary.trim() || 'Comp not listed',
      location: draft.location.trim() || 'Location not listed',
      applied: draft.applied || null,
      notes: draft.notes.trim(),
      hot: Boolean(draft.hot),
      stall: Boolean(draft.stall),
      listingUrl: draft.listingUrl.trim(),
      updatedAt: todayStr,
      source: 'Manual',
    });

    updateApps((previous) => [nextApp, ...previous]);
    setComposerOpen(false);
    setDraft(emptyDraft('saved'));
    setToast(`Added ${nextApp.role} at ${nextApp.company}.`);
  };

  const stageApps = (stageId) => sortApps(
    filteredApps.filter((app) => app.stage === stageId),
    sortBy
  );

  return (
    <div className="shell" data-screen-label="Tracker">
      <div className="topbar">
        <div className="title-block">
          <h1>Application Tracker</h1>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-ghost" onClick={() => setGroupBy(groupBy === 'none' ? 'company' : groupBy === 'company' ? 'week' : 'none')}>
            <Icon d={I.sliders} />View: {groupBy === 'none' ? 'Board' : groupBy === 'company' ? 'Company' : 'Recency'}
          </button>
          <button className="btn btn-secondary" onClick={clearFilters}>
            <Icon d={I.filter} />Reset filters
          </button>
          <button className="btn btn-primary" onClick={() => openComposer('saved')}>
            <Icon d={I.plus} />Add app
          </button>
        </div>
      </div>

      <Funnel data={apps} period={period} setPeriod={setPeriod} />

      <Toolbar
        filter={filter}
        setFilter={setFilter}
        groupBy={groupBy}
        setGroupBy={setGroupBy}
        counts={counts}
        search={search}
        setSearch={setSearch}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <div className="board">
        {APP_STAGES.map((stage) => (
          <Column
            key={stage.id}
            stage={stage}
            apps={stageApps(stage.id)}
            groupBy={groupBy}
            drop={dropCol === stage.id}
            onDragOver={onDragOver(stage.id)}
            onDrop={onDrop(stage.id)}
            onOpen={setDetailId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            menuOpen={menuStageId === stage.id}
            setMenuOpen={(open) => setMenuStageId(open ? stage.id : null)}
            onAddToStage={() => openComposer(stage.id)}
            onSetSortBy={setSortBy}
            onSetFilter={setFilter}
          />
        ))}
      </div>

      <DetailPanel
        app={selectedApp}
        onClose={() => setDetailId(null)}
        onStageChange={handleStageChange}
        onToggleFlag={handleToggleFlag}
        onOpenListing={handleOpenListing}
      />

      <ComposerModal
        open={composerOpen}
        draft={draft}
        onClose={() => setComposerOpen(false)}
        onChange={handleDraftChange}
        onSubmit={handleDraftSubmit}
      />

      <div className={`tracker-toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('tracker-app-root')).render(<App />);
