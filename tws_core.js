// ======================
// TWS Core (Núcleo)
// ======================

window.TWS = {
    VERSION: "3.0",
    ready: false,

    state: {
        events: [],
        tabMaster: false
    },

    config: {
        STORAGE_KEY: "tws_events_v3",
        TAB_LOCK_KEY: "tws_tab_lock_v3",
        TAB_LOCK_TIMEOUT: 3000
    },

    // -------------------
    // UTILIDADES
    // -------------------
    utils: {
        log(msg, color = "cyan") {
            console.log(`%c[TWS] ${msg}`, `color: ${color}`);
        }
    },

    // -------------------
    // STORAGE
    // -------------------
    storage: {
        loadEvents() {
            const raw = localStorage.getItem(TWS.config.STORAGE_KEY);
            TWS.state.events = raw ? JSON.parse(raw) : [];
        },

        saveEvents() {
            localStorage.setItem(
                TWS.config.STORAGE_KEY,
                JSON.stringify(TWS.state.events)
            );
        }
    },

    // -------------------
    // MULTI-ABA (LOCK)
    // -------------------
    lock: {
        tryAcquire() {
            const now = Date.now();
            const raw = localStorage.getItem(TWS.config.TAB_LOCK_KEY);
            const last = raw ? JSON.parse(raw).t : 0;

            if (now - last > TWS.config.TAB_LOCK_TIMEOUT) {
                localStorage.setItem(TWS.config.TAB_LOCK_KEY, JSON.stringify({ t: now }));
                TWS.state.tabMaster = true;
                return true;
            }

            TWS.state.tabMaster = false;
            return false;
        },

        refresh() {
            localStorage.setItem(TWS.config.TAB_LOCK_KEY, JSON.stringify({ t: Date.now() }));
        }
    },

    // -------------------
    // SCHEDULER
    // -------------------
    scheduler: {
        loop: null,

        start() {
            if (this.loop) return;

            this.loop = setInterval(() => {
                if (!TWS.lock.tryAcquire()) return;
                TWS.lock.refresh();

                const now = Date.now();

                for (const task of TWS.state.events) {
                    if (task.executed) continue;
                    if (Math.abs(task.time - now) > 1200) continue;

                    TWS.backend.executeAttack(task).then(res => {
                        task.executed = Date.now();
                        TWS.storage.saveEvents();
                    });
                }
            }, 200);
        }
    },

    // -------------------
    // INICIALIZAÇÃO
    // -------------------
    init() {
        TWS.utils.log("Core carregado", "green");

        this.storage.loadEvents();
        this.scheduler.start();

        this.ready = true;

        document.dispatchEvent(new Event("tws-ready"));
    }
};
