/**
 * ============================================================
 * KATHIR Dashboard — UI Components
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

  /**
   * Robust fallback classifier for payment types.
   */
  getPaymentType(p) {
    if (p && p.Type && String(p.Type).trim() !== '') {
      return String(p.Type).trim().toUpperCase();
    }
    const name = String(p ? p.Milestone_Name : '').toUpperCase();
    if (name.includes('OPEX')) return 'OPEX';
    if (name.includes('CAPEX')) return 'CAPEX';
    return 'CAPEX';
  },

  /**
   * Dynamically calculates a module's UAT status rolled up from its sub-modules.
   */
  getRollupStatus(module, subModules) {
    if (!subModules || subModules.length === 0) {
      return String(module.UAT_Status || 'Not Started');
    }
    const statuses = subModules.map(sub => String(sub.UAT_Status || 'Not Started').toLowerCase());
    if (statuses.every(s => s === 'completed')) {
      return 'Completed';
    }
    if (statuses.some(s => s === 'failed')) {
      return 'Failed';
    }
    if (statuses.some(s => s === 'in progress' || s === 're-testing')) {
      return 'In Progress';
    }
    return 'Not Started';
  },

  /**
   * Dynamically calculates the parent UAT date based on the latest sub-module UAT date.
   */
  getRollupDate(module, subModules) {
    if (!subModules || subModules.length === 0) {
      return module.UAT_Date || '';
    }
    const statuses = subModules.map(sub => String(sub.UAT_Status || 'Not Started').toLowerCase());
    if (statuses.every(s => s === 'completed')) {
      const dates = subModules.map(sub => sub.UAT_Date).filter(d => d);
      if (dates.length > 0) {
        return dates.sort().reverse()[0];
      }
    }
    return '';
  },

  // ── Stat Cards ─────────────────────────────────────────

  renderStatCards(modules, payments, subModules) {
    const totalModules = modules.length;
    
    // Count completed modules using rollup calculation
    const uatCompleted = modules.filter(m => {
      const modSubs = subModules.filter(sub => sub.Parent_Module_ID === m.Module_ID);
      return this.getRollupStatus(m, modSubs).toLowerCase() === 'completed';
    }).length;

    // Count active blockers
    const activeBlockers = modules.filter(m => {
      const modSubs = subModules.filter(sub => sub.Parent_Module_ID === m.Module_ID);
      const hasParentBlockers = m.Current_Blockers && String(m.Current_Blockers).trim() !== '';
      const hasSubBlockers = modSubs.some(sub => sub.Current_Blockers && String(sub.Current_Blockers).trim() !== '');
      return hasParentBlockers || hasSubBlockers;
    }).length;

    // CAPEX Calculations (adding module-level dynamic releases)
    const capexPayments = payments.filter(p => this.getPaymentType(p) === 'CAPEX');
    const totalCapex = capexPayments.reduce((sum, p) => sum + (Number(p.Amount) || 0), 0) || 14920000;
    
    let utilizedCapex = 0;
    capexPayments.forEach(p => {
      const isModuleWise = String(p.Milestone_Name).toLowerCase().includes('milestone 5') || 
                           String(p.Milestone_Name).toLowerCase().includes('module-wise');
      if (isModuleWise) {
        const mappedModules = modules.filter(m => m.Mapped_Milestone === p.Milestone_Name);
        const completedModules = mappedModules.filter(m => {
          const modSubs = subModules.filter(sub => sub.Parent_Module_ID === m.Module_ID);
          return this.getRollupStatus(m, modSubs).toLowerCase() === 'completed';
        });
        utilizedCapex += completedModules.reduce((sum, m) => sum + (Number(m.Allocated_Amount) || 0), 0);
      } else if (String(p.Payment_Status).toLowerCase() === 'completed') {
        utilizedCapex += (Number(p.Amount) || 0);
      }
    });

    // OPEX Calculations
    const opexPayments = payments.filter(p => this.getPaymentType(p) === 'OPEX');
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

  renderPaymentCards(payments, modules, subModules) {
    if (!payments || payments.length === 0) {
      return '<p class="text-slate-500 text-sm">No payment milestones found.</p>';
    }

    return payments.map((p, i) => {
      const pType = this.getPaymentType(p);
      const isCapex = pType === 'CAPEX';
      
      const isModuleWise = String(p.Milestone_Name).toLowerCase().includes('milestone 5') || 
                           String(p.Milestone_Name).toLowerCase().includes('module-wise');

      let status = String(p.Payment_Status || 'Pending');
      let amount = Number(p.Amount) || 0;
      let progressWidth = 0;
      let progressColor = 'bg-slate-600';
      let subText = '';

      if (isModuleWise) {
        const mappedModules = modules.filter(m => m.Mapped_Milestone === p.Milestone_Name);
        const totalAllocated = mappedModules.reduce((sum, m) => sum + (Number(m.Allocated_Amount) || 0), 0) || amount;
        
        const completedModules = mappedModules.filter(m => {
          const modSubs = subModules.filter(sub => sub.Parent_Module_ID === m.Module_ID);
          return this.getRollupStatus(m, modSubs).toLowerCase() === 'completed';
        });
        const completedAmount = completedModules.reduce((sum, m) => sum + (Number(m.Allocated_Amount) || 0), 0);

        progressWidth = totalAllocated > 0 ? Math.round((completedAmount / totalAllocated) * 100) : 0;
        if (progressWidth >= 100) {
          status = 'Completed';
          progressColor = 'bg-emerald-500';
        } else if (progressWidth > 0) {
          status = 'Partial';
          progressColor = 'bg-amber-500';
        } else {
          status = 'Pending';
          progressColor = 'bg-slate-600';
        }
        
        subText = `<div class="text-[10px] text-slate-400 mt-1">
          Released: ${this.formatCurrency(completedAmount)} / ${this.formatCurrency(totalAllocated)} (${completedModules.length}/${mappedModules.length} modules complete)
        </div>`;
      } else {
        const isCompleted = status.toLowerCase() === 'completed';
        progressWidth = isCompleted ? 100 : (status.toLowerCase() === 'partial' ? 50 : 0);
        progressColor = isCompleted ? 'bg-emerald-500' : (status.toLowerCase() === 'partial' ? 'bg-amber-500' : 'bg-slate-600');
      }

      const statusCls = this.statusClass(status);
      const typeBadgeHtml = `<span class="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full ${isCapex ? 'bg-teal-500/10 text-teal-300 border border-teal-500/25' : 'bg-amber-500/10 text-amber-300 border border-amber-500/25'}">${pType}</span>`;

      return `
        <div class="glass-card p-4 animate-fade-in-up flex flex-col justify-between min-h-[140px]">
          <div>
            <div class="text-sm font-semibold text-white mb-1 leading-tight">${p.Milestone_Name}</div>
            <div class="text-lg font-bold text-teal-400 mb-2">${this.formatCurrency(amount)}</div>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="status-badge status-${statusCls}">${status}</span>
              ${typeBadgeHtml}
            </div>
            ${subText}
            <div class="progress-bar-track mt-3">
              <div class="progress-bar-fill ${progressColor}" style="width: ${progressWidth}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Module Cards ───────────────────────────────────────

  renderModuleCards(modules, subModules, filterType) {
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
      
      const modSubs = subModules.filter(sub => sub.Parent_Module_ID === m.Module_ID);
      const uatStatus = this.getRollupStatus(m, modSubs);
      const statusCls = this.statusClass(uatStatus);
      const uatDate = this.getRollupDate(m, modSubs);

      // Check blockers
      const hasParentBlockers = m.Current_Blockers && String(m.Current_Blockers).trim() !== '';
      const hasSubBlockers = modSubs.some(sub => sub.Current_Blockers && String(sub.Current_Blockers).trim() !== '');
      const hasBlockers = hasParentBlockers || hasSubBlockers;

      const scopePreview = this.truncate(m.Scope_Requirements, 100);

      let subModulesText = '';
      if (modSubs.length > 0) {
        const completedCount = modSubs.filter(s => String(s.UAT_Status).toLowerCase() === 'completed').length;
        subModulesText = `<div class="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          <span>🔧</span> ${completedCount}/${modSubs.length} sub-modules complete
        </div>`;
      }

      return `
        <div class="glass-card glass-card-hover p-5 cursor-pointer animate-fade-in-up relative group flex flex-col justify-between min-h-[200px]"
             onclick="App.openModuleModal('${m.Module_ID}')">
          ${hasBlockers ? '<div class="absolute top-3 right-3 blocker-indicator">⚠️ Blocker</div>' : ''}
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="text-lg">${typeInfo.icon}</span>
              <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style="background: ${typeInfo.color}22; color: ${typeInfo.color}">
                ${m.Type}
              </span>
            </div>
            <h4 class="text-base font-semibold text-white mb-2 leading-snug">${m.Module_Name}</h4>
            <p class="text-xs text-slate-400 mb-3 leading-relaxed">${scopePreview || 'No scope defined'}</p>
          </div>
          <div>
            ${subModulesText}
            <div class="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/40">
              <span class="status-badge status-${statusCls}">${uatStatus}</span>
              ${uatDate ? `<span class="text-[10px] text-slate-500">📅 ${uatDate}</span>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ── Module Detail Modal ────────────────────────────────

  renderModuleModal(module, subModules, isAdminUnlocked) {
    if (!module) return '';

    const m = module;
    const typeInfo = CONFIG.MODULE_TYPES[m.Type] || { color: '#64748B', icon: '📄' };
    
    const uatStatus = this.getRollupStatus(m, subModules);
    const statusCls = this.statusClass(uatStatus);
    const uatDate = this.getRollupDate(m, subModules);

    // Parse image URLs
    const parentImageUrls = (m.UAT_Image_URLs && String(m.UAT_Image_URLs).trim())
      ? String(m.UAT_Image_URLs).split(',').map(u => u.trim()).filter(u => u)
      : [];

    const allImages = [];
    parentImageUrls.forEach(url => {
      allImages.push({ url, source: 'Parent Module' });
    });

    subModules.forEach(sub => {
      const subUrls = (sub.UAT_Image_URLs && String(sub.UAT_Image_URLs).trim())
        ? String(sub.UAT_Image_URLs).split(',').map(u => u.trim()).filter(u => u)
        : [];
      subUrls.forEach(url => {
        allImages.push({ url, source: sub.Sub_Module_Name });
      });
    });

    // Blockers
    const hasParentBlockers = m.Current_Blockers && String(m.Current_Blockers).trim() !== '';
    const parentBlockersHtml = hasParentBlockers
      ? `<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300 leading-relaxed whitespace-pre-wrap">${m.Current_Blockers}</div>`
      : `<div class="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-400">✅ No parent blockers</div>`;

    const lastAction = m.IT_Cell_Last_Action && String(m.IT_Cell_Last_Action).trim()
      ? `<div class="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">${m.IT_Cell_Last_Action}</div>`
      : `<p class="text-sm text-slate-500 italic">No actions recorded yet.</p>`;

    const adminActionsHtml = isAdminUnlocked ? `
      <div class="flex gap-2 mt-4 pb-4 border-b border-slate-800/50">
        <button onclick="App.editModule('${m.Module_ID}')" class="btn-secondary text-xs py-1 px-3 flex items-center gap-1">
          ✏️ Edit Module
        </button>
        <button onclick="App.deleteModule('${m.Module_ID}')" class="btn-secondary text-xs py-1 px-3 bg-red-950/40 text-red-400 border-red-900/50 hover:bg-red-900/30 flex items-center gap-1">
          🗑️ Delete Module
        </button>
        <button onclick="App.openSubModuleForm('${m.Module_ID}')" class="btn-secondary text-xs py-1 px-3 bg-teal-950/40 text-teal-400 border-teal-900/50 hover:bg-teal-900/30 flex items-center gap-1 ml-auto">
          🔧 Add Sub-module
        </button>
      </div>
    ` : '';

    return `
      <!-- Module Header -->
      <div class="flex items-start gap-3 mb-2 pr-10">
        <span class="text-2xl mt-0.5">${typeInfo.icon}</span>
        <div>
          <h3 class="text-xl font-bold text-white">${m.Module_Name}</h3>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style="background: ${typeInfo.color}22; color: ${typeInfo.color}">
              ${m.Type}
            </span>
            <span class="status-badge status-${statusCls}">${uatStatus}</span>
            ${uatDate ? `<span class="text-xs text-slate-500">📅 ${uatDate}</span>` : ''}
          </div>
        </div>
      </div>

      ${adminActionsHtml}

      <!-- Tabs -->
      <div class="modal-tabs">
        <button class="modal-tab-btn active" onclick="App.switchModalTab('overview')">Overview &amp; Sub-modules</button>
        <button class="modal-tab-btn" onclick="App.switchModalTab('blockers')">Blockers &amp; Actions</button>
        <button class="modal-tab-btn" onclick="App.switchModalTab('gallery')">UAT Gallery (${allImages.length})</button>
      </div>

      <!-- Tab: Overview & Sub-modules -->
      <div class="modal-tab-pane active" data-tab="overview">
        <h5 class="text-sm font-semibold text-slate-300 mb-2">Scope &amp; Requirements</h5>
        <div class="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap mb-4">${m.Scope_Requirements || 'No scope defined.'}</div>
        
        <h5 class="text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
          <span>🔧 Structured Sub-modules</span>
          <span class="text-xs text-slate-400 font-normal">${subModules.length} defined</span>
        </h5>
        
        <div class="space-y-3">
          ${subModules.length > 0 ? subModules.map(sub => {
            const subStatus = String(sub.UAT_Status || 'Not Started');
            const subStatusCls = this.statusClass(subStatus);
            const subHasBlockers = sub.Current_Blockers && String(sub.Current_Blockers).trim() !== '';
            
            const subImages = (sub.UAT_Image_URLs && String(sub.UAT_Image_URLs).trim())
              ? String(sub.UAT_Image_URLs).split(',').map(u => u.trim()).filter(u => u)
              : [];

            return `
              <div class="bg-slate-800/35 border border-slate-700/30 rounded-lg p-3 hover:border-slate-600/40 transition-colors">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div class="font-medium text-slate-200 text-sm flex items-center gap-1.5">
                    <span class="text-xs text-teal-400">⚡</span> ${sub.Sub_Module_Name}
                    <span class="text-[9px] text-slate-500 font-mono">(${sub.Sub_Module_ID})</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="status-badge text-[9px] py-0.5 px-2 status-${subStatusCls}">${subStatus}</span>
                    ${sub.UAT_Date ? `<span class="text-[10px] text-slate-500">📅 ${sub.UAT_Date}</span>` : ''}
                  </div>
                </div>
                
                ${sub.Scope_Requirements ? `<p class="text-xs text-slate-400 mb-2 leading-relaxed">${sub.Scope_Requirements}</p>` : ''}
                
                ${subHasBlockers ? `
                  <div class="text-xs text-red-300 bg-red-950/20 border border-red-900/30 rounded p-2 mb-2 leading-relaxed">
                    <strong>⚠️ Blocker:</strong> ${sub.Current_Blockers}
                  </div>
                ` : ''}
                
                ${sub.IT_Cell_Last_Action ? `
                  <div class="text-xs text-slate-400 bg-slate-850/40 rounded p-2 mb-2 leading-relaxed">
                    <strong>Last Action:</strong> ${sub.IT_Cell_Last_Action}
                  </div>
                ` : ''}

                <!-- Submodule Image Gallery -->
                ${subImages.length > 0 ? `
                  <div class="flex gap-2 overflow-x-auto py-1 mt-2 mb-1">
                    ${subImages.map(img => `
                      <img src="${img}" alt="Sub-module UAT Screenshot"
                           class="w-16 h-12 rounded object-cover cursor-pointer hover:opacity-80 border border-slate-700/50 hover:scale-105 transition-all"
                           onclick="App.openLightbox('${img}')">
                    `).join('')}
                  </div>
                ` : ''}

                <!-- Admin sub-module controls -->
                ${isAdminUnlocked ? `
                  <div class="flex gap-3 mt-2 pt-2 border-t border-slate-800/40">
                    <button onclick="App.editSubModule('${sub.Sub_Module_ID}')" class="text-[10px] text-teal-400 hover:text-teal-300 font-medium flex items-center gap-0.5">
                      ✏️ Edit
                    </button>
                    <button onclick="App.deleteSubModule('${sub.Sub_Module_ID}')" class="text-[10px] text-red-400 hover:text-red-300 font-medium flex items-center gap-0.5">
                      🗑️ Delete
                    </button>
                    <button onclick="App.quickUploadUatImage('${sub.Sub_Module_ID}')" class="text-[10px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 ml-auto">
                      📸 Upload Image
                    </button>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('') : '<p class="text-xs text-slate-500 italic py-2">No sub-modules added yet. Use the admin panel to add sub-modules.</p>'}
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-6 pt-4 border-t border-slate-800/50 text-xs text-slate-500">
          <span>Module ID: <strong class="text-slate-400">${m.Module_ID}</strong></span>
          <span>Allocated Amount: <strong class="text-teal-400 font-semibold">${this.formatCurrency(m.Allocated_Amount)}</strong></span>
          ${m.Mapped_Milestone ? `<span>Payment Milestone: <strong class="text-teal-400 font-semibold">${m.Mapped_Milestone}</strong></span>` : ''}
        </div>
      </div>

      <!-- Tab: Blockers -->
      <div class="modal-tab-pane" data-tab="blockers">
        <h5 class="text-sm font-semibold text-slate-300 mb-3">Parent Module Blockers</h5>
        ${parentBlockersHtml}
        
        ${subModules.some(sub => sub.Current_Blockers) ? `
          <h5 class="text-sm font-semibold text-slate-300 mt-5 mb-3">Sub-modules Blockers</h5>
          <div class="space-y-2">
            ${subModules.filter(sub => sub.Current_Blockers).map(sub => `
              <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-xs">
                <div class="font-semibold text-red-300 mb-1">${sub.Sub_Module_Name} (${sub.Sub_Module_ID})</div>
                <div class="text-red-400 leading-relaxed">${sub.Current_Blockers}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <h5 class="text-sm font-semibold text-slate-300 mt-5 mb-3">IT Cell — Parent Module Action</h5>
        ${lastAction}
      </div>

      <!-- Tab: UAT Gallery -->
      <div class="modal-tab-pane" data-tab="gallery">
        ${allImages.length > 0 ? `
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            ${allImages.map(img => `
              <div class="relative group aspect-[4/3] rounded-lg overflow-hidden border border-slate-700/50">
                <img src="${img.url}" alt="UAT Screenshot"
                     class="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                     onclick="App.openLightbox('${img.url}')">
                <div class="absolute bottom-0 left-0 right-0 bg-slate-950/80 text-[10px] text-slate-300 py-1 px-2 truncate pointer-events-none">
                  ${img.source}
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="text-center py-8 text-slate-500">
            <p class="text-3xl mb-2">🖼️</p>
            <p class="text-sm">No UAT images uploaded yet.</p>
          </div>
        `}
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
