/**
 * ============================================================
 * Agristack Dashboard — UI Components
 * ============================================================
 * Pure render functions that return HTML strings.
 * All components use glass-card styling and status badges
 * defined in styles.css.
 */

const Components = {

  // ── Helpers ─────────────────────────────────────────────

  /**
   * Format amount as Indian Rupees: ₹12,34,567
   */
  formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Turn a UAT/payment status string into a CSS class suffix.
   * "In Progress" → "in-progress", "Re-testing" → "re-testing"
   */
  statusClass(status) {
    if (!status) return 'not-started';
    return status.toLowerCase().replace(/\s+/g, '-');
  },

  /**
   * Truncate text to a max length, appending ellipsis.
   */
  truncate(text, max = 100) {
    if (!text) return '';
    const str = String(text);
    return str.length > max ? str.substring(0, max) + '…' : str;
  },

  // ── Stat Cards ─────────────────────────────────────────

  renderStatCards(modules, payments) {
    const totalModules = modules.length;
    const uatCompleted = modules.filter(m => String(m.UAT_Status).toLowerCase() === 'completed').length;
    const activeBlockers = modules.filter(m => m.Current_Blockers && String(m.Current_Blockers).trim() !== '').length;

    // CAPEX Calculations
    const capexPayments = payments.filter(p => String(p.Type || '').toUpperCase() === 'CAPEX');
    const totalCapex = capexPayments.reduce((sum, p) => sum + (Number(p.Amount) || 0), 0) || 14920000;
    const utilizedCapex = capexPayments
      .filter(p => String(p.Payment_Status).toLowerCase() === 'completed')
      .reduce((sum, p) => sum + (Number(p.Amount) || 0), 0);

    // OPEX Calculations
    const opexPayments = payments.filter(p => String(p.Type || '').toUpperCase() === 'OPEX');
    const totalOpex = opexPayments.reduce((sum, p) => sum + (Number(p.Amount) || 0), 0) || 100000000;
    const utilizedOpex = opexPayments
      .filter(p => String(p.Payment_Status).toLowerCase() === 'completed')
      .reduce((sum, p) => sum + (Number(p.Amount) || 0), 0);

    const stats = [
      { icon: '📦', value: totalModules, label: 'Total Modules', color: 'from-teal-500/20 to-teal-600/10' },
      { icon: '✅', value: uatCompleted, label: 'UAT Completed', color: 'from-emerald-500/20 to-emerald-600/10' },
      { icon: '⚠️', value: activeBlockers, label: 'Active Blockers', color: 'from-red-500/20 to-red-600/10' },
      { icon: '🏗️', value: this.formatCurrency(utilizedCapex), label: `CAPEX (of ${this.formatCurrency(totalCapex)})`, color: 'from-teal-500/20 to-teal-600/10' },
      { icon: '⚙️', value: this.formatCurrency(utilizedOpex), label: `OPEX (of ${this.formatCurrency(totalOpex)})`, color: 'from-amber-500/20 to-amber-600/10' }
    ];

    return stats.map((s, i) => `
      <div class="glass-card p-5 animate-fade-in-up">
        <div class="flex items-center gap-3 mb-2">
          <div class="stat-icon-glow w-10 h-10 flex items-center justify-center bg-gradient-to-br ${s.color} rounded-xl text-xl">
            ${s.icon}
          </div>
        </div>
        <div class="text-2xl font-bold text-white">${s.value}</div>
        <div class="text-xs text-slate-400 mt-0.5">${s.label}</div>
      </div>
    `).join('');
  },

  // ── Payment Cards ──────────────────────────────────────

  renderPaymentCards(payments) {
    if (!payments || payments.length === 0) {
      return '<p class="text-slate-500 text-sm">No payment milestones found.</p>';
    }

    return payments.map((p, i) => {
      const status = String(p.Payment_Status || 'Pending');
      const statusCls = this.statusClass(status);
      const amount = Number(p.Amount) || 0;
      const isCompleted = status.toLowerCase() === 'completed';
      const progressWidth = isCompleted ? 100 : (status.toLowerCase() === 'partial' ? 50 : 0);
      const progressColor = isCompleted ? 'bg-emerald-500' : (status.toLowerCase() === 'partial' ? 'bg-amber-500' : 'bg-slate-600');
      
      const isCapex = String(p.Type || '').toUpperCase() === 'CAPEX';
      const typeBadgeHtml = `<span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${isCapex ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25' : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'}">${p.Type || 'CAPEX'}</span>`;

      return `
        <div class="glass-card p-4 animate-fade-in-up">
          <div class="text-sm font-semibold text-white mb-1 leading-tight">${p.Milestone_Name}</div>
          <div class="text-lg font-bold text-teal-400 mb-2">${this.formatCurrency(amount)}</div>
          <div class="flex items-center gap-2">
            <span class="status-badge status-${statusCls}">${status}</span>
            ${typeBadgeHtml}
          </div>
          <div class="progress-bar-track mt-3">
            <div class="progress-bar-fill ${progressColor}" style="width: ${progressWidth}%"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Module Cards ───────────────────────────────────────

  renderModuleCards(modules, filterType) {
    let filtered = modules;
    if (filterType && filterType !== 'All') {
      filtered = modules.filter(m => String(m.Type) === filterType);
    }

    if (filtered.length === 0) {
      return `<div class="col-span-full text-center py-12 text-slate-500">
        <p class="text-3xl mb-2">📭</p>
        <p class="text-sm">No modules found for this filter.</p>
      </div>`;
    }

    return filtered.map((m, i) => {
      const typeInfo = CONFIG.MODULE_TYPES[m.Type] || { color: '#64748B', icon: '📄' };
      const uatStatus = String(m.UAT_Status || 'Not Started');
      const statusCls = this.statusClass(uatStatus);
      const hasBlockers = m.Current_Blockers && String(m.Current_Blockers).trim() !== '';
      const scopePreview = this.truncate(m.Scope_Requirements, 100);

      return `
        <div class="glass-card glass-card-hover p-5 cursor-pointer animate-fade-in-up relative group"
             onclick="App.openModuleModal('${m.Module_ID}')">
          ${hasBlockers ? '<div class="absolute top-3 right-3 blocker-indicator">⚠️ Blocker</div>' : ''}
          <div class="flex items-center gap-2 mb-3">
            <span class="text-lg">${typeInfo.icon}</span>
            <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style="background: ${typeInfo.color}22; color: ${typeInfo.color}">
              ${m.Type}
            </span>
          </div>
          <h4 class="text-base font-semibold text-white mb-2 leading-snug">${m.Module_Name}</h4>
          <p class="text-xs text-slate-400 mb-3 leading-relaxed">${scopePreview || 'No scope defined'}</p>
          <div class="flex items-center justify-between mt-auto">
            <span class="status-badge status-${statusCls}">${uatStatus}</span>
            ${m.UAT_Date ? `<span class="text-xs text-slate-500">${m.UAT_Date}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Module Detail Modal ────────────────────────────────

  renderModuleModal(module, isAdminUnlocked) {
    if (!module) return '';

    const m = module;
    const typeInfo = CONFIG.MODULE_TYPES[m.Type] || { color: '#64748B', icon: '📄' };
    const uatStatus = String(m.UAT_Status || 'Not Started');
    const statusCls = this.statusClass(uatStatus);

    // Parse image URLs
    const imageUrls = (m.UAT_Image_URLs && String(m.UAT_Image_URLs).trim())
      ? String(m.UAT_Image_URLs).split(',').map(u => u.trim()).filter(u => u)
      : [];

    // Blockers
    const hasBlockers = m.Current_Blockers && String(m.Current_Blockers).trim() !== '';
    const blockersHtml = hasBlockers
      ? `<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300 leading-relaxed whitespace-pre-wrap">${m.Current_Blockers}</div>`
      : `<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-400">✅ No active blockers</div>`;

    const lastAction = m.IT_Cell_Last_Action && String(m.IT_Cell_Last_Action).trim()
      ? `<div class="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${m.IT_Cell_Last_Action}</div>`
      : `<p class="text-sm text-slate-500 italic">No actions recorded yet.</p>`;

    // UAT Gallery
    let galleryHtml = '';
    if (imageUrls.length > 0) {
      galleryHtml = `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        ${imageUrls.map(url => `
          <img src="${url}" alt="UAT Screenshot"
               class="uat-thumb"
               onclick="App.openLightbox('${url}')"
               onerror="this.style.display='none'">
        `).join('')}
      </div>`;
    } else {
      galleryHtml = `<div class="text-center py-8 text-slate-500">
        <p class="text-3xl mb-2">🖼️</p>
        <p class="text-sm">No UAT images uploaded yet.</p>
      </div>`;
    }

    const adminActionsHtml = isAdminUnlocked ? `
      <div class="flex gap-2 mt-4 pb-4 border-b border-slate-800/50">
        <button onclick="App.editModule('${m.Module_ID}')" class="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
          ✏️ Edit Module
        </button>
        <button onclick="App.deleteModule('${m.Module_ID}')" class="btn-secondary text-xs py-1 px-3 bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/30 flex items-center gap-1">
          🗑️ Delete Module
        </button>
      </div>
    ` : '';

    return `
      <!-- Module Header -->
      <div class="flex items-start gap-3 mb-2 pr-10">
        <span class="text-2xl mt-0.5">${typeInfo.icon}</span>
        <div>
          <h3 class="text-xl font-bold text-white">${m.Module_Name}</h3>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style="background: ${typeInfo.color}22; color: ${typeInfo.color}">
              ${m.Type}
            </span>
            <span class="status-badge status-${statusCls}">${uatStatus}</span>
            ${m.UAT_Date ? `<span class="text-xs text-slate-500">📅 ${m.UAT_Date}</span>` : ''}
          </div>
        </div>
      </div>

      ${adminActionsHtml}

      <!-- Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab-btn active" onclick="App.switchModalTab('overview')">Overview</button>
        <button class="modal-tab-btn" onclick="App.switchModalTab('blockers')">Blockers &amp; Actions</button>
        <button class="modal-tab-btn" onclick="App.switchModalTab('gallery')">UAT Gallery (${imageUrls.length})</button>
      </div>

      <!-- Tab: Overview -->
      <div class="modal-tab-pane active" data-tab="overview">
        <h5 class="text-sm font-semibold text-slate-300 mb-2">Scope &amp; Requirements</h5>
        <div class="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${m.Scope_Requirements || 'No scope defined.'}</div>
        
        ${m.Sub_Modules ? `
        <h5 class="text-sm font-semibold text-slate-300 mt-4 mb-2">Sub-modules / Components</h5>
        <div class="bg-slate-800/30 border border-slate-750/30 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${m.Sub_Modules}</div>
        ` : ''}

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-6 pt-4 border-t border-slate-800/50 text-xs text-slate-500">
          <span>Module ID: <strong class="text-slate-400">${m.Module_ID}</strong></span>
          ${m.Mapped_Milestone ? `<span>Payment Milestone: <strong class="text-teal-400 font-semibold">${m.Mapped_Milestone}</strong></span>` : ''}
        </div>
      </div>

      <!-- Tab: Blockers -->
      <div class="modal-tab-pane" data-tab="blockers">
        <h5 class="text-sm font-semibold text-slate-300 mb-3">Current Blockers</h5>
        ${blockersHtml}
        <h5 class="text-sm font-semibold text-slate-300 mt-5 mb-3">IT Cell — Last Action</h5>
        ${lastAction}
      </div>

      <!-- Tab: UAT Gallery -->
      <div class="modal-tab-pane" data-tab="gallery">
        ${galleryHtml}
      </div>
    `;
  },

  // ── Toast Notifications ────────────────────────────────

  renderToast(message, type = 'info') {
    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️'
    };
    return `
      <div class="toast toast-${type}">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span>${message}</span>
      </div>
    `;
  }
};
