// === TW Scheduler Backend — standalone, compatível v1/v2 ===
(function () {
    'use strict';

    const STORAGE_KEY = "tws_scheduler_list_v2";
    const PROCESSED_KEY = "tws_scheduler_processed_v2";

    // -----------------------
    // Utilitários
    // -----------------------
    function generateUniqueId() {
        return "evt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,9);
    }

    // Accepts "DD/MM/YYYY HH:MM:SS" or "DD/MM/YYYY HH:MM"
    function parseDateTimeToMs(str) {
        if (!str || typeof str !== 'string') return NaN;
        const parts = str.trim().split(' ');
        if (parts.length < 2) return NaN;
        const [d,m,y] = parts[0].split('/').map(Number);
        const timeParts = parts[1].split(':').map(Number);
        const hh = timeParts[0] || 0;
        const mm = timeParts[1] || 0;
        const ss = timeParts[2] || 0;
        if (![d,m,y,hh,mm,ss].every(n => typeof n === 'number' && !isNaN(n))) return NaN;
        const dt = new Date(y, (m||1)-1, d||1, hh, mm, ss);
        return dt.getTime();
    }

    // -----------------------
    // Storage helpers
    // -----------------------
    function safeParse(raw) {
        try { return JSON.parse(raw); } catch (e) { return null; }
    }

    function getList() {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = safeParse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed;
    }

    function setList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
        } catch (e) {
            console.error('[TWS Backend] Falha ao salvar lista', e);
        }
    }

    // Backwards-compatible API (old names)
    function listEvents() { return getList(); }
    function addEvent(evt) {
        const list = getList();
        list.push(evt);
        setList(list);
        return evt;
    }
    function removeEvent(id) {
        const list = getList().filter(e => e._id !== id);
        setList(list);
    }

    // -----------------------
    // Processamento / Anti-duplicação
    // -----------------------
    function getProcessed() {
        const raw = localStorage.getItem(PROCESSED_KEY);
        return safeParse(raw) || {};
    }
    function markProcessed(id) {
        if (!id) return;
        const p = getProcessed();
        p[id] = true;
        localStorage.setItem(PROCESSED_KEY, JSON.stringify(p));
    }
    function isProcessed(id) {
        const p = getProcessed();
        return !!p[id];
    }

    // -----------------------
    // Coordenador em memória
    // -----------------------
    const attackCoordinator = {
        processing: {},
        isBeingProcessed(id) { return !!this.processing[id]; },
        markProcessing(id) { if (id) this.processing[id] = Date.now(); },
        clearProcessing(id) { delete this.processing[id]; }
    };

    // -----------------------
    // executeAttack (simulado)
    // -----------------------
    async function executeAttack(evt) {
        if (!evt || !evt._id) return { ok: false, error: 'Evento inválido' };
        if (attackCoordinator.isBeingProcessed(evt._id)) return { ok: false, error: 'Já em processamento' };
        if (isProcessed(evt._id)) return { ok: false, duplicated: true };

        attackCoordinator.markProcessing(evt._id);
        console.log('[TWS Backend] Executando ataque →', evt);

        try {
            // Simulação de envio (substitua por automação/fetch se quiser)
            await new Promise(res => setTimeout(res, 800));

            // marca como processado (persistente) e marca done
            markProcessed(evt._id);
            const list = getList();
            const idx = list.findIndex(x => x._id === evt._id);
            if (idx !== -1) {
                list[idx].done = true;
                list[idx].executedAt = Date.now();
                setList(list);
            }

            // notifica frontend
            try {
                const dispatchedDetail = list[idx] || evt;
                window.dispatchEvent(new CustomEvent('tws:eventExecuted', { detail: dispatchedDetail }));
            } catch (e) { /* não crítico */ }

            console.log('[TWS Backend] Ataque finalizado:', evt._id);
            return { ok: true };
        } catch (err) {
            console.error('[TWS Backend] Erro executeAttack', err);
            return { ok: false, error: err };
        } finally {
            attackCoordinator.clearProcessing(evt._id);
        }
    }

    // -----------------------
    // Scheduler
    // -----------------------
    const CHECK_INTERVAL_MS = 800;
    let schedulerHandle = null;

    function startScheduler() {
        if (schedulerHandle) return;
        schedulerHandle = setInterval(() => {
            try {
                const now = Date.now();
                const list = getList();
                for (const evt of list) {
                    if (!evt || evt.done) continue;
                    const ts = parseDateTimeToMs(evt.datetime || evt.dateTime || evt.time || '');
                    if (isNaN(ts)) continue;
                    if (ts <= now && !attackCoordinator.isBeingProcessed(evt._id) && !isProcessed(evt._id)) {
                        // fire and forget
                        (async () => {
                            try { await executeAttack(evt); } catch(e) { console.error(e); }
                        })();
                    }
                }
            } catch (e) {
                console.error('[TWS Backend] Scheduler error', e);
            }
        }, CHECK_INTERVAL_MS);
        console.log('[TWS Backend] Scheduler iniciado — intervalo', CHECK_INTERVAL_MS, 'ms');
    }

    function stopScheduler() {
        if (schedulerHandle) clearInterval(schedulerHandle);
        schedulerHandle = null;
    }

    // -----------------------
    // Expose API
    // -----------------------
    window.TWS_Backend = {
        // utilitários
        generateUniqueId,
        parseDateTimeToMs,

        // list management (new API)
        getList,
        setList,

        // old API compat
        listEvents,
        addEvent,
        removeEvent,

        // processed helpers
        markProcessed,
        isProcessed,

        // execute & coordinator
        executeAttack,
        attackCoordinator,

        // scheduler
        startScheduler,
        stopScheduler,

        // internals for debug (não use em produção)
        _internal: {
            STORAGE_KEY,
            PROCESSED_KEY
        }
    };

    // start automatically
    startScheduler();

    console.log('📦 TWS Backend carregado (compatível).');
})();
