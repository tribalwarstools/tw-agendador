// === TWS MODAL DE ATAQUE ===
// Componente externo chamado pelo frontend.

(function () {
    'use strict';

    // Evita carregar 2x
    if (window.TWS_Modal) return;

    // ================================
    // HELPERS
    // ================================

    const $ = (sel, el = document) => el.querySelector(sel);

    function createEl(tag, attrs = {}, html = "") {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
        if (html) e.innerHTML = html;
        return e;
    }

    // ================================
    // MODAL PRINCIPAL DE ATAQUE
    // ================================

    function openAttackModal() {
        const id = "tws-attack-modal";
        $("#" + id)?.remove();

        const modal = createEl("div", {
            id,
            style: `
                position: fixed;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                background: #fefefe;
                border: 2px solid #444;
                padding: 20px;
                z-index: 100000;
                width: 420px;
                font-size: 13px;
            `
        });

        modal.innerHTML = `
            <h2 style="margin-top:0;">Novo Ataque</h2>

            <label>Vila Origem:<br>
                <input id="tws-src" style="width:100%;" placeholder="119394">
            </label><br><br>

            <label>Alvo (coords):<br>
                <input id="tws-target" style="width:100%;" placeholder="500|500">
            </label><br><br>

            <label>Horário do envio:<br>
                <input id="tws-time" style="width:100%;" placeholder="timestamp (ms)">
            </label><br><br>

            <h3>Tropas</h3>

            <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:4px;">
                ${[
                    "spear", "sword", "axe", "archer",
                    "spy", "light", "marcher", "heavy",
                    "ram", "catapult", "knight", "snob"
                ].map(u => `
                    <label>${u}: 
                        <input id="tws-unit-${u}" style="width:55px;" value="0">
                    </label>
                `).join("")}
            </div>

            <br>
            <button id="tws-save-attack" class="btn">Salvar Evento</button>
            <button id="tws-cancel-modal" class="btn">Fechar</button>
        `;

        document.body.appendChild(modal);

        // ================================
        // AÇÕES
        // ================================

        $("#tws-cancel-modal").onclick = () => modal.remove();

        $("#tws-save-attack").onclick = () => {

            const src = $("#tws-src").value.trim();
            const trg = $("#tws-target").value.trim();
            const time = Number($("#tws-time").value.trim());

            if (!src || !trg || !time) {
                alert("Preencha origem, alvo e horário.");
                return;
            }

            // montar tropas
            const troops = {};
            const units = [
                "spear", "sword", "axe", "archer",
                "spy", "light", "marcher", "heavy",
                "ram", "catapult", "knight", "snob"
            ];

            for (const u of units) {
                troops[u] = Number($("#tws-unit-" + u).value || 0);
            }

            const evt = {
                id: "evt_" + Date.now(),
                source: src,
                target: trg,
                time,
                troops,
                executed: false
            };

            window.TWS_Backend.addEvent(evt);

            alert("Evento criado!");
            modal.remove();

            window.TWS_Frontend.renderTable(); // atualização da tabela
        };
    }

    // ================================
    // API pública
    // ================================

    window.TWS_Modal = {
        openAttackModal
    };

})();
