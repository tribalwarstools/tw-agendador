// === TW SCHEDULER BACKEND ===
// Responsável por armazenar, processar ataques e comunicar com o frontend.

(function () {
    'use strict';

    const STORAGE_KEY = "tws_scheduler_data_v1";
    const PROCESSED_KEY = "tws_scheduler_processed_v1";

    // ========================
    //   Armazenamento
    // ========================

    function load() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
                events: [],
                lastUpdate: Date.now()
            };
        } catch (e) {
            console.error("Erro ao carregar storage:", e);
            return { events: [] };
        }
    }

    function save(data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    // ========================
    //   Anti-duplicação REAL
    // ========================

    function getProcessed() {
        return JSON.parse(localStorage.getItem(PROCESSED_KEY)) || {};
    }

    function markProcessed(id) {
        const p = getProcessed();
        p[id] = true;
        localStorage.setItem(PROCESSED_KEY, JSON.stringify(p));
    }

    function isProcessed(id) {
        const p = getProcessed();
        return !!p[id];
    }

    // ========================
    //   Gerenciamento de eventos
    // ========================

    function listEvents() {
        return load().events;
    }

    function addEvent(evt) {
        const data = load();

        const exists = data.events.some(e =>
            e.id === evt.id ||
            (e.target === evt.target && e.time === evt.time)
        );

        if (exists) return false;

        data.events.push(evt);
        save(data);
        return true;
    }

    function removeEvent(id) {
        const data = load();
        data.events = data.events.filter(e => e.id !== id);
        save(data);
    }

    // ========================
    //   Executor central
    // ========================

    async function executeAttack(evt) {
        if (!evt || !evt.id) return { ok: false, error: "Evento inválido" };

        if (isProcessed(evt.id)) {
            console.warn("Ignorando duplicado:", evt.id);
            return { ok: false, duplicated: true };
        }

        markProcessed(evt.id);

        try {
            // Aqui será substituído pela função de envio real
            console.log("⚔ Enviando ataque →", evt);

            return { ok: true };
        } catch (err) {
            return { ok: false, error: err };
        }
    }

    // ========================
    //   API pública
    // ========================

    window.TWS_Backend = {
        listEvents,
        addEvent,
        removeEvent,
        executeAttack,
        markProcessed,
        isProcessed
    };

    console.log("📦 TWS Backend carregado");
})();
