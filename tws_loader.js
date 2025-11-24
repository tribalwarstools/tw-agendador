// ==UserScript==
// @name         TWS Scheduler Loader
// @namespace    https://tribalwarstools.com
// @version      1.0
// @description  Carrega backend e frontend do TW Scheduler
// @match        https://*.tribalwars.com.br/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const baseURL = 'https://cdn.jsdelivr.net/gh/tribalwarstools/tw-agendador@latest/';

    const scripts = [
        'tw-scheduler-backend.js',
        'tw-scheduler-frontend.js'
    ];

    function loadScript(url) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = url;
            s.type = 'text/javascript';
            s.onload = () => {
                console.log(`[TWS Loader] Script carregado: ${url}`);
                resolve();
            };
            s.onerror = (e) => {
                console.error(`[TWS Loader] Falha ao carregar: ${url}`, e);
                reject(e);
            };
            document.head.appendChild(s);
        });
    }

    startLoader();

})();
