// === TW Scheduler Backend — Scheduler automático ===
(function () {
    'use strict';

    const STORAGE_KEY = "tws_scheduler_list_v1";

    // utilitários
    function generateUniqueId() {
        return "evt_" + Math.random().toString(36).substr(2, 9);
    }

    function parseDateTimeToMs(str) {
        // Formato esperado: DD/MM/YYYY HH:MM:SS (aceita sem segundos "DD/MM/YYYY HH:MM")
        if (!str) return NaN;
        const parts = str.trim().split(' ');
        if (parts.length < 2) return NaN;
        const [d,m,y] = parts[0].split('/').map(Number);
        const timeParts = parts[1].split(':').map(Number);
        const hh = timeParts[0] || 0;
        const mm = timeParts[1] || 0;
        const ss = timeParts[2] || 0;
        const date = new Date(y, (m||1)-1, d||1, hh, mm, ss);
        return date.getTime();
    }

    // storage
    function getList() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch (e) {
            console.error("TWS Backend: erro ao ler storage", e);
            return [];
        }
    }

    function setList(list) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        } catch (e) {
            console.error("TWS Backend: erro ao salvar storage", e);
        }
    }

    // coordinator em memória para evitar reentrância
    const attackCoordinator = {
        processing: {},

        isBeingProcessed(id) {
            return !!this.processing[id];
        },

        markProcessing(id) {
            this.processing[id] = true;
        },

        clearProcessing(id) {
            delete this.processing[id];
        }
    };

    // função que "envia" o ataque (simulação)
    async function executeAttack(evt) {
        if (!evt || !evt._id) return { ok: false, error: "Evento inválido" };
        if (attackCoordinator.isBeingProcessed(evt._id)) return { ok: false, error: "Já em processamento" };

        attackCoordinator.markProcessing(evt._id);
        console.log("⚔️ [TWS Backend] Executando ataque:", evt);

        try {
            // Simulação de envio: substitua por fetch real/automação do TW se quiser
            await new Promise(res => setTimeout(res, 1000)); // simula tempo de envio

            // marca como concluído na lista persistida
            const list = getList();
            const idx = list.findIndex(e => e._id === evt._id);
            if (idx !== -1) {
                list[idx].done = true;
                list[idx].executedAt = Date.now();
                setList(list);
            }

            // sinaliza para o frontend que um evento foi executado
            try {
                window.dispatchEvent(new CustomEvent('tws:eventExecuted', { detail: list[idx] || evt }));
            } catch (e) { /* não crítico */ }

            console.log("✅ [TWS Backend] Ataque concluído:", evt._id);
            return { ok: true };
        } catch (err) {
            console.error("❌ [TWS Backend] Erro no executeAttack:", err);
            return { ok: false, error: err };
        } finally {
            attackCoordinator.clearProcessing(evt._id);
        }
    }

    // Scheduler: roda a cada 800ms e dispara ataques prontos
    const CHECK_INTERVAL_MS = 800;
    let schedulerHandle = null;

    function startScheduler() {
        if (schedulerHandle) return;
        schedulerHandle = setInterval(() => {
            try {
                const now = Date.now();
                const list = getList();

                // procurar eventos pendentes e com hora <= now
                for (const evt of list) {
                    // precisa ter datetime convertível e não estar done
                    const ts = parseDateTimeToMs(evt.datetime);
                    if (!evt.done && !attackCoordinator.isBeingProcessed(evt._id) && !isNaN(ts) && ts <= now) {
                        // dispara async sem bloquear o loop
                        (async () => {
                            await executeAttack(evt);
                        })();
                    }
                }
            } catch (e) {
                console.error("TWS Scheduler error:", e);
            }
        }, CHECK_INTERVAL_MS);
        console.log("[TWS Backend] Scheduler iniciado (interval " + CHECK_INTERVAL_MS + "ms)");
    }

    // API pública
    window.TWS_Backend = {
        generateUniqueId,
        parseDateTimeToMs,
        getList,
        setList,
        attackCoordinator,
        executeAttack,
        startScheduler,
        _internal: { /* para debug */ }
    };

    // iniciar automaticamente
    startScheduler();

    console.log("📦 TWS Backend (scheduler) carregado");
})();
