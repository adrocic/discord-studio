(function () {
  'use strict';

  const STORAGE_KEY = 'guildcraft-blueprint-v1';
  const defaults = {
    currentStep: 0,
    completedSteps: [],
    foundation: {
      playbook: 'competitive',
      name: 'Friday Night Five',
      purpose: 'A focused home for our tournament roster to plan practices, prepare for weekly matches, review games, and stay competitive without losing the fun.',
      audience: 'team',
      memberScale: 'small',
      accessModel: 'private',
      activities: ['practice', 'match_day', 'review', 'availability']
    },
    categories: [
      { id: uid(), name: 'START HERE', channels: [
        { id: uid(), name: 'team-guide', type: 'text', visibility: 'everyone', topic: 'Roster, team expectations, season links, and where everything lives.' },
        { id: uid(), name: 'announcements', type: 'text', visibility: 'everyone', topic: 'Official roster, schedule, and match updates.' }
      ]},
      { id: uid(), name: 'TEAM HUB', channels: [
        { id: uid(), name: 'team-chat', type: 'text', visibility: 'members', topic: 'Everyday team conversation.' },
        { id: uid(), name: 'availability', type: 'text', visibility: 'members', topic: 'Post availability and conflicts for practices and match day.' },
        { id: uid(), name: 'schedule', type: 'text', visibility: 'members', topic: 'Weekly matches, scrims, practices, and deadlines.' }
      ]},
      { id: uid(), name: 'PREP ROOM', channels: [
        { id: uid(), name: 'scrim-planning', type: 'text', visibility: 'members', topic: 'Book scrims, confirm opponents, and record objectives.' },
        { id: uid(), name: 'champion-pools', type: 'forum', visibility: 'members', topic: 'Maintain role coverage, champion pools, and practice priorities.' },
        { id: uid(), name: 'strategy-board', type: 'forum', visibility: 'members', topic: 'Draft plans, comps, matchup notes, and team systems.' },
        { id: uid(), name: 'vod-review', type: 'forum', visibility: 'members', topic: 'One post per game with clips, takeaways, and action items.' }
      ]},
      { id: uid(), name: 'MATCH DAY', channels: [
        { id: uid(), name: 'match-lobby', type: 'text', visibility: 'members', topic: 'Day-of check-in, lobby details, and series updates.' },
        { id: uid(), name: 'team-comms', type: 'voice', visibility: 'members', topic: 'Primary match voice channel.' },
        { id: uid(), name: 'warmup-room', type: 'voice', visibility: 'members', topic: 'Warmup and between-game discussion.' }
      ]},
      { id: uid(), name: 'CAPTAINS', channels: [
        { id: uid(), name: 'captain-chat', type: 'text', visibility: 'staff', topic: 'Private roster, conflict, and league-admin discussion.' },
        { id: uid(), name: 'match-admin', type: 'text', visibility: 'staff', topic: 'Tournament code links, result issues, roster locks, and opponent coordination.' }
      ]}
    ],
    roles: [
      { id: uid(), name: 'Captain', color: '#725fe3', access: 'Administrator', description: 'Team owner and primary league contact · 1–2 people' },
      { id: uid(), name: 'Coach / Analyst', color: '#3c9c7b', access: 'Moderate content', description: 'Strategy access without server ownership' },
      { id: uid(), name: 'Starting Roster', color: '#467bb4', access: 'Standard access', description: 'Active starting five' },
      { id: uid(), name: 'Substitute', color: '#9a718f', access: 'Standard access', description: 'Rostered substitute or flex player' },
      { id: uid(), name: 'Trial / Guest', color: '#a67552', access: 'Read & introduce', description: 'Limited access for tryouts and guests' }
    ],
    botPermissions: ['manage_channels', 'manage_roles', 'view_audit_log'],
    safety: {
      welcomeScreen: true,
      rulesGate: true,
      interestOnboarding: false,
      verificationLevel: 'medium',
      mediaFilter: 'all',
      automod: true,
      modLog: true,
      rules: [
        'Compete hard without toxicity. Trash talk can be fun; harassment is not.',
        'Post availability early and flag conflicts as soon as they appear.',
        'Keep scrims, draft plans, VOD notes, and opponent prep inside the team.',
        'Review the play, not the person—leave every session with a clear next action.'
      ]
    }
  };

  const activityDefinitions = {
    competitive: [
      ['team_chat', '#', 'Team chat'], ['practice', '◎', 'Practice & scrims'], ['review', '↗', 'VOD review'],
      ['match_day', '◇', 'Match day'], ['availability', '□', 'Availability'], ['resources', '≡', 'Team resources']
    ],
    project: [
      ['chat', '#', 'Team chat'], ['planning', '□', 'Plan work'], ['decisions', '◇', 'Make decisions'],
      ['feedback', '↗', 'Review work'], ['resources', '≡', 'Share docs'], ['social', '◎', 'Team rituals']
    ],
    community: [
      ['chat', '#', 'Casual chat'], ['showcase', '◇', 'Share work'], ['feedback', '↗', 'Give feedback'],
      ['events', '□', 'Host events'], ['support', '?', 'Get support'], ['resources', '≡', 'Share resources']
    ],
    creator: [
      ['chat', '#', 'Audience chat'], ['showcase', '◇', 'Member showcase'], ['launches', '↗', 'Launch updates'],
      ['events', '□', 'Live events'], ['support', '?', 'Get support'], ['feedback', '≡', 'Collect feedback']
    ]
  };

  let state = loadState();
  let activePreviewChannel = 'team-guide';
  let toastTimer;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  function uid() { return Math.random().toString(36).slice(2, 9); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.foundation || !saved.categories) return clone(defaults);
      if (!saved.foundation.playbook) saved.foundation.playbook = saved.foundation.audience === 'creator' ? 'creator' : saved.foundation.audience === 'team' ? 'project' : 'community';
      return saved;
    } catch (_) { return clone(defaults); }
  }
  function saveState(message) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    $('#savedTime').textContent = 'A few seconds ago';
    $('#saveIndicator').innerHTML = '<span class="status-dot"></span> Saved';
    if (message) showToast(message);
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function slugify(value) {
    return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'new-channel';
  }
  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  }

  function syncFormFromState() {
    state.foundation.playbook ||= 'community';
    $('#serverName').value = state.foundation.name;
    $('#serverPurpose').value = state.foundation.purpose;
    $(`input[name="audience"][value="${state.foundation.audience}"]`).checked = true;
    $('#memberScale').value = state.foundation.memberScale;
    $('#accessModel').value = state.foundation.accessModel;
    renderActivityChoices();
    $$('#botPermissions input:not(:disabled)').forEach(input => input.checked = state.botPermissions.includes(input.value));
    Object.keys(state.safety).forEach(key => {
      const control = $('#' + key);
      if (!control) return;
      control.type === 'checkbox' ? control.checked = state.safety[key] : control.value = state.safety[key];
    });
    updateChoiceCards();
    updatePlaybookCards();
    updateFoundationText();
  }

  function renderActivityChoices() {
    const definitions = activityDefinitions[state.foundation.playbook] || activityDefinitions.community;
    const root = $('#activityChoices');
    root.innerHTML = definitions.map(([value, icon, label]) => `<label><input type="checkbox" value="${value}" ${state.foundation.activities.includes(value) ? 'checked' : ''}><span>${icon}</span> ${label}</label>`).join('');
    $$('input', root).forEach(input => input.addEventListener('change', event => {
      const selected = $$('#activityChoices input:checked');
      if (selected.length > 4) { event.target.checked = false; showToast('Choose up to four primary activities.'); return; }
      state.foundation.activities = selected.map(item => item.value);
      $('#activityMessage').textContent = '';
      saveState();
    }));
  }

  function updatePlaybookCards() {
    $$('#playbookChoices .playbook-card').forEach(card => card.classList.toggle('selected', card.dataset.playbook === state.foundation.playbook));
    $('#leagueContext').hidden = state.foundation.playbook !== 'competitive';
  }

  function updateFoundationText() {
    const name = state.foundation.name || 'Untitled server';
    const initial = name.trim().charAt(0).toUpperCase() || 'U';
    $('#nameCount').textContent = `${state.foundation.name.length} / 40`;
    $('#purposeCount').textContent = `${state.foundation.purpose.length} / 180`;
    $('#projectNameSide').textContent = name;
    $('#breadcrumbName').textContent = name;
    $('#projectAvatar').textContent = initial;
    $('#previewAvatar').textContent = initial;
    $('#railAvatar').textContent = initial;
    $('#previewNameTop').textContent = name;
    $('#welcomeDescription').textContent = `This is the start of the ${name} server.`;
    $('#sampleMessage').textContent = state.foundation.playbook === 'competitive'
      ? `Welcome to ${name}. Read the team guide, confirm your role, and post your availability for the next match.`
      : `Welcome to ${name}. Please read the community agreements, then introduce yourself!`;
  }

  function updateChoiceCards() {
    $$('#audienceChoices .choice-card').forEach(card => card.classList.toggle('selected', $('input', card).checked));
  }

  function renderCategoryEditor() {
    const root = $('#categoryEditor');
    root.innerHTML = state.categories.map((category, categoryIndex) => `
      <section class="category-card" data-category-id="${category.id}">
        <div class="category-head">
          <span class="drag-handle" aria-hidden="true">⠿</span>
          <input class="category-name" aria-label="Category name" maxlength="32" value="${escapeHtml(category.name)}" data-category-name="${category.id}">
          <button class="remove-button" type="button" aria-label="Remove ${escapeHtml(category.name)}" data-remove-category="${category.id}"><svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M9 7l1-3h4l1 3M6 7l1 14h10l1-14"/></svg></button>
        </div>
        <div class="channel-list">
          ${category.channels.map(channel => `
            <div class="channel-row" data-channel-id="${channel.id}">
              <span class="drag-handle" aria-hidden="true">⠿</span>
              <span class="channel-kind" aria-label="${channel.type}">${channel.type === 'voice' ? '◖' : channel.type === 'forum' ? '▤' : '#'}</span>
              <input type="text" aria-label="Channel name" maxlength="32" value="${escapeHtml(channel.name)}" data-channel-name="${channel.id}">
              <select class="visibility-select" aria-label="Channel visibility" data-channel-visibility="${channel.id}">
                <option value="everyone" ${channel.visibility === 'everyone' ? 'selected' : ''}>Everyone</option>
                <option value="members" ${channel.visibility === 'members' ? 'selected' : ''}>Members</option>
                <option value="staff" ${channel.visibility === 'staff' ? 'selected' : ''}>Staff only</option>
              </select>
              <button class="remove-button" type="button" aria-label="Remove ${escapeHtml(channel.name)}" data-remove-channel="${channel.id}"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
            </div>`).join('')}
        </div>
        <button class="add-channel" type="button" data-add-channel="${category.id}">+ Add channel</button>
      </section>`).join('');
    const count = state.categories.reduce((sum, category) => sum + category.channels.length, 0);
    $('#structureCount').textContent = `${state.categories.length} ${state.categories.length === 1 ? 'category' : 'categories'} · ${count} ${count === 1 ? 'channel' : 'channels'}`;
    bindCategoryEvents();
    renderPreview();
  }

  function bindCategoryEvents() {
    $$('[data-category-name]').forEach(input => input.addEventListener('input', event => {
      const category = state.categories.find(item => item.id === event.target.dataset.categoryName);
      category.name = event.target.value;
      saveState(); renderPreview();
    }));
    $$('[data-channel-name]').forEach(input => input.addEventListener('change', event => {
      const located = findChannel(event.target.dataset.channelName);
      if (!located) return;
      located.channel.name = slugify(event.target.value);
      event.target.value = located.channel.name;
      saveState(); renderPreview();
    }));
    $$('[data-channel-visibility]').forEach(select => select.addEventListener('change', event => {
      const located = findChannel(event.target.dataset.channelVisibility);
      if (!located) return;
      located.channel.visibility = event.target.value;
      saveState(); renderPreview();
    }));
    $$('[data-remove-category]').forEach(button => button.addEventListener('click', () => {
      if (state.categories.length <= 1) return showToast('Keep at least one category.');
      state.categories = state.categories.filter(item => item.id !== button.dataset.removeCategory);
      saveState('Category removed'); renderCategoryEditor(); renderReview();
    }));
    $$('[data-remove-channel]').forEach(button => button.addEventListener('click', () => {
      const located = findChannel(button.dataset.removeChannel);
      if (!located || located.category.channels.length <= 1) return showToast('Keep at least one channel in this category.');
      located.category.channels = located.category.channels.filter(item => item.id !== button.dataset.removeChannel);
      saveState('Channel removed'); renderCategoryEditor(); renderReview();
    }));
    $$('[data-add-channel]').forEach(button => button.addEventListener('click', () => {
      const category = state.categories.find(item => item.id === button.dataset.addChannel);
      category.channels.push({ id: uid(), name: 'new-channel', type: 'text', visibility: category.name.includes('TEAM') ? 'staff' : 'members', topic: 'A new conversation space.' });
      saveState('Channel added'); renderCategoryEditor();
      setTimeout(() => $$(`[data-category-id="${category.id}"] [data-channel-name]`).at(-1)?.focus(), 0);
    }));
  }

  function findChannel(id) {
    for (const category of state.categories) {
      const channel = category.channels.find(item => item.id === id);
      if (channel) return { category, channel };
    }
    return null;
  }

  function renderPreview() {
    const root = $('#channelPreview');
    const allChannels = state.categories.flatMap(category => category.channels);
    const active = allChannels.find(channel => channel.name === activePreviewChannel) || allChannels[0];
    if (active) {
      activePreviewChannel = active.name;
      $('#activeChannelName').textContent = active.name;
      $('#messageChannel').textContent = active.name;
      $('#welcomeChannelTitle').textContent = `Welcome to #${active.name}!`;
      $('#activeChannelTopic').textContent = active.topic || 'A space for the community.';
    }
    root.innerHTML = state.categories.map(category => `
      <div class="preview-category">
        <div class="preview-category-title">${escapeHtml(category.name || 'Untitled')}</div>
        ${category.channels.map(channel => `<button class="preview-channel ${channel.name === activePreviewChannel ? 'active' : ''}" type="button" data-preview-channel="${channel.id}"><b>${channel.type === 'voice' ? '◖' : channel.type === 'forum' ? '▤' : '#'}</b><span>${escapeHtml(channel.name)}</span>${channel.visibility === 'staff' ? '<em>⌁</em>' : ''}</button>`).join('')}
      </div>`).join('');
    $$('[data-preview-channel]', root).forEach(button => button.addEventListener('click', () => {
      const located = findChannel(button.dataset.previewChannel);
      if (!located) return;
      activePreviewChannel = located.channel.name;
      $('#activeChannelName').textContent = located.channel.name;
      $('#messageChannel').textContent = located.channel.name;
      $('#welcomeChannelTitle').textContent = `Welcome to #${located.channel.name}!`;
      $('#activeChannelTopic').textContent = located.channel.topic || 'A space for the community.';
      renderPreview();
    }));
  }

  function renderRoles() {
    $('#roleEditor').innerHTML = state.roles.map((role, index) => `
      <div class="role-card" data-role-id="${role.id}">
        <span class="role-color" style="--role-color:${role.color}">${escapeHtml(role.name.charAt(0).toUpperCase())}</span>
        <div class="role-details"><strong>${escapeHtml(role.name)}</strong><small>${escapeHtml(role.description)}</small></div>
        <div class="role-controls">
          <select aria-label="Permission preset for ${escapeHtml(role.name)}" data-role-access="${role.id}">
            ${['Administrator','Moderate content','Standard access','Read & introduce','Read only'].map(value => `<option ${value === role.access ? 'selected' : ''}>${value}</option>`).join('')}
          </select>
          ${index > 3 ? `<button class="remove-button" type="button" aria-label="Remove ${escapeHtml(role.name)}" data-remove-role="${role.id}"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>` : ''}
        </div>
      </div>`).join('');
    $$('[data-role-access]').forEach(select => select.addEventListener('change', () => {
      state.roles.find(role => role.id === select.dataset.roleAccess).access = select.value;
      saveState(); renderReview();
    }));
    $$('[data-remove-role]').forEach(button => button.addEventListener('click', () => {
      state.roles = state.roles.filter(role => role.id !== button.dataset.removeRole);
      saveState('Role removed'); renderRoles(); renderReview();
    }));
  }

  function renderRules() {
    $('#rulesEditor').innerHTML = state.safety.rules.map((rule, index) => `
      <div class="rule-row">
        <input type="text" value="${escapeHtml(rule)}" maxlength="140" aria-label="Community agreement ${index + 1}" data-rule-index="${index}">
        <button class="remove-button" type="button" aria-label="Remove agreement ${index + 1}" data-remove-rule="${index}"><svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
      </div>`).join('');
    $$('[data-rule-index]').forEach(input => input.addEventListener('input', () => {
      state.safety.rules[Number(input.dataset.ruleIndex)] = input.value;
      saveState(); renderReview();
    }));
    $$('[data-remove-rule]').forEach(button => button.addEventListener('click', () => {
      if (state.safety.rules.length <= 1) return showToast('Keep at least one community agreement.');
      state.safety.rules.splice(Number(button.dataset.removeRule), 1);
      saveState('Agreement removed'); renderRules(); renderReview();
    }));
  }

  function calculatePermissionInteger() {
    return $$('#botPermissions input:checked').reduce((sum, input) => sum + Number(input.dataset.bit || 0), 0);
  }

  function readiness() {
    const channelCount = state.categories.reduce((sum, category) => sum + category.channels.length, 0);
    const publicChannelCount = state.categories.reduce((sum, category) => sum + category.channels.filter(channel => channel.visibility !== 'staff').length, 0);
    const checks = [
      { label: 'Purpose is specific', detail: 'Members can tell why this server exists.', pass: state.foundation.purpose.trim().length >= 30 },
      { label: 'Structure stays focused', detail: `${publicChannelCount} public channels keeps the first visit approachable.`, pass: publicChannelCount <= 15 },
      { label: 'Staff space is private', detail: 'A private channel preserves moderator context.', pass: state.categories.some(category => category.channels.some(channel => channel.visibility === 'staff')) },
      { label: 'Newcomer path exists', detail: 'Welcome and rules are part of the arrival flow.', pass: state.safety.welcomeScreen && state.safety.rulesGate },
      { label: 'Safety defaults are active', detail: 'Verification, media filtering, and AutoMod are configured.', pass: state.safety.verificationLevel !== 'low' && state.safety.mediaFilter !== 'none' && state.safety.automod },
      { label: 'Builder avoids Administrator', detail: 'Deployment uses scoped permissions only.', pass: true }
    ];
    const score = Math.max(40, Math.round(checks.reduce((sum, check) => sum + (check.pass ? 100 / checks.length : 4), 0)));
    return { checks, score, channelCount, publicChannelCount };
  }

  function renderReview() {
    const info = readiness();
    const name = state.foundation.name || 'Untitled server';
    $('#scoreRing').style.setProperty('--score', info.score);
    $('#scoreValue').textContent = info.score;
    $('#scoreBadge').textContent = info.score >= 85 ? 'Launch ready' : info.score >= 70 ? 'Nearly ready' : 'Needs attention';
    $('#reviewServerName').textContent = name;
    $('#reviewPurpose').textContent = state.foundation.purpose || 'Add a clear purpose before handoff.';
    $('#summaryHealth').textContent = `${info.checks.filter(check => check.pass).length} checks passed`;
    $('#summaryList').innerHTML = [
      ['Audience', titleCase(state.foundation.audience)],
      ['Structure', `${state.categories.length} categories · ${info.channelCount} channels`],
      ['Roles', `${state.roles.length} access layers`],
      ['Join model', titleCase(state.foundation.accessModel)],
      ['Community agreements', String(state.safety.rules.filter(Boolean).length)],
      ['Bot permission integer', String(calculatePermissionInteger())]
    ].map(([label, value]) => `<div class="summary-row"><span>${label}</span><strong>${escapeHtml(value)}</strong></div>`).join('');
    $('#checkList').innerHTML = info.checks.map(check => `<div class="check-row"><span class="check-mark ${check.pass ? '' : 'warn'}">${check.pass ? '✓' : '!'}</span><span><strong>${escapeHtml(check.label)}</strong><small>${escapeHtml(check.detail)}</small></span></div>`).join('');
  }

  function titleCase(value) { return value.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); }

  function channel(name, type = 'text', visibility = 'members', topic = 'A focused conversation space.') {
    return { id: uid(), name, type, visibility, topic };
  }

  function applyPlaybook(playbook) {
    const presets = {
      competitive: {
        name: 'Friday Night Five',
        purpose: 'A focused home for our tournament roster to plan practices, prepare for weekly matches, review games, and stay competitive without losing the fun.',
        audience: 'team', memberScale: 'small', accessModel: 'private',
        activities: ['practice', 'match_day', 'review', 'availability'],
        roles: [
          ['Captain', '#725fe3', 'Administrator', 'Team owner and primary league contact · 1–2 people'],
          ['Coach / Analyst', '#3c9c7b', 'Moderate content', 'Strategy access without server ownership'],
          ['Starting Roster', '#467bb4', 'Standard access', 'Active starting five'],
          ['Substitute', '#9a718f', 'Standard access', 'Rostered substitute or flex player'],
          ['Trial / Guest', '#a67552', 'Read & introduce', 'Limited access for tryouts and guests']
        ],
        rules: [
          'Compete hard without toxicity. Trash talk can be fun; harassment is not.',
          'Post availability early and flag conflicts as soon as they appear.',
          'Keep scrims, draft plans, VOD notes, and opponent prep inside the team.',
          'Review the play, not the person—leave every session with a clear next action.'
        ]
      },
      project: {
        name: 'Northstar Team', purpose: 'A focused workspace where our team can make decisions, coordinate work, share context, and keep progress visible.',
        audience: 'team', memberScale: 'small', accessModel: 'private', activities: ['chat', 'planning', 'decisions', 'feedback'],
        roles: [['Owner', '#725fe3', 'Administrator', 'Workspace owner · 1–2 people'], ['Lead', '#3c9c7b', 'Moderate content', 'Team leads and facilitators'], ['Contributor', '#467bb4', 'Standard access', 'Core team members'], ['Guest', '#9a718f', 'Read & introduce', 'Time-bound collaborator access']],
        rules: ['Put decisions where the whole team can find them.', 'Be clear about owners, dates, and the next action.', 'Challenge ideas with respect and assume positive intent.', 'Keep confidential work inside the team.']
      },
      community: {
        name: 'Haven House', purpose: 'A welcoming community where members can connect, share what they are working on, exchange thoughtful feedback, and learn together.',
        audience: 'community', memberScale: 'medium', accessModel: 'approval', activities: ['chat', 'showcase', 'feedback'],
        roles: [['Admin', '#725fe3', 'Administrator', 'Server owners only · 1–2 people'], ['Moderator', '#3c9c7b', 'Moderate content', 'Trusted safety team · no Administrator'], ['Member', '#467bb4', 'Standard access', 'Verified community members'], ['Newcomer', '#9a718f', 'Read & introduce', 'Limited access before verification']],
        rules: ['Treat people with respect; critique the work, never the person.', 'Share thoughtfully—no spam, unsolicited promotion, or repeated pings.', 'Keep feedback specific, constructive, and welcome.', 'Protect privacy. Do not repost private conversations or personal details.']
      },
      creator: {
        name: 'Studio Circle', purpose: 'A home base where our audience can follow new releases, join events, share their work, and build real connections around the creator.',
        audience: 'creator', memberScale: 'medium', accessModel: 'open', activities: ['chat', 'showcase', 'launches', 'events'],
        roles: [['Creator', '#725fe3', 'Administrator', 'Channel owner'], ['Community Team', '#3c9c7b', 'Moderate content', 'Moderators and event hosts'], ['Supporter', '#d08a3e', 'Standard access', 'Recognized supporters'], ['Member', '#467bb4', 'Standard access', 'Community members'], ['Newcomer', '#9a718f', 'Read & introduce', 'Newly joined members']],
        rules: ['Treat the creator, team, and other members with respect.', 'Keep self-promotion in the spaces created for it.', 'Do not share paywalled, leaked, or private material.', 'Use content notes and the correct channels for sensitive topics.']
      }
    };
    const preset = presets[playbook];
    if (!preset) return;
    state.foundation = { playbook, name: preset.name, purpose: preset.purpose, audience: preset.audience, memberScale: preset.memberScale, accessModel: preset.accessModel, activities: preset.activities };
    state.roles = preset.roles.map(([name, color, access, description]) => ({ id: uid(), name, color, access, description }));
    state.safety.rules = preset.rules;
    state.safety.interestOnboarding = playbook !== 'competitive' && playbook !== 'project';
    generateStructure(false);
    syncFormFromState(); renderRoles(); renderRules(); renderReview();
    saveState(`${titleCase(playbook)} playbook applied`);
  }

  function generateStructure(notify = true) {
    const activities = state.foundation.activities;
    const playbook = state.foundation.playbook || 'community';
    if (playbook === 'competitive') {
      const hub = [];
      if (activities.includes('team_chat')) hub.push(channel('team-chat', 'text', 'members', 'Everyday team conversation.'));
      if (activities.includes('availability')) hub.push(channel('availability', 'text', 'members', 'Post availability and conflicts for practices and match day.'));
      hub.push(channel('schedule', 'text', 'members', 'Weekly matches, scrims, practices, and league deadlines.'));
      const prep = [channel('strategy-board', 'forum', 'members', 'Draft plans, comps, matchup notes, and team systems.')];
      if (activities.includes('practice')) prep.unshift(channel('scrim-planning', 'text', 'members', 'Book scrims, confirm opponents, and record objectives.'));
      prep.push(channel('champion-pools', 'forum', 'members', 'Maintain role coverage, champion pools, and practice priorities.'));
      if (activities.includes('review')) prep.push(channel('vod-review', 'forum', 'members', 'One post per game with clips, takeaways, and action items.'));
      state.categories = [
        { id: uid(), name: 'START HERE', channels: [channel('team-guide', 'text', 'everyone', 'Roster, expectations, season links, and where everything lives.'), channel('announcements', 'text', 'everyone', 'Official roster, schedule, and match updates.')] },
        { id: uid(), name: 'TEAM HUB', channels: hub.length ? hub : [channel('team-chat')] },
        { id: uid(), name: 'PREP ROOM', channels: prep },
        ...(activities.includes('match_day') ? [{ id: uid(), name: 'MATCH DAY', channels: [channel('match-lobby', 'text', 'members', 'Day-of check-in, lobby details, and series updates.'), channel('team-comms', 'voice', 'members', 'Primary match voice channel.'), channel('warmup-room', 'voice', 'members', 'Warmup and between-game discussion.')] }] : []),
        { id: uid(), name: 'CAPTAINS', channels: [channel('captain-chat', 'text', 'staff', 'Private roster, conflict, and league-admin discussion.'), channel('match-admin', 'text', 'staff', 'Tournament code links, result issues, roster locks, and opponent coordination.')] }
      ];
    } else {
      const isProject = playbook === 'project';
      const isCreator = playbook === 'creator';
      const community = [channel(isProject ? 'team-chat' : 'general', 'text', 'members', 'Everyday conversation.'), channel(isProject ? 'weekly-plan' : 'introductions', 'text', 'members', isProject ? 'Priorities, owners, and dates for the current week.' : 'Say hello and share what brought you here.')];
      const focused = [];
      if (activities.includes('showcase')) focused.push(channel('showcase', 'forum', 'members', 'Share completed and in-progress work.'));
      if (activities.includes('feedback')) focused.push(channel(isProject ? 'reviews' : 'feedback-lab', 'forum', 'members', 'Ask for specific, actionable feedback.'));
      if (activities.includes('events')) focused.push(channel('events', 'text', 'members', 'Upcoming gatherings and event chat.'));
      if (activities.includes('support')) focused.push(channel('help-desk', 'forum', 'members', 'Ask questions and mark helpful answers.'));
      if (activities.includes('resources')) focused.push(channel(isProject ? 'docs-and-links' : 'resource-library', 'forum', 'members', 'Curated resources and useful links.'));
      if (activities.includes('decisions')) focused.push(channel('decision-log', 'forum', 'members', 'Durable decisions with context and owners.'));
      if (activities.includes('launches')) focused.push(channel('new-releases', 'text', 'members', 'Launch news and release conversation.'));
      if (activities.includes('chat')) community.push(channel('lounge', 'voice', 'members', 'Drop-in voice chat.'));
      state.categories = [
        { id: uid(), name: 'START HERE', channels: [channel('welcome', 'text', 'everyone', 'Start here and meet the community.'), channel(isProject ? 'team-handbook' : 'community-guide', 'text', 'everyone', 'Purpose, agreements, and where to go next.'), channel('announcements', 'text', 'everyone', 'Important updates.')] },
        { id: uid(), name: isProject ? 'WORKSPACE' : isCreator ? 'AUDIENCE LOUNGE' : 'COMMUNITY', channels: community },
        ...(focused.length ? [{ id: uid(), name: isProject ? 'DELIVERY' : isCreator ? 'CREATOR HUB' : 'FOCUS SPACES', channels: focused }] : []),
        { id: uid(), name: 'TEAM ROOM', channels: [channel(isProject ? 'admin-notes' : 'mod-log', 'text', 'staff', 'Private staff record and coordination.')] }
      ];
    }
    if (notify) saveState('Structure regenerated from your foundation');
    renderCategoryEditor(); renderReview();
  }

  function buildManifest() {
    const info = readiness();
    return {
      schemaVersion: '1.0',
      generatedBy: 'Guildcraft',
      generatedAt: new Date().toISOString(),
      server: {
        playbook: state.foundation.playbook,
        name: state.foundation.name,
        purpose: state.foundation.purpose,
        audience: state.foundation.audience,
        expectedMemberScale: state.foundation.memberScale,
        accessModel: state.foundation.accessModel,
        primaryActivities: state.foundation.activities
      },
      categories: state.categories.map((category, position) => ({
        name: category.name,
        position,
        channels: category.channels.map((channel, channelPosition) => ({ name: channel.name, type: channel.type, position: channelPosition, visibility: channel.visibility, topic: channel.topic }))
      })),
      roles: state.roles.map((role, hierarchy) => ({ name: role.name, color: role.color, accessPreset: role.access, hierarchy, note: role.description })),
      safety: state.safety,
      deployment: {
        oauthScopes: ['bot', 'applications.commands'],
        botPermissions: state.botPermissions,
        permissionInteger: calculatePermissionInteger(),
        explicitlyDenied: ['administrator'],
        operatorChecklist: [
          'Create a dedicated builder bot in the Discord Developer Portal.',
          'Install it with the generated permission integer; never grant Administrator.',
          'Place the bot role above only the roles it needs to create or edit.',
          'Apply the blueprint using a trusted server-side deployer; never expose the token in a browser.',
          'Review the audit log and remove the bot after deployment unless ongoing sync is required.'
        ]
      },
      readiness: { score: info.score, checks: info.checks }
    };
  }

  function downloadManifest() {
    const json = JSON.stringify(buildManifest(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${slugify(state.foundation.name)}-discord-blueprint.json`;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    URL.revokeObjectURL(url);
    showToast('Blueprint downloaded');
  }

  async function copyManifest() {
    const json = JSON.stringify(buildManifest(), null, 2);
    try { await navigator.clipboard.writeText(json); showToast('Blueprint JSON copied'); }
    catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = json; document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
      showToast('Blueprint JSON copied');
    }
  }

  function validateFoundation() {
    const activities = state.foundation.activities;
    $('#activityMessage').textContent = '';
    if (!state.foundation.name.trim()) { $('#serverName').focus(); showToast('Give the server a name to continue.'); return false; }
    if (state.foundation.purpose.trim().length < 20) { $('#serverPurpose').focus(); showToast('Add a little more detail about the purpose.'); return false; }
    if (!activities.length) { $('#activityMessage').textContent = 'Choose at least one primary activity.'; return false; }
    return true;
  }

  function goToStep(index) {
    const target = Math.max(0, Math.min(4, index));
    if (target > 0 && !validateFoundation()) return;
    if (target > state.currentStep) state.completedSteps = Array.from(new Set([...state.completedSteps, state.currentStep]));
    state.currentStep = target;
    saveState();
    $$('.page').forEach((page, i) => page.classList.toggle('active', i === target));
    $$('.step').forEach((step, i) => { step.classList.toggle('active', i === target); step.classList.toggle('complete', state.completedSteps.includes(i) || i < target); });
    $('#backButton').disabled = target === 0;
    $('#stepCounter').textContent = `Step ${target + 1} of 5`;
    $('#mobileStepLabel').textContent = `Step ${target + 1} of 5`;
    $('#mobileProgress').style.width = `${(target + 1) * 20}%`;
    const labels = ['Shape the structure', 'Set roles & access', 'Configure safety', 'Review the blueprint', 'Download blueprint'];
    $('#nextButton').innerHTML = target === 4 ? `<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg> ${labels[target]}` : `${labels[target]} <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>`;
    if (target === 4) renderReview();
    document.querySelector('.main-area').scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('.sidebar').classList.remove('open');
  }

  function bindEvents() {
    $$('#playbookChoices [data-playbook]').forEach(button => button.addEventListener('click', () => applyPlaybook(button.dataset.playbook)));
    $('#serverName').addEventListener('input', event => { state.foundation.name = event.target.value; updateFoundationText(); saveState(); renderReview(); });
    $('#serverPurpose').addEventListener('input', event => { state.foundation.purpose = event.target.value; updateFoundationText(); saveState(); renderReview(); });
    $$('input[name="audience"]').forEach(input => input.addEventListener('change', event => { state.foundation.audience = event.target.value; updateChoiceCards(); saveState(); }));
    $('#memberScale').addEventListener('change', event => { state.foundation.memberScale = event.target.value; saveState(); });
    $('#accessModel').addEventListener('change', event => { state.foundation.accessModel = event.target.value; saveState(); renderReview(); });
    $('#tightenPurpose').addEventListener('click', () => {
      const audience = state.foundation.audience === 'team' ? 'team' : state.foundation.audience === 'creator' ? 'creator community' : 'community';
      const activityNames = state.foundation.activities.map(item => ({team_chat:'stay connected',practice:'plan focused practice',review:'review performance',match_day:'coordinate match day',availability:'share availability',chat:'connect',planning:'plan work',decisions:'document decisions',showcase:'share work',launches:'follow launches',feedback:'exchange thoughtful feedback',events:'join events',support:'get help',resources:'share useful resources',social:'build team trust'}[item])).filter(Boolean);
      state.foundation.purpose = `A welcoming ${audience} where members can ${activityNames.slice(0, -1).join(', ')}${activityNames.length > 1 ? ' and ' : ''}${activityNames.at(-1) || 'connect around a shared purpose'}.`;
      $('#serverPurpose').value = state.foundation.purpose; updateFoundationText(); saveState('Purpose refined with your selections'); renderReview();
    });
    $('#regenerateStructure').addEventListener('click', generateStructure);
    $('#addCategoryButton').addEventListener('click', () => {
      const category = { id: uid(), name: 'NEW CATEGORY', channels: [{ id: uid(), name: 'new-channel', type: 'text', visibility: 'members', topic: 'A new conversation space.' }] };
      state.categories.splice(Math.max(0, state.categories.length - 1), 0, category);
      saveState('Category added'); renderCategoryEditor();
      setTimeout(() => $(`[data-category-name="${category.id}"]`)?.focus(), 0);
    });
    $('#addRoleButton').addEventListener('click', () => {
      const role = { id: uid(), name: `Custom role ${state.roles.length - 3}`, color: '#b3734f', access: 'Read only', description: 'Optional, purpose-specific access' };
      state.roles.push(role); saveState('Custom role added'); renderRoles(); renderReview();
    });
    $$('#botPermissions input:not(:disabled)').forEach(input => input.addEventListener('change', () => {
      state.botPermissions = $$('#botPermissions input:checked').map(item => item.value);
      $('#permissionNumber').textContent = calculatePermissionInteger(); saveState(); renderReview();
    }));
    ['welcomeScreen','rulesGate','interestOnboarding','verificationLevel','mediaFilter','automod','modLog'].forEach(key => {
      $('#' + key).addEventListener('change', event => { state.safety[key] = event.target.type === 'checkbox' ? event.target.checked : event.target.value; saveState(); renderReview(); });
    });
    $('#addRuleButton').addEventListener('click', () => { state.safety.rules.push('Add a clear, memorable agreement.'); saveState('Agreement added'); renderRules(); renderReview(); setTimeout(() => $$('[data-rule-index]').at(-1)?.select(), 0); });
    $$('.step').forEach(step => step.addEventListener('click', () => goToStep(Number(step.dataset.step))));
    $('#backButton').addEventListener('click', () => goToStep(state.currentStep - 1));
    $('#nextButton').addEventListener('click', () => state.currentStep === 4 ? downloadManifest() : goToStep(state.currentStep + 1));
    $('#downloadManifest').addEventListener('click', downloadManifest);
    $('#copyManifest').addEventListener('click', copyManifest);
    $('#previewToggle').addEventListener('click', () => $('#previewPanel').classList.toggle('open'));
    $('#closePreview').addEventListener('click', () => $('#previewPanel').classList.remove('open'));
    $('#mobileMenuButton').addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    $('#startOverButton').addEventListener('click', () => { $('#confirmModal').hidden = false; $('#cancelReset').focus(); });
    $('#cancelReset').addEventListener('click', () => { $('#confirmModal').hidden = true; });
    $('#confirmReset').addEventListener('click', () => { localStorage.removeItem(STORAGE_KEY); state = clone(defaults); $('#confirmModal').hidden = true; initialize(); showToast('Starter blueprint restored'); });
    $('#confirmModal').addEventListener('click', event => { if (event.target === $('#confirmModal')) $('#confirmModal').hidden = true; });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('#confirmModal').hidden = true; $('.sidebar').classList.remove('open'); $('#previewPanel').classList.remove('open'); } });
  }

  function initialize() {
    syncFormFromState();
    renderCategoryEditor();
    renderRoles();
    renderRules();
    $('#permissionNumber').textContent = calculatePermissionInteger();
    renderReview();
    goToStep(state.currentStep || 0);
  }

  bindEvents();
  initialize();
})();
