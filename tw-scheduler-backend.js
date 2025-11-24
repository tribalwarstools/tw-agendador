// === TW Scheduler Backend — Compatível com o Frontend v1 ===

(function () {
    'use strict';

    const STORAGE_KEY = "tws_scheduler_list_v1";
    const PROCESSED_KEY = "tws_scheduler_processed_v1";

    // =====================================================
    //  Funções Utilitárias
    // =====================================================

    function generateUniqueId() {
        return "evt_" + Math.random().toString(36).substr(2, 9);
    }

    function parseDateTimeToMs(str) {
        // Formato esperado: DD/MM/YYYY HH:MM:SS
        const [date, time] = str.split(" ");
        const [d, m, y] = date.split("/").map(Number);
        const [hh, mm, ss] = time.split(":").map(Number);
        return new Date(y, m - 1, d, hh, mm, ss).getTime();
    }

    // =====================================================
    //  Lista de Eventos
    // =====================================================

    function getList() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        } catch {
            return [];
        }
    }

    function setList(list) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }

    // =====================================================
    //  Controle de Processamento
    // =====================================================

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

    // =====================================================
    //  Execução
    // =====================================================

    async function executeAttack(evt) {
        attackCoordinator.markProcessing(evt._id);

        console.log("⚔ Enviando ataque:", evt);

        setTimeout(() => {
            attackCoordinator.clearProcessing(evt._id);
        }, 3000);

        return { ok: true };
    }

    // =====================================================
    //  API Pública
    // =====================================================

    window.TWS_Backend = {
        generateUniqueId,
        parseDateTimeToMs,
        getList,
        setList,

        attackCoordinator,
        executeAttack,
    };

    console.log("📦 Backend carregado (compatível com frontend)");
})();
