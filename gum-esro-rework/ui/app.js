const appResourceName = 'gum-esro-rework';
const resourceName = typeof GetParentResourceName === 'function' ? GetParentResourceName() : appResourceName;

const state = {
    visible: false,
    embedded: false,
    booting: false,
    snapshot: null,
    screen: 'terminal',
    channel: 'PUBLIC',
    focusedContractId: null,
    lastCompletedContract: null,
    tabs: {
        ops: 'expeditions',
        faction: 'overview',
        profile: 'summary',
        contracts: 'board'
    }
};

const phoneShellEl = document.getElementById('phone-shell');
const phoneFrameEl = document.getElementById('phone-frame');
const bootSplashEl = document.getElementById('bootSplash');
const bootLogoEl = document.querySelector('.boot-logo');
const bootSubtitleEl = document.querySelector('.boot-subtitle');
const appEl = document.getElementById('app');
const screenEl = document.getElementById('screen');
const topNavEl = document.getElementById('topNav');
const quickActionsEl = document.getElementById('quickActions');
const closeButtonEl = document.getElementById('closeButton');
const statusChipEl = document.getElementById('statusChip');
let bootRetryCount = 0;
let bootRetryTimer = 0;

const navItems = [
    { id: 'terminal', label: 'Terminal' },
    { id: 'ops', label: 'Ops' },
    { id: 'contracts', label: 'Contracts' },
    { id: 'faction', label: 'Faction' },
    { id: 'profile', label: 'Profile' }
];

function getAssetUrl(assetName) {
    return `https://cfx-nui-${appResourceName}/ui/assets/${assetName}`;
}

function detectEmbeddedContext() {
    return typeof window.fetchNui === 'function'
        && (Boolean(globalThis.appIdentifier) || globalThis.resourceName === 'lb-phone');
}

function applyAssetUrls() {
    if (phoneFrameEl) {
        phoneFrameEl.src = getAssetUrl('phone-frame.png');
    }

    if (bootLogoEl) {
        bootLogoEl.src = getAssetUrl('esro-logo.png');
    }

    document.documentElement.style.setProperty('--app-logo-url', `url("${getAssetUrl('esro-logo.png')}")`);
}

function postNui(endpoint, payload = {}) {
    if (typeof window.fetchNui === 'function') {
        const ownerResource = typeof globalThis.resourceName === 'string' ? globalThis.resourceName : '';

        if (ownerResource && ownerResource !== appResourceName) {
            return window.fetchNui('proxyUiEvent', {
                eventName: endpoint,
                payload
            });
        }

        return window.fetchNui(endpoint, payload, appResourceName);
    }

    return fetch(`https://${resourceName}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify(payload)
    }).then((response) => response.json());
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function setBooting(booting) {
    state.booting = booting;
    bootSplashEl.classList.toggle('hidden', !booting);
    appEl.classList.toggle('hidden', !state.visible || booting);

    if (bootSubtitleEl && booting) {
        bootSubtitleEl.textContent = 'linking relay';
    }

    if (!booting && bootRetryTimer) {
        window.clearTimeout(bootRetryTimer);
        bootRetryTimer = 0;
    }
}

function updateEmbeddedScale() {
    const targetWidth = 430;
    const targetHeight = 860;
    const currentWidth = Math.max(window.innerWidth || 0, 1);
    const currentHeight = Math.max(window.innerHeight || 0, 1);
    const widthScale = currentWidth / targetWidth;
    const heightScale = currentHeight / targetHeight;
    const scale = Math.max(0.76, Math.min(1, Math.min(widthScale, heightScale)));

    document.documentElement.style.setProperty('--embedded-scale', scale.toFixed(3));
}

function applyEmbeddedFrame(active) {
    state.embedded = active;
    document.body.classList.toggle('lb-embedded', active);

    if (active) {
        updateEmbeddedScale();
    } else {
        document.documentElement.style.setProperty('--embedded-scale', '1');
    }
}

function setVisible(visible, embedded = false) {
    state.visible = visible;
    phoneShellEl.classList.toggle('hidden', !visible);
    applyEmbeddedFrame(visible && embedded);

    if (!visible) {
        state.snapshot = null;
        bootRetryCount = 0;
        setBooting(false);
    } else {
        bootRetryCount = 0;
        setBooting(true);
        scheduleBootstrapRetry();
    }

    statusChipEl.textContent = visible ? 'linked' : 'offline';
}

function announceUiReady() {
    return postNui('uiReady', {
        embedded: detectEmbeddedContext() || state.embedded,
        source: detectEmbeddedContext() ? 'lb-phone' : resourceName
    }).catch(() => null);
}

function queueUiReadyAnnouncements() {
    [0, 150, 500, 1000].forEach((delay) => {
        window.setTimeout(() => {
            announceUiReady();
        }, delay);
    });
}

function scheduleBootstrapRetry() {
    if (bootRetryTimer) {
        window.clearTimeout(bootRetryTimer);
        bootRetryTimer = 0;
    }

    if (!state.visible || !state.booting || state.snapshot || bootRetryCount >= 6) {
        return;
    }

    bootRetryTimer = window.setTimeout(() => {
        bootRetryTimer = 0;

        if (!state.visible || !state.booting || state.snapshot) {
            return;
        }

        bootRetryCount += 1;
        postNui('requestBootstrap').catch(() => null);
        scheduleBootstrapRetry();
    }, 1250);
}

function getSnapshot() {
    return state.snapshot || {};
}

function getQuickActions() {
    return getSnapshot().quickActions || [];
}

function applyDeeplink(deeplink = {}) {
    if (deeplink.screen) {
        state.screen = deeplink.screen;
    }

    if (deeplink.screen && deeplink.tab) {
        state.tabs[deeplink.screen] = deeplink.tab;
    }

    if (deeplink.channel) {
        state.channel = deeplink.channel;
    }

    state.focusedContractId = deeplink.contractId || null;
}

function renderQuickActions() {
    const quickActions = getQuickActions();

    if (!quickActions.length) {
        quickActionsEl.innerHTML = '<div class="quick-card subtle">No urgent relay actions.</div>';
        return;
    }

    quickActionsEl.innerHTML = quickActions.map((entry) => `
        <button class="quick-card" data-quick-screen="${escapeHtml(entry.deeplink?.screen || '')}" data-quick-tab="${escapeHtml(entry.deeplink?.tab || '')}" data-quick-channel="${escapeHtml(entry.deeplink?.channel || '')}" data-quick-contract="${escapeHtml(entry.deeplink?.contractId || '')}" type="button">
            <div class="subtle">${escapeHtml(entry.type || 'notice')}</div>
            <strong>${escapeHtml(entry.label || 'Action')}</strong>
        </button>
    `).join('');

    quickActionsEl.querySelectorAll('[data-quick-screen]').forEach((button) => {
        button.addEventListener('click', () => {
            const screen = button.dataset.quickScreen;
            const tab = button.dataset.quickTab;
            const channel = button.dataset.quickChannel;

            applyDeeplink({
                screen,
                tab,
                channel,
                contractId: button.dataset.quickContract
            });

            render();
        });
    });
}

function renderNav() {
    const unreadNotifications = Number(getSnapshot().notifications?.unread || 0);

    topNavEl.innerHTML = navItems.map((item) => `
        <button class="nav-button ${state.screen === item.id ? 'is-active' : ''}" data-screen="${item.id}" type="button">
            ${item.label}${item.id === 'profile' && unreadNotifications > 0 ? ` <span class="nav-badge">${Math.min(unreadNotifications, 9)}${unreadNotifications > 9 ? '+' : ''}</span>` : ''}
        </button>
    `).join('');

    topNavEl.querySelectorAll('[data-screen]').forEach((button) => {
        button.addEventListener('click', () => {
            state.screen = button.dataset.screen;
            render();
        });
    });
}

function renderTerminal() {
    const snapshot = getSnapshot();
    const channelDefinitions = snapshot.channelDefinitions || {};
    const terminal = snapshot.terminal || { messages: {}, pinned: {} };
    const availableChannels = (snapshot.channels || []).filter((channelId) => terminal.messages?.[channelId]);

    if (!availableChannels.includes(state.channel)) {
        state.channel = availableChannels[0] || 'PUBLIC';
    }

    const messages = terminal.messages?.[state.channel] || [];
    const pin = terminal.pinned?.[state.channel];

    return `
        <section class="panel">
            <div class="terminal__header">
                <div>
                    <h2>Terminal</h2>
                    <p class="subtle">Chat stays central. All other actions stay one tap away.</p>
                </div>
                <div class="chip">${escapeHtml(state.channel)}</div>
            </div>
            <div class="channel-row">
                ${availableChannels.map((channelId) => `
                    <button class="channel-tab ${state.channel === channelId ? 'is-active' : ''}" data-channel="${channelId}" type="button">
                        ${escapeHtml(channelDefinitions[channelId]?.label || channelId)}
                    </button>
                `).join('')}
            </div>
            ${pin ? `
                <div class="list-card">
                    <div class="list-card__title">
                        <strong>Pinned notice</strong>
                        <span class="tag">${escapeHtml(pin.pinnedBy || 'System')}</span>
                    </div>
                    <p>${escapeHtml(pin.text || '')}</p>
                </div>
            ` : ''}
            <div class="messages">
                ${messages.length ? messages.map((line) => `
                    <article class="message">
                        <div class="message__meta">
                            <span>${escapeHtml(line.handle || 'Unknown')} · ${escapeHtml(line.title?.label || 'Relay Initiate')}</span>
                            <span>${escapeHtml(line.ts || '')}</span>
                        </div>
                        <div class="message__body">${escapeHtml(line.text || '')}</div>
                    </article>
                `).join('') : '<div class="empty-state">No relay traffic yet.</div>'}
            </div>
            <form id="composeForm" class="compose">
                <input id="composeInput" maxlength="220" placeholder="Send a short relay message" type="text">
                <button class="primary-button" type="submit">Send</button>
            </form>
        </section>
    `;
}

function renderOps() {
    const ops = getSnapshot().ops || {};
    const skills = ops.skills || [];
    const expeditions = Object.values(ops.expeditions?.definitions || {});
    const recipes = Object.values(ops.crafting?.recipes || {});
    const activeRoutes = ops.expeditions?.active || [];
    const results = ops.expeditions?.results || [];
    const rollState = ops.rolling?.state || {};
    const rollHistory = rollState.history || [];
    const exchangeShop = ops.rolling?.exchangeShop || [];

    return `
        <section class="panel">
            <div>
                <h2>Ops</h2>
                <p class="subtle">Short-session prep, claims, skills, crafting, and rolls.</p>
                <div class="tag">Focused: ${escapeHtml(state.tabs.ops || 'expeditions')}</div>
            </div>
            <div class="summary-grid">
                <div class="metric">
                    <div class="metric__label">Active</div>
                    <div class="metric__value">${activeRoutes.length}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Claimable</div>
                    <div class="metric__value">${results.length}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Relay Tokens</div>
                    <div class="metric__value">${rollState.commonCurrency ?? 0}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Pity</div>
                    <div class="metric__value">${rollState.standardPity ?? 0}/${ops.rolling?.pool?.pityThreshold ?? 20}</div>
                </div>
            </div>
            ${activeRoutes.length ? `
                <div class="list-grid">
                    ${activeRoutes.map((route) => `
                        <article class="list-card">
                            <div class="list-card__title">
                                <strong>${escapeHtml(route.label)}</strong>
                                <span class="tag">${route.remaining}s</span>
                            </div>
                            <p class="subtle">Passive expedition in progress.</p>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
            ${results.length ? `
                <div class="list-grid">
                    ${results.map((entry) => `
                        <article class="list-card">
                            <div class="list-card__title">
                                <strong>${escapeHtml(entry.label)}</strong>
                                <button class="primary-button" data-claim-expedition="${escapeHtml(entry.id)}" type="button">Claim</button>
                            </div>
                            <p class="subtle">${(entry.result?.logs || []).map(escapeHtml).join(' · ')}</p>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
            <div class="list-grid">
                ${expeditions.map((route) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(route.label)}</strong>
                            <button class="primary-button" data-start-expedition="${escapeHtml(route.id)}" type="button">Start</button>
                        </div>
                        <div class="list-card__meta">
                            <span>${escapeHtml(route.risk)}</span>
                            <span>${escapeHtml(route.requiredSkill)}</span>
                        </div>
                    </article>
                `).join('')}
            </div>
            <div class="list-grid">
                ${skills.slice(0, 4).map((skill) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(skill.label)}</strong>
                            <span class="tag">Lv ${skill.level}</span>
                        </div>
                        <p class="subtle">${escapeHtml(skill.summary)}</p>
                    </article>
                `).join('')}
            </div>
            <div class="list-grid">
                ${recipes.map((recipe) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(recipe.label)}</strong>
                            <button class="primary-button" data-craft-recipe="${escapeHtml(recipe.id)}" type="button">Craft</button>
                        </div>
                        <div class="list-card__meta">
                            <span>${escapeHtml(recipe.category)}</span>
                            <span>${recipe.durationSeconds}s</span>
                        </div>
                    </article>
                `).join('')}
            </div>
            <div class="list-card">
                <div class="list-card__title">
                    <strong>${escapeHtml(ops.rolling?.pool?.label || 'Signal Pull')}</strong>
                    <button class="primary-button" data-perform-roll="${escapeHtml(ops.rolling?.pool?.id || 'signal_pull_standard')}" type="button">Pull</button>
                </div>
                <div class="list-card__meta">
                    <span>Cost ${ops.rolling?.pool?.cost ?? 1}</span>
                    <span>Salvage ${rollState.salvage ?? 0}</span>
                </div>
                <p class="subtle">Short-session reward pulls with server pity and duplicate salvage.</p>
            </div>
            ${rollHistory.length ? `
                <div class="list-grid">
                    ${rollHistory.map((entry) => `
                        <article class="list-card">
                            <div class="list-card__title">
                                <strong>${escapeHtml(entry.label)}</strong>
                                <span class="tag">${escapeHtml(entry.rarity)}</span>
                            </div>
                            <p class="subtle">${entry.duplicate ? 'Duplicate converted to salvage.' : 'Added to inventory.'}</p>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
            ${exchangeShop.length ? `
                <div class="list-grid">
                    ${exchangeShop.map((entry) => `
                        <article class="list-card">
                            <div class="list-card__title">
                                <strong>${escapeHtml(entry.label)}</strong>
                                <button class="primary-button" data-exchange-salvage="${escapeHtml(entry.id)}" type="button">Exchange</button>
                            </div>
                            <p class="subtle">Cost ${entry.cost} salvage</p>
                        </article>
                    `).join('')}
                </div>
            ` : ''}
        </section>
    `;
}

function attachOpsEvents() {
    screenEl.querySelectorAll('[data-start-expedition]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('startExpedition', {
                routeId: button.dataset.startExpedition
            });
        });
    });

    screenEl.querySelectorAll('[data-claim-expedition]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('claimExpedition', {
                expeditionId: button.dataset.claimExpedition
            });
        });
    });

    screenEl.querySelectorAll('[data-craft-recipe]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('craftItem', {
                recipeId: button.dataset.craftRecipe
            });
        });
    });

    screenEl.querySelectorAll('[data-perform-roll]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('performRoll', {
                poolId: button.dataset.performRoll
            });
        });
    });

    screenEl.querySelectorAll('[data-exchange-salvage]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('exchangeSalvage', {
                exchangeId: button.dataset.exchangeSalvage
            });
        });
    });
}

function renderContracts() {
    const entries = getSnapshot().contracts?.entries || [];
    const filters = Object.values(getSnapshot().contracts?.filters || {});
    const activeTab = state.tabs.contracts || 'board';
    const eventEntries = entries.filter((entry) => entry.type === 'event');
    const boardEntries = entries.filter((entry) => entry.type !== 'event');
    const visibleEntries = activeTab === 'events' ? eventEntries : boardEntries;
    const completionReceipt = activeTab === 'events' ? state.lastCompletedContract : null;
    const orderedEntries = [...visibleEntries].sort((left, right) => {
        if (left.id === state.focusedContractId) {
            return -1;
        }

        if (right.id === state.focusedContractId) {
            return 1;
        }

        return 0;
    });

    return `
        <section class="panel">
            <div>
                <h2>Contracts</h2>
                <p class="subtle">Jobs connect chat, factions, and expeditions.</p>
                <div class="tab-row">
                    <button class="channel-tab ${activeTab === 'board' ? 'is-active' : ''}" data-contract-tab="board" type="button">Board</button>
                    <button class="channel-tab ${activeTab === 'events' ? 'is-active' : ''}" data-contract-tab="events" type="button">Events ${eventEntries.length ? `(${eventEntries.length})` : ''}</button>
                </div>
            </div>
            ${completionReceipt ? `
            <article class="list-card list-card--receipt">
                <div class="list-card__title">
                    <strong>${escapeHtml(completionReceipt.title)}</strong>
                    <span class="tag">completed</span>
                </div>
                <p class="subtle">${escapeHtml(completionReceipt.body)}</p>
            </article>` : ''}
            ${activeTab === 'board' ? `
            <form id="contractForm" class="list-card">
                <div class="list-card__title">
                    <strong>Post contract</strong>
                    <button class="primary-button" type="submit">Post</button>
                </div>
                <div class="list-card__meta">
                    <select id="contractTypeSelect">
                        ${filters.filter((entry) => entry.allowPosting).map((entry) => `
                            <option value="${escapeHtml(entry.id)}">${escapeHtml(entry.label)}</option>
                        `).join('')}
                    </select>
                </div>
                <input id="contractTitleInput" maxlength="96" placeholder="Short contract title" type="text">
                <input id="contractSummaryInput" maxlength="180" placeholder="Short requirement summary" type="text">
            </form>` : ''}
            ${orderedEntries.length ? orderedEntries.map((entry) => `
                <article class="list-card ${entry.id === state.focusedContractId ? 'is-focused' : ''}">
                    <div class="list-card__title">
                        <strong>${escapeHtml(entry.title)}</strong>
                        ${entry.canComplete
                            ? `<button class="primary-button" data-complete-contract="${escapeHtml(entry.id)}" type="button">Turn in</button>`
                            : `<button class="primary-button" data-accept-contract="${escapeHtml(entry.id)}" type="button">${entry.assigned ? 'Joined' : 'Accept'}</button>`}
                    </div>
                    <p>${escapeHtml(entry.summary)}</p>
                    <div class="list-card__meta">
                        <span>${escapeHtml(entry.type)}</span>
                        ${entry.id === state.focusedContractId ? '<span>focused</span>' : ''}
                        <span>${escapeHtml(entry.status)}</span>
                    </div>
                </article>
            `).join('') : `<div class="empty-state">${activeTab === 'events' ? 'No active event contracts.' : 'No active contracts yet.'}</div>`}
        </section>
    `;
}

function renderFaction() {
    const faction = getSnapshot().faction || {};
    const materials = faction.materials || [];
    const projects = faction.projects || [];
    const inventory = getSnapshot().ops?.inventory || [];
    const depositable = inventory.filter((entry) => entry.type === 'material' && entry.amount > 0).slice(0, 6);

    return `
        <section class="panel">
            <div>
                <h2>Faction</h2>
                <p class="subtle">Shared pressure, hub progress, and current needs.</p>
                <div class="tag">Focused: ${escapeHtml(state.tabs.faction || 'overview')}</div>
            </div>
            <div class="summary-grid">
                <div class="metric">
                    <div class="metric__label">Faction</div>
                    <div class="metric__value">${escapeHtml(faction.definition?.label || 'Unassigned')}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Objective</div>
                    <div class="metric__value">${escapeHtml(faction.objective?.label || 'None')}</div>
                </div>
            </div>
            ${faction.event?.id ? `
                <div class="list-card">
                    <div class="list-card__title">
                        <strong>${escapeHtml(faction.event.label)}</strong>
                        <span class="tag">${escapeHtml(faction.event.favoredSkill)}</span>
                    </div>
                    <p>${escapeHtml(faction.event.summary || '')}</p>
                </div>
            ` : ''}
            <div class="list-grid">
                ${materials.length ? materials.map((entry) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(entry.id)}</strong>
                            <span class="tag">${entry.amount}</span>
                        </div>
                        <p class="subtle">Shared faction material pool.</p>
                    </article>
                `).join('') : '<div class="empty-state">No shared materials deposited yet.</div>'}
            </div>
            <div class="list-grid">
                ${depositable.length ? depositable.map((entry) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(entry.id)}</strong>
                            <button class="primary-button" data-deposit-material="${escapeHtml(entry.id)}" type="button">Deposit 1</button>
                        </div>
                        <p class="subtle">Carry: ${entry.amount}</p>
                    </article>
                `).join('') : '<div class="empty-state">No carried materials ready to deposit.</div>'}
            </div>
            <div class="list-grid">
                ${projects.length ? projects.map((project) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(project.label)}</strong>
                            <button class="primary-button" data-contribute-project="${escapeHtml(project.id)}" type="button">Contribute</button>
                        </div>
                        <p>${escapeHtml(project.unlock)}</p>
                        <div class="list-card__meta">
                            <span>${escapeHtml(project.skill)}</span>
                            <span>${escapeHtml(project.status)} · ${project.current}</span>
                        </div>
                    </article>
                `).join('') : '<div class="empty-state">No hub projects available.</div>'}
            </div>
        </section>
    `;
}

function attachContractEvents() {
    screenEl.querySelectorAll('[data-contract-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            state.tabs.contracts = button.dataset.contractTab;
            state.focusedContractId = null;

            if (button.dataset.contractTab !== 'events') {
                state.lastCompletedContract = null;
            }

            render();
        });
    });

    const contractForm = document.getElementById('contractForm');
    const contractTypeSelect = document.getElementById('contractTypeSelect');
    const contractTitleInput = document.getElementById('contractTitleInput');
    const contractSummaryInput = document.getElementById('contractSummaryInput');

    if (contractForm && contractTypeSelect && contractTitleInput && contractSummaryInput) {
        contractForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const typeId = contractTypeSelect.value;
            const title = contractTitleInput.value.trim();
            const summary = contractSummaryInput.value.trim();

            if (!title || !summary) {
                return;
            }

            await postNui('createContract', {
                typeId,
                title,
                summary
            });

            contractTitleInput.value = '';
            contractSummaryInput.value = '';
        });
    }

    screenEl.querySelectorAll('[data-accept-contract]').forEach((button) => {
        if (button.textContent === 'Joined') {
            return;
        }

        button.addEventListener('click', async () => {
            await postNui('acceptContract', {
                contractId: button.dataset.acceptContract
            });
        });
    });

    screenEl.querySelectorAll('[data-complete-contract]').forEach((button) => {
        button.addEventListener('click', async () => {
            const card = button.closest('.list-card');
            const title = card?.querySelector('strong')?.textContent || 'Event contract';

            await postNui('completeContract', {
                contractId: button.dataset.completeContract
            });

            state.lastCompletedContract = {
                id: button.dataset.completeContract,
                title,
                body: 'Turn-in recorded. Rewards and faction progress were applied.'
            };
            state.focusedContractId = null;
            state.tabs.contracts = 'events';
            render();
        });
    });
}

function attachFactionEvents() {
    screenEl.querySelectorAll('[data-deposit-material]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('depositFactionMaterials', {
                itemId: button.dataset.depositMaterial,
                amount: 1
            });
        });
    });

    screenEl.querySelectorAll('[data-contribute-project]').forEach((button) => {
        button.addEventListener('click', async () => {
            await postNui('contributeHubProject', {
                projectId: button.dataset.contributeProject
            });
        });
    });
}

function renderProfile() {
    const profile = getSnapshot().profile || {};
    const ownedTitles = profile.ownedTitles || [];
    const badges = Object.keys(profile.badges || {});
    const notifications = getSnapshot().notifications || { unread: 0, items: [] };
    const activeTab = state.tabs.profile || 'summary';

    return `
        <section class="panel">
            <div>
                <h2>Profile</h2>
                <p class="subtle">Identity, progression, and notification preferences.</p>
                <div class="tab-row">
                    <button class="channel-tab ${activeTab === 'summary' ? 'is-active' : ''}" data-profile-tab="summary" type="button">Summary</button>
                    <button class="channel-tab ${activeTab === 'notifications' ? 'is-active' : ''}" data-profile-tab="notifications" type="button">Notices ${notifications.unread ? `(${notifications.unread})` : ''}</button>
                </div>
            </div>
            ${activeTab === 'summary' ? `
            <div class="profile-grid">
                <div class="metric">
                    <div class="metric__label">Handle</div>
                    <div class="metric__value">${escapeHtml(profile.handle || 'Unknown')}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Title</div>
                    <div class="metric__value">${escapeHtml(profile.title?.label || 'Relay Initiate')}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Faction</div>
                    <div class="metric__value">${escapeHtml(profile.faction?.label || 'Unassigned')}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Level</div>
                    <div class="metric__value">${profile.level ?? 1}</div>
                </div>
            </div>
            <div class="list-grid">
                ${ownedTitles.map((title) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(title.label)}</strong>
                            <button class="primary-button" data-set-title="${escapeHtml(title.id)}" type="button">${profile.title?.id === title.id ? 'Active' : 'Equip'}</button>
                        </div>
                        <p class="subtle">${escapeHtml(title.rarity || 'common')}</p>
                    </article>
                `).join('')}
            </div>
            <div class="list-grid">
                ${badges.length ? badges.map((badgeId) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(badgeId)}</strong>
                            <span class="tag">Badge</span>
                        </div>
                    </article>
                `).join('') : '<div class="empty-state">No badges unlocked yet.</div>'}
            </div>
            ` : `
            <div class="summary-grid">
                <div class="metric">
                    <div class="metric__label">Unread</div>
                    <div class="metric__value">${notifications.unread}</div>
                </div>
                <div class="metric">
                    <div class="metric__label">Recent</div>
                    <div class="metric__value">${notifications.items.length}</div>
                </div>
            </div>
            <div class="list-grid">
                ${notifications.items.length ? notifications.items.map((entry) => `
                    <article class="list-card">
                        <div class="list-card__title">
                            <strong>${escapeHtml(entry.title)}</strong>
                            <button class="primary-button" data-open-notification="${escapeHtml(String(entry.id))}" data-notification-screen="${escapeHtml(entry.deeplink?.screen || '')}" data-notification-tab="${escapeHtml(entry.deeplink?.tab || '')}" data-notification-channel="${escapeHtml(entry.deeplink?.channel || '')}" data-notification-contract="${escapeHtml(entry.deeplink?.contractId || '')}" type="button">Open</button>
                        </div>
                        <p>${escapeHtml(entry.body)}</p>
                        <div class="list-card__meta">
                            <span>${escapeHtml(entry.priority)}</span>
                            <span>${escapeHtml(entry.state)}</span>
                        </div>
                    </article>
                `).join('') : '<div class="empty-state">No relay notices yet.</div>'}
            </div>
            `}
        </section>
    `;
}

function attachProfileEvents() {
    screenEl.querySelectorAll('[data-profile-tab]').forEach((button) => {
        button.addEventListener('click', () => {
            state.tabs.profile = button.dataset.profileTab;
            render();
        });
    });

    screenEl.querySelectorAll('[data-set-title]').forEach((button) => {
        if (button.textContent === 'Active') {
            return;
        }

        button.addEventListener('click', async () => {
            await postNui('setActiveTitle', {
                titleId: button.dataset.setTitle
            });
        });
    });

    screenEl.querySelectorAll('[data-open-notification]').forEach((button) => {
        button.addEventListener('click', async () => {
            const notificationId = Number(button.dataset.openNotification);
            const screen = button.dataset.notificationScreen;
            const tab = button.dataset.notificationTab;
            const channel = button.dataset.notificationChannel;

            await postNui('markNotificationRead', {
                notificationId
            });

            applyDeeplink({
                screen,
                tab,
                channel,
                contractId: button.dataset.notificationContract
            });

            render();
        });
    });
}

function attachTerminalEvents() {
    screenEl.querySelectorAll('[data-channel]').forEach((button) => {
        button.addEventListener('click', () => {
            state.channel = button.dataset.channel;
            render();
        });
    });

    const composeForm = document.getElementById('composeForm');
    const composeInput = document.getElementById('composeInput');

    if (composeForm && composeInput) {
        composeForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const text = composeInput.value.trim();
            if (!text) {
                return;
            }

            await postNui('sendChatMessage', {
                channel: state.channel,
                text
            });

            composeInput.value = '';
        });
    }
}

function render() {
    renderNav();
    renderQuickActions();

    if (state.screen === 'terminal') {
        screenEl.innerHTML = renderTerminal();
        attachTerminalEvents();
        return;
    }

    if (state.screen === 'ops') {
        screenEl.innerHTML = renderOps();
        attachOpsEvents();
        return;
    }

    if (state.screen === 'contracts') {
        screenEl.innerHTML = renderContracts();
        attachContractEvents();
        return;
    }

    if (state.screen === 'faction') {
        screenEl.innerHTML = renderFaction();
        attachFactionEvents();
        return;
    }

    screenEl.innerHTML = renderProfile();
    attachProfileEvents();
}

function applyBootstrap(payload) {
    const snapshot = payload?.snapshot || payload;

    if (payload?.ok === false) {
        scheduleBootstrapRetry();
        return;
    }

    if (!snapshot || !snapshot.app) {
        scheduleBootstrapRetry();
        return;
    }

    const currentScreen = state.screen;
    const currentTabs = { ...state.tabs };
    const currentChannel = state.channel;
    const currentFocusedContractId = state.focusedContractId;
    const currentLastCompletedContract = state.lastCompletedContract;

    state.snapshot = snapshot;
    state.screen = currentScreen || snapshot.app?.defaultRoute || 'terminal';
    state.tabs = {
        ...state.tabs,
        ...currentTabs
    };
    state.channel = currentChannel || 'PUBLIC';
    state.focusedContractId = currentFocusedContractId || null;
    state.lastCompletedContract = currentLastCompletedContract || null;
    setBooting(false);
    bootRetryCount = 0;
    render();
}

function appendChatLine(payload) {
    if (!payload?.channel || !payload?.line || !state.snapshot) {
        return;
    }

    state.snapshot.terminal = state.snapshot.terminal || { messages: {}, pinned: {} };
    state.snapshot.terminal.messages = state.snapshot.terminal.messages || {};

    const lines = state.snapshot.terminal.messages[payload.channel] || [];
    lines.push(payload.line);

    if (lines.length > 40) {
        lines.shift();
    }

    state.snapshot.terminal.messages[payload.channel] = lines;

    if (state.screen === 'terminal' && state.channel === payload.channel) {
        render();
    }
}

window.addEventListener('message', (event) => {
    const message = event.data || {};

    if (message.type === 'esro:visibility') {
        setVisible(Boolean(message.visible), Boolean(message.embedded));
        if (message.visible && !state.snapshot) {
            postNui('requestBootstrap');
        }
        return;
    }

    if (message.type === 'esro:bootstrap') {
        applyBootstrap(message.payload);
        return;
    }

    if (message.type === 'esro:snapshot') {
        applyBootstrap(message.payload);
        return;
    }

    if (message.type === 'esro:chat') {
        appendChatLine(message.payload);
        return;
    }

    if (message.type === 'esro:notification' && message.payload?.deeplink?.screen) {
        if (state.visible) {
            const deeplink = message.payload.deeplink || {};
            applyDeeplink(deeplink);

            if (message.payload.id) {
                postNui('markNotificationRead', {
                    notificationId: message.payload.id
                });
            }

            render();
        }
    }
});

window.addEventListener('resize', () => {
    if (state.embedded) {
        updateEmbeddedScale();
    }
});

window.__ESRO_REWORK_DEBUG__ = {
    getState: () => state,
    render,
    applyBootstrap,
    setBooting,
    setVisible: (visible, embedded = false) => setVisible(Boolean(visible), Boolean(embedded))
};

closeButtonEl.addEventListener('click', () => {
    postNui('closeApp');
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && state.visible) {
        postNui('closeApp');
    }
});

applyAssetUrls();
queueUiReadyAnnouncements();