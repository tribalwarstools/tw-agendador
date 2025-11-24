// === TW Scheduler Frontend v1 — Painel + Tabela + Modal ===
(function() {
    'use strict';

    if (!window.TWS_Backend) {
        console.error('[TWS Frontend] ❌ Backend não encontrado!');
        return;
    }

    const backend = window.TWS_Backend;

    // =================== Criação do painel ===================
    const panel = document.createElement('div');
    panel.id = 'tws_scheduler_panel';
    panel.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        width: 350px;
        max-height: 80%;
        background: #f4f4f4;
        border: 1px solid #888;
        border-radius: 6px;
        padding: 10px;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        overflow: auto;
        font-family: Arial, sans-serif;
        z-index: 9999;
    `;

    panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong>TW Scheduler</strong>
            <button id="tws_panel_toggle" style="cursor:pointer;">✖</button>
        </div>
        <button id="tws_add_event_btn" style="width:100%;margin-bottom:10px;">➕ Novo Evento</button>
        <table id="tws_event_table" border="1" cellspacing="0" cellpadding="4" style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Alvo</th>
                    <th>Hora</th>
                    <th>Status</th>
                    <th>Ações</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div id="tws_logs" style="margin-top:10px;font-size:11px;height:80px;overflow:auto;background:#eee;padding:4px;border-radius:4px;"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById('tws_panel_toggle').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // =================== Modal de Adicionar Evento ===================
    const modal = document.createElement('div');
    modal.id = 'tws_event_modal';
    modal.style.cssText = `
        display:none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        background:#fff;
        border:1px solid #888;
        border-radius:6px;
        padding:15px;
        z-index:10000;
        width:300px;
        box-shadow:0 0 15px rgba(0,0,0,0.4);
        font-family: Arial, sans-serif;
    `;
    modal.innerHTML = `
        <h3 style="margin-top:0;">Novo Evento</h3>
        <label>Origem (ID/Coord):<br><input type="text" id="tws_modal_origem" style="width:100%"></label><br>
        <label>Alvo (Coord):<br><input type="text" id="tws_modal_alvo" style="width:100%"></label><br>
        <label>Data/Hora (DD/MM/YYYY HH:MM:SS):<br><input type="text" id="tws_modal_datetime" style="width:100%"></label><br>
        <button id="tws_modal_save" style="margin-top:10px;width:100%;">Salvar</button>
        <button id="tws_modal_close" style="margin-top:5px;width:100%;">Fechar</button>
    `;
    document.body.appendChild(modal);

    document.getElementById('tws_add_event_btn').addEventListener('click', () => {
        modal.style.display = 'block';
    });
    document.getElementById('tws_modal_close').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    document.getElementById('tws_modal_save').addEventListener('click', () => {
        const origem = document.getElementById('tws_modal_origem').value.trim();
        const alvo = document.getElementById('tws_modal_alvo').value.trim();
        const datetime = document.getElementById('tws_modal_datetime').value.trim();

        if (!origem || !alvo || !datetime) {
            log('⚠️ Preencha todos os campos');
            return;
        }

        const evento = {
            _id: backend.generateUniqueId(),
            origem: origem,
            origemId: origem,
            alvo: alvo,
            datetime: datetime,
            done: false
        };

        const list = backend.getList();
        list.push(evento);
        backend.setList(list);
        modal.style.display = 'none';
        renderTable();
        log('✅ Evento adicionado: ' + alvo + ' às ' + datetime);
    });

    // =================== Funções de renderização ===================
    function renderTable() {
        const tbody = document.querySelector('#tws_event_table tbody');
        tbody.innerHTML = '';
        const list = backend.getList().sort((a,b)=>backend.parseDateTimeToMs(a.datetime)-backend.parseDateTimeToMs(b.datetime));
        list.forEach(evt => {
            const tr = document.createElement('tr');
            const status = evt.done ? '✅ Concluído' : backend.attackCoordinator.isBeingProcessed(evt._id) ? '⏳ Executando' : '⌛ Pendente';
            tr.innerHTML = `
                <td>${evt._id}</td>
                <td>${evt.alvo}</td>
                <td>${evt.datetime}</td>
                <td>${status}</td>
                <td>
                    <button class="tws_delete_btn" data-id="${evt._id}">❌</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        document.querySelectorAll('.tws_delete_btn').forEach(btn=>{
            btn.addEventListener('click', e=>{
                const id = e.target.dataset.id;
                const list = backend.getList().filter(ev=>ev._id!==id);
                backend.setList(list);
                renderTable();
                log('🗑️ Evento removido: '+id);
            });
        });
    }

    function log(msg) {
        const div = document.getElementById('tws_logs');
        const time = new Date().toLocaleTimeString();
        div.innerHTML += `[${time}] ${msg}<br>`;
        div.scrollTop = div.scrollHeight;
    }

    // =================== Atualização automática ===================
    setInterval(renderTable, 2000);

    // Inicialização
    renderTable();
    log('🖥️ Frontend carregado');
})();
