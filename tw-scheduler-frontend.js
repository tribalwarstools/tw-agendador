// === TW Scheduler Frontend v2 — Painel + Modal + Tabela ===
(function() {
    'use strict';

    if (!window.TWS_Backend) {
        console.error('[TWS Frontend] Backend não encontrado!');
        return;
    }
    const backend = window.TWS_Backend;

    // Painel
    const panel = document.createElement('div');
    panel.id = 'tws_scheduler_panel';
    panel.style.cssText = `
        position: fixed;
        top: 50px;
        right: 10px;
        width: 360px;
        max-height: 80%;
        background: #fff;
        border: 1px solid #c6c6c6;
        border-radius: 8px;
        padding: 10px;
        box-shadow: 0 6px 18px rgba(0,0,0,0.15);
        overflow: auto;
        font-family: Arial, sans-serif;
        z-index: 99999;
    `;
    panel.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="font-size:14px">TW Scheduler</strong>
            <div>
                <button id="tws_panel_toggle" title="Fechar" style="cursor:pointer;border:none;background:transparent;font-size:14px;">✖</button>
            </div>
        </div>
        <button id="tws_add_event_btn" style="width:100%;margin-bottom:8px;padding:6px 8px;cursor:pointer;">➕ Novo Evento</button>
        <table id="tws_event_table" border="1" cellspacing="0" cellpadding="4" style="width:100%;font-size:12px;border-collapse:collapse;">
            <thead>
                <tr style="background:#f0f0f0">
                    <th>ID</th><th>Alvo</th><th>Hora</th><th>Status</th><th>Ações</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
        <div id="tws_logs" style="margin-top:8px;font-size:11px;height:90px;overflow:auto;background:#fafafa;padding:6px;border-radius:4px;border:1px solid #eee;"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById('tws_panel_toggle').addEventListener('click', () => {
        panel.style.display = 'none';
    });

    // Modal
    const modal = document.createElement('div');
    modal.id = 'tws_event_modal';
    modal.style.cssText = `
        display:none;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        background:#fff;
        border:1px solid #cfcfcf;
        border-radius:8px;
        padding:14px;
        z-index:100000;
        width:320px;
        box-shadow:0 10px 30px rgba(0,0,0,0.2);
        font-family: Arial, sans-serif;
    `;
    modal.innerHTML = `
        <h3 style="margin:0 0 8px 0;">Novo Evento</h3>
        <label>Origem (ID/Coord):<br><input type="text" id="tws_modal_origem" style="width:100%;padding:6px;margin-top:4px"></label><br>
        <label>Alvo (Coord):<br><input type="text" id="tws_modal_alvo" style="width:100%;padding:6px;margin-top:4px"></label><br>
        <label>Data/Hora (DD/MM/YYYY HH:MM:SS):<br><input type="text" id="tws_modal_datetime" style="width:100%;padding:6px;margin-top:4px" placeholder="ex: 24/11/2025 19:15:00"></label><br>
        <button id="tws_modal_save" style="margin-top:10px;width:100%;padding:8px;cursor:pointer;">Salvar</button>
        <button id="tws_modal_close" style="margin-top:6px;width:100%;padding:6px;cursor:pointer;">Fechar</button>
    `;
    document.body.appendChild(modal);

    document.getElementById('tws_add_event_btn').addEventListener('click', () => {
        document.getElementById('tws_modal_origem').value = '';
        document.getElementById('tws_modal_alvo').value = '';
        document.getElementById('tws_modal_datetime').value = '';
        modal.style.display = 'block';
    });
    document.getElementById('tws_modal_close').addEventListener('click', () => modal.style.display = 'none');

    // Log helper
    function log(msg) {
        const div = document.getElementById('tws_logs');
        const time = new Date().toLocaleTimeString();
        div.innerHTML += `[${time}] ${msg}<br>`;
        div.scrollTop = div.scrollHeight;
    }

    // Render table
    function renderTable() {
        const tbody = document.querySelector('#tws_event_table tbody');
        tbody.innerHTML = '';
        const list = (typeof backend.getList === 'function' ? backend.getList() : (typeof backend.listEvents === 'function' ? backend.listEvents() : []));
        // sort by date
        list.sort((a,b)=> {
            const ta = backend.parseDateTimeToMs(a.datetime || a.dateTime || '');
            const tb = backend.parseDateTimeToMs(b.datetime || b.dateTime || '');
            return (isNaN(ta)?Infinity:ta) - (isNaN(tb)?Infinity:tb);
        });
        list.forEach(evt => {
            const tr = document.createElement('tr');
            const status = evt.done ? '✅ Concluído' : (backend.attackCoordinator && backend.attackCoordinator.isBeingProcessed && backend.attackCoordinator.isBeingProcessed(evt._id) ? '⏳ Executando' : '⌛ Pendente');
            tr.innerHTML = `
                <td style="max-width:80px;word-break:break-all;">${evt._id || ''}</td>
                <td>${evt.alvo || ''}</td>
                <td>${evt.datetime || ''}</td>
                <td>${status}</td>
                <td>
                    <button class="tws_delete_btn" data-id="${evt._id}" style="cursor:pointer;">❌</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // attach delete handlers
        document.querySelectorAll('.tws_delete_btn').forEach(btn=>{
            btn.addEventListener('click', (e)=>{
                const id = e.currentTarget.dataset.id;
                if (!id) return;
                // try to use backend.removeEvent if exists
                if (typeof backend.removeEvent === 'function') {
                    backend.removeEvent(id);
                } else if (typeof backend.getList === 'function' && typeof backend.setList === 'function') {
                    const newList = backend.getList().filter(x => x._id !== id);
                    backend.setList(newList);
                }
                renderTable();
                log('🗑️ Evento removido: ' + id);
            });
        });
    }

    // Save handler
    document.getElementById('tws_modal_save').addEventListener('click', () => {
        const origem = document.getElementById('tws_modal_origem').value.trim();
        const alvo = document.getElementById('tws_modal_alvo').value.trim();
        const datetime = document.getElementById('tws_modal_datetime').value.trim();

        if (!origem || !alvo || !datetime) {
            log('⚠️ Preencha todos os campos');
            return;
        }

        // validate date
        const ts = (typeof backend.parseDateTimeToMs === 'function') ? backend.parseDateTimeToMs(datetime) : NaN;
        if (isNaN(ts)) {
            log('⚠️ Data/hora inválida. Use DD/MM/YYYY HH:MM[:SS]');
            return;
        }

        const evento = {
            _id: (typeof backend.generateUniqueId === 'function') ? backend.generateUniqueId() : ('evt_' + Date.now()),
            origem,
            alvo,
            datetime,
            done: false
        };

        // persist using backend API (choose available)
        if (typeof backend.getList === 'function' && typeof backend.setList === 'function') {
            const list = backend.getList();
            list.push(evento);
            backend.setList(list);
        } else if (typeof backend.addEvent === 'function') {
            backend.addEvent(evento);
        } else {
            // fallback: set window storage directly
            const raw = localStorage.getItem('tws_scheduler_list_v2');
            const arr = raw ? JSON.parse(raw) : [];
            arr.push(evento);
            localStorage.setItem('tws_scheduler_list_v2', JSON.stringify(arr));
        }

        modal.style.display = 'none';
        renderTable();
        log('✅ Evento adicionado: ' + (evento.alvo || '') + ' — ' + evento.datetime);
    });

    // Listen for backend executed events
    window.addEventListener('tws:eventExecuted', (ev) => {
        const executed = ev && ev.detail ? ev.detail : null;
        if (executed) {
            log('⚔️ Evento executado: ' + (executed._id || '?') + ' → ' + (executed.alvo || ''));
        } else {
            log('⚔️ Evento executado (detalhes indisponíveis)');
        }
        renderTable();
    });

    // Auto-refresh table periodically to reflect changes
    const RENDER_INTERVAL = 1200;
    setInterval(renderTa
