/**
 * ============================================================
 * KATHIR Dashboard — Main Application
 * ============================================================
 * Orchestrates state management, event handling, API calls,
 * and UI rendering for the entire dashboard.
 */

const App = {

  // ── State ──────────────────────────────────────────────

  state: {
    modules: [],
    subModules: [],
    payments: [],
    currentFilter: 'All',
    currentModule: null,
    isAdminUnlocked: false
  },

  // ── Initialization ────────────────────────────────────

  async init() {
    this.setupEventListeners();

    const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

    if (isDemo) {
      const data = this.loadDemoData();
      this.state.modules = data.modules;
      this.state.subModules = data.subModules;
      this.state.payments = data.payments;
      this.renderDashboard();
      this.hideLoading();
      this.showToast('Running in demo mode — configure APPS_SCRIPT_URL for live data', 'info');
    } else {
      try {
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
        this.hideLoading();
      } catch (error) {
        console.error('Failed to load data:', error);
        this.hideLoading();
        this.showToast('Failed to load data: ' + error.message, 'error');
        // Fall back to demo data
        const data = this.loadDemoData();
        this.state.modules = data.modules;
        this.state.subModules = data.subModules;
        this.state.payments = data.payments;
        this.renderDashboard();
      }
    }
  },

  // ── Demo Data ──────────────────────────────────────────

  loadDemoData() {
    return {
      modules: [
        {
          Module_ID: 'MOD_1',
          Module_Name: 'Geoportal',
          Type: 'Core',
          Scope_Requirements: 'Interactive GIS-based mapping platform for agricultural land parcels. Includes satellite imagery integration, cadastral map overlays, crop pattern visualization, and administrative boundary layers.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-15',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Final UAT sign-off completed.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1500000
        },
        {
          Module_ID: 'MOD_2',
          Module_Name: 'AI Field Boundary Detection',
          Type: 'AI',
          Scope_Requirements: 'Deep learning model for automatic delineation of agricultural field boundaries from high-resolution satellite imagery (Sentinel-2). Target accuracy: 92% IoU.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-20',
          UAT_Image_URLs: '',
          Current_Blockers: 'Model accuracy at 88% IoU — needs improvement on fragmented holdings.',
          IT_Cell_Last_Action: 'Initiated data collection from North-East India.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1200000
        },
        {
          Module_ID: 'MOD_3',
          Module_Name: 'Unified Farmer Database',
          Type: 'Core',
          Scope_Requirements: 'Centralized registry linking Aadhaar-authenticated farmer profiles with land records, bank accounts, and scheme enrollment data.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-03-28',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Database migrated to production. 12.3 million farmer records verified.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1500000
        },
        {
          Module_ID: 'MOD_4',
          Module_Name: 'Crop Survey Module',
          Type: 'Core',
          Scope_Requirements: 'Mobile-first crop cutting experiment (CCE) digitization platform. Offline-capable Android app for field enumerators.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-30',
          UAT_Image_URLs: '',
          Current_Blockers: 'Offline sync failing intermittently on Android 12 devices.',
          IT_Cell_Last_Action: 'Bug fix deployed for sync issue (v2.4.1). Testing in progress.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1000000
        },
        {
          Module_ID: 'MOD_5',
          Module_Name: 'Weather Intelligence',
          Type: 'AI',
          Scope_Requirements: 'AI-powered hyper-local weather forecasting (5km grid) integrating IMD data and AWS station networks.',
          UAT_Status: 'Not Started',
          UAT_Date: '',
          UAT_Image_URLs: '',
          Current_Blockers: 'IMD API data agreement pending.',
          IT_Cell_Last_Action: 'MoU draft sent to IMD for data sharing.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1000000
        },
        {
          Module_ID: 'MOD_6',
          Module_Name: 'Soil Health Dashboard',
          Type: 'Core',
          Scope_Requirements: 'Interactive dashboard displaying soil test results across all districts. Integrates with SHC portal data.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-02',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Dashboard deployed. Historical data loaded for 2021-2026.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1000000
        },
        {
          Module_ID: 'MOD_7',
          Module_Name: 'Market Price Predictor',
          Type: 'AI',
          Scope_Requirements: 'LSTM-based time series model predicting mandi prices for 15 key commodities across 200+ APMCs.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-25',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'LSTM model v3 deployed to staging.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 1000000
        },
        {
          Module_ID: 'MOD_8',
          Module_Name: 'Subsidy Disbursement Tracker',
          Type: 'Additional',
          Scope_Requirements: 'End-to-end tracking of PM-KISAN and state-level subsidy disbursements.',
          UAT_Status: 'Not Started',
          UAT_Date: '',
          UAT_Image_URLs: '',
          Current_Blockers: 'NPCI sandbox access pending approval.',
          IT_Cell_Last_Action: 'Request submitted to NPCI for sandbox credentials.',
          Mapped_Milestone: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)',
          Allocated_Amount: 752000
        }
      ],
      subModules: [
        {
          Sub_Module_ID: 'SUB_1',
          Parent_Module_ID: 'MOD_1',
          Sub_Module_Name: 'Interactive Map Interface',
          Scope_Requirements: 'Frontend GIS interface with Leaflet/OpenLayers integration',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-10',
          UAT_Image_URLs: 'https://placehold.co/400x300/0F766E/white?text=Geoportal+Map',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Signed off'
        },
        {
          Sub_Module_ID: 'SUB_2',
          Parent_Module_ID: 'MOD_1',
          Sub_Module_Name: 'Layer Management Component',
          Scope_Requirements: 'Controls for enabling/disabling layers',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-12',
          UAT_Image_URLs: 'https://placehold.co/400x300/065F46/white?text=Layer+Controls',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Signed off'
        },
        {
          Sub_Module_ID: 'SUB_3',
          Parent_Module_ID: 'MOD_1',
          Sub_Module_Name: 'Cadastral Map Vectorization Module',
          Scope_Requirements: 'Backend script for vectorizing raster maps',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-15',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Completed and tested'
        },
        {
          Sub_Module_ID: 'SUB_4',
          Parent_Module_ID: 'MOD_2',
          Sub_Module_Name: 'Satellite Imagery API Downloader',
          Scope_Requirements: 'Downloads Sentinel-2 imagery for selected areas',
          UAT_Status: 'Completed',
          UAT_Date: '2026-05-10',
          UAT_Image_URLs: 'https://placehold.co/400x300/8B5CF6/white?text=API+Downloader',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Tested successfully'
        },
        {
          Sub_Module_ID: 'SUB_5',
          Parent_Module_ID: 'MOD_2',
          Sub_Module_Name: 'U-Net Boundary Detection Model',
          Scope_Requirements: 'The main AI boundary detection neural network',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-20',
          UAT_Image_URLs: 'https://placehold.co/400x300/8B5CF6/white?text=AI+Boundary+Detection',
          Current_Blockers: 'Accuracy at 88% instead of 92%',
          IT_Cell_Last_Action: 'Gathering North-East training data'
        },
        {
          Sub_Module_ID: 'SUB_6',
          Parent_Module_ID: 'MOD_3',
          Sub_Module_Name: 'Aadhaar Auth Connector',
          Scope_Requirements: 'Integration with UIDAI KYC gateway',
          UAT_Status: 'Completed',
          UAT_Date: '2026-03-25',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Integrated and certified'
        },
        {
          Sub_Module_ID: 'SUB_7',
          Parent_Module_ID: 'MOD_3',
          Sub_Module_Name: 'Land Registry Syncer',
          Scope_Requirements: 'Syncs land records database with land revenue APIs',
          UAT_Status: 'Completed',
          UAT_Date: '2026-03-28',
          UAT_Image_URLs: 'https://placehold.co/400x300/059669/white?text=Farmer+Database',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Sync completed'
        },
        {
          Sub_Module_ID: 'SUB_8',
          Parent_Module_ID: 'MOD_4',
          Sub_Module_Name: 'CCE Digital Form Builder',
          Scope_Requirements: 'Form customization engine for CCE questions',
          UAT_Status: 'Completed',
          UAT_Date: '2026-05-20',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Approved'
        },
        {
          Sub_Module_ID: 'SUB_9',
          Parent_Module_ID: 'MOD_4',
          Sub_Module_Name: 'Offline Data Sync Manager',
          Scope_Requirements: 'Sync queue for offline data store',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-30',
          UAT_Image_URLs: 'https://placehold.co/400x300/14B8A6/white?text=Crop+Survey+App',
          Current_Blockers: 'Sync failing on Android 12',
          IT_Cell_Last_Action: 'Working on patch'
        },
        {
          Sub_Module_ID: 'SUB_10',
          Parent_Module_ID: 'MOD_7',
          Sub_Module_Name: 'APMC Mandi Price Scraper',
          Scope_Requirements: 'Scrapes price lists from APMC websites',
          UAT_Status: 'Completed',
          UAT_Date: '2026-05-20',
          UAT_Image_URLs: '',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Stable and running daily'
        },
        {
          Sub_Module_ID: 'SUB_11',
          Parent_Module_ID: 'MOD_7',
          Sub_Module_Name: 'LSTM Predictor API',
          Scope_Requirements: 'Flask/Python microservice running predictions',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-25',
          UAT_Image_URLs: 'https://placehold.co/400x300/8B5CF6/white?text=Price+Forecast',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Model v3 deployed'
        }
      ],
      payments: [
        { Milestone_Name: 'MoU Signed', Amount: 0, Payment_Status: 'Completed', Type: 'CAPEX' },
        { Milestone_Name: 'Milestone 1 - Initial Design & Setup (10% CAPEX)', Amount: 1492000, Payment_Status: 'Pending', Type: 'CAPEX' },
        { Milestone_Name: 'Milestone 2 - Core Database & GIS Dev (10% CAPEX)', Amount: 1492000, Payment_Status: 'Pending', Type: 'CAPEX' },
        { Milestone_Name: 'Milestone 3 - Mobile Apps Development (10% CAPEX)', Amount: 1492000, Payment_Status: 'Pending', Type: 'CAPEX' },
        { Milestone_Name: 'Milestone 4 - Integration & Security Audit (10% CAPEX)', Amount: 1492000, Payment_Status: 'Pending', Type: 'CAPEX' },
        { Milestone_Name: 'Milestone 5 - Module-Wise UAT Release (60% CAPEX)', Amount: 8952000, Payment_Status: 'Pending', Type: 'CAPEX' },
        { Milestone_Name: 'OPEX Year 1 - Operations & Maintenance', Amount: 20000000, Payment_Status: 'Pending', Type: 'OPEX' },
        { Milestone_Name: 'OPEX Year 2 - Operations & Maintenance', Amount: 20000000, Payment_Status: 'Pending', Type: 'OPEX' },
        { Milestone_Name: 'OPEX Year 3 - Operations & Maintenance', Amount: 20000000, Payment_Status: 'Pending', Type: 'OPEX' },
        { Milestone_Name: 'OPEX Year 4 - Operations & Maintenance', Amount: 20000000, Payment_Status: 'Pending', Type: 'OPEX' },
        { Milestone_Name: 'OPEX Year 5 - Operations & Maintenance', Amount: 20000000, Payment_Status: 'Pending', Type: 'OPEX' }
      ]
    };
  },

  // ── Rendering ──────────────────────────────────────────

  renderDashboard() {
    // Stats
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = Components.renderStatCards(this.state.modules, this.state.payments, this.state.subModules);
    }

    // Payments
    const paymentsContainer = document.getElementById('payments-container');
    if (paymentsContainer) {
      paymentsContainer.innerHTML = Components.renderPaymentCards(this.state.payments, this.state.modules, this.state.subModules);
    }

    // Modules
    this.renderModules();

    // Populate admin dropdowns
    this.populateAdminDropdowns();
  },

  renderModules() {
    const container = document.getElementById('modules-container');
    if (container) {
      container.innerHTML = Components.renderModuleCards(this.state.modules, this.state.subModules, this.state.currentFilter);
    }
  },

  populateAdminDropdowns() {
    // Module selectors
    const uploadSelect = document.getElementById('upload-module-select');
    const subformParentSelect = document.getElementById('subform-parent-id');

    const moduleOptions = '<option value="">-- Select Module --</option>' + 
      this.state.modules.map(m => `<option value="${m.Module_ID}">${m.Module_Name} (${m.Module_ID})</option>`).join('');

    if (uploadSelect) {
      const current = uploadSelect.value;
      uploadSelect.innerHTML = moduleOptions;
      if (current) uploadSelect.value = current;
    }

    if (subformParentSelect) {
      const current = subformParentSelect.value;
      subformParentSelect.innerHTML = '<option value="">-- Select Parent Module --</option>' +
        this.state.modules.map(m => `<option value="${m.Module_ID}">${m.Module_Name} (${m.Module_ID})</option>`).join('');
      if (current) subformParentSelect.value = current;
    }

    // Payment milestone selector
    const paymentSelect = document.getElementById('payment-milestone-select');
    if (paymentSelect) {
      const current = paymentSelect.value;
      paymentSelect.innerHTML = '<option value="">-- Select Milestone --</option>';
      this.state.payments.forEach(p => {
        paymentSelect.innerHTML += `<option value="${p.Milestone_Name}">${p.Milestone_Name} — ${Components.formatCurrency(p.Amount)}</option>`;
      });
      if (current) paymentSelect.value = current;
    }

    // Mapped milestone selector in Module Form
    const mappedMilestoneSelect = document.getElementById('form-mapped-milestone');
    if (mappedMilestoneSelect) {
      const current = mappedMilestoneSelect.value;
      mappedMilestoneSelect.innerHTML = '<option value="">-- None --</option>';
      this.state.payments.forEach(p => {
        mappedMilestoneSelect.innerHTML += `<option value="${p.Milestone_Name}">${p.Milestone_Name}</option>`;
      });
      if (current) mappedMilestoneSelect.value = current;
    }
  },

  populateUploadSubModules() {
    const moduleSelect = document.getElementById('upload-module-select');
    const subModuleSelect = document.getElementById('upload-submodule-select');
    if (!moduleSelect || !subModuleSelect) return;

    const moduleId = moduleSelect.value;
    subModuleSelect.innerHTML = '<option value="">-- Select Sub-module (Optional) --</option>';
    
    if (moduleId) {
      const filtered = this.state.subModules.filter(sub => sub.Parent_Module_ID === moduleId);
      filtered.forEach(sub => {
        subModuleSelect.innerHTML += `<option value="${sub.Sub_Module_ID}">${sub.Sub_Module_Name} (${sub.Sub_Module_ID})</option>`;
      });
    }
  },

  // ── Filters ────────────────────────────────────────────

  filterModules(type) {
    this.state.currentFilter = type;

    document.querySelectorAll('#filter-buttons .filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === type);
    });

    this.renderModules();
  },

  // ── Module Modal ───────────────────────────────────────

  openModuleModal(moduleId) {
    const module = this.state.modules.find(m => m.Module_ID === moduleId);
    if (!module) return;

    this.state.currentModule = module;
    const modalBody = document.getElementById('modal-body');
    if (modalBody) {
      const moduleSubModules = this.state.subModules.filter(sub => sub.Parent_Module_ID === moduleId);
      modalBody.innerHTML = Components.renderModuleModal(module, moduleSubModules, this.state.isAdminUnlocked);
    }

    document.getElementById('module-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  },

  closeModuleModal() {
    document.getElementById('module-modal').classList.add('hidden');
    document.body.style.overflow = '';
    this.state.currentModule = null;
  },

  switchModalTab(tabName) {
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      const btnTab = btn.textContent.toLowerCase();
      const isActive = (
        (tabName === 'overview' && btnTab.includes('overview')) ||
        (tabName === 'blockers' && btnTab.includes('blockers')) ||
        (tabName === 'gallery' && btnTab.includes('gallery'))
      );
      btn.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.modal-tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.dataset.tab === tabName);
    });
  },

  // ── Lightbox ───────────────────────────────────────────

  openLightbox(imageUrl) {
    const lightbox = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (lightbox && img) {
      img.src = imageUrl;
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  },

  closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.classList.add('hidden');
      document.body.style.overflow = '';
    }
  },

  // ── Admin Panel ────────────────────────────────────────

  toggleAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if (panel) {
      panel.classList.toggle('hidden');
      if (!panel.classList.contains('hidden')) {
        panel.scrollIntoView({ behavior: 'smooth' });
      }
    }
  },

  unlockAdmin() {
    const input = document.getElementById('admin-password-input');
    if (!input) return;

    if (input.value === CONFIG.ADMIN_PASSWORD) {
      this.state.isAdminUnlocked = true;
      document.getElementById('admin-login').classList.add('hidden');
      document.getElementById('admin-content').classList.remove('hidden');
      this.showToast('Admin panel unlocked', 'success');
      if (this.state.currentModule) {
        this.openModuleModal(this.state.currentModule.Module_ID);
      }
    } else {
      this.showToast('Incorrect password', 'error');
      input.classList.add('animate-shake');
      setTimeout(() => input.classList.remove('animate-shake'), 500);
      input.value = '';
      input.focus();
    }
  },

  editModule(moduleId) {
    const module = this.state.modules.find(m => m.Module_ID === moduleId);
    if (!module) return;

    document.getElementById('form-module-id').value = module.Module_ID;
    document.getElementById('form-module-name').value = module.Module_Name || '';
    document.getElementById('form-module-type').value = module.Type || 'Core';
    document.getElementById('form-uat-status').value = module.UAT_Status || 'Not Started';
    document.getElementById('form-uat-date').value = module.UAT_Date || '';
    document.getElementById('form-scope').value = module.Scope_Requirements || '';
    document.getElementById('form-blockers').value = module.Current_Blockers || '';
    document.getElementById('form-last-action').value = module.IT_Cell_Last_Action || '';
    document.getElementById('form-mapped-milestone').value = module.Mapped_Milestone || '';
    document.getElementById('form-allocated-amount').value = module.Allocated_Amount || 0;

    document.getElementById('module-submit-text').textContent = 'Update Module';

    this.closeModuleModal();

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
    this.showToast(`Loaded ${module.Module_Name} for editing`, 'info');
  },

  async deleteModule(moduleId) {
    const module = this.state.modules.find(m => m.Module_ID === moduleId);
    if (!module) return;

    if (!confirm(`Are you sure you want to delete the module "${module.Module_Name}"? This will also delete all its sub-modules.`)) {
      return;
    }

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 600));
        this.state.modules = this.state.modules.filter(m => m.Module_ID !== moduleId);
        this.state.subModules = this.state.subModules.filter(sub => sub.Parent_Module_ID !== moduleId);
        this.showToast('Module deleted (demo mode)', 'success');
        this.renderDashboard();
      } else {
        await ApiService.deleteModule(moduleId);
        this.showToast('Module deleted successfully', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }
      this.closeModuleModal();
    } catch (error) {
      this.showToast('Failed to delete module: ' + error.message, 'error');
    }
  },

  // ── Sub-module helpers ──

  openSubModuleForm(parentId) {
    document.getElementById('subform-parent-id').value = parentId;
    this.closeModuleModal();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
    document.getElementById('subform-name').focus();
  },

  editSubModule(subModuleId) {
    const sub = this.state.subModules.find(s => s.Sub_Module_ID === subModuleId);
    if (!sub) return;

    document.getElementById('subform-id').value = sub.Sub_Module_ID;
    document.getElementById('subform-parent-id').value = sub.Parent_Module_ID || '';
    document.getElementById('subform-name').value = sub.Sub_Module_Name || '';
    document.getElementById('subform-status').value = sub.UAT_Status || 'Not Started';
    document.getElementById('subform-date').value = sub.UAT_Date || '';
    document.getElementById('subform-scope').value = sub.Scope_Requirements || '';
    document.getElementById('subform-blockers').value = sub.Current_Blockers || '';
    document.getElementById('subform-last-action').value = sub.IT_Cell_Last_Action || '';

    document.getElementById('submodule-submit-text').textContent = 'Update Sub-module';

    this.closeModuleModal();

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
    this.showToast(`Loaded sub-module for editing`, 'info');
  },

  async deleteSubModule(subModuleId) {
    const sub = this.state.subModules.find(s => s.Sub_Module_ID === subModuleId);
    if (!sub) return;

    if (!confirm(`Are you sure you want to delete the sub-module "${sub.Sub_Module_Name}"?`)) {
      return;
    }

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 500));
        this.state.subModules = this.state.subModules.filter(s => s.Sub_Module_ID !== subModuleId);
        this.showToast('Sub-module deleted (demo mode)', 'success');
        this.renderDashboard();
      } else {
        await ApiService.deleteSubModule(subModuleId);
        this.showToast('Sub-module deleted successfully', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }
      this.closeModuleModal();
    } catch (error) {
      this.showToast('Failed to delete sub-module: ' + error.message, 'error');
    }
  },

  quickUploadUatImage(subModuleId) {
    const sub = this.state.subModules.find(s => s.Sub_Module_ID === subModuleId);
    if (!sub) return;

    this.closeModuleModal();
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
      adminPanel.classList.remove('hidden');
      adminPanel.scrollIntoView({ behavior: 'smooth' });
    }

    const uploadModuleSelect = document.getElementById('upload-module-select');
    if (uploadModuleSelect) {
      uploadModuleSelect.value = sub.Parent_Module_ID;
      this.populateUploadSubModules();
      
      const uploadSubSelect = document.getElementById('upload-submodule-select');
      if (uploadSubSelect) {
        uploadSubSelect.value = subModuleId;
      }
    }

    document.getElementById('upload-file-input').focus();
    this.showToast(`Selected sub-module for screenshot upload`, 'info');
  },

  // ── Module Form ────────────────────────────────────────

  async handleModuleSubmit(event) {
    event.preventDefault();

    const moduleId = document.getElementById('form-module-id').value.trim();
    const moduleData = {
      Module_Name: document.getElementById('form-module-name').value.trim(),
      Type: document.getElementById('form-module-type').value,
      Scope_Requirements: document.getElementById('form-scope').value.trim(),
      UAT_Status: document.getElementById('form-uat-status').value,
      UAT_Date: document.getElementById('form-uat-date').value,
      Current_Blockers: document.getElementById('form-blockers').value.trim(),
      IT_Cell_Last_Action: document.getElementById('form-last-action').value.trim(),
      Mapped_Milestone: document.getElementById('form-mapped-milestone').value,
      Allocated_Amount: Number(document.getElementById('form-allocated-amount').value) || 0
    };

    if (!moduleData.Module_Name) {
      this.showToast('Module name is required', 'error');
      return;
    }

    const btn = document.getElementById('module-submit-btn');
    const btnText = document.getElementById('module-submit-text');
    const spinner = document.getElementById('module-submit-spinner');

    btn.disabled = true;
    btnText.textContent = 'Saving...';
    spinner.classList.remove('hidden');

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 800));
        if (moduleId) {
          const idx = this.state.modules.findIndex(m => m.Module_ID === moduleId);
          if (idx >= 0) {
            this.state.modules[idx] = { ...this.state.modules[idx], ...moduleData };
          }
          this.showToast('Module updated (demo mode)', 'success');
        } else {
          const newModule = {
            Module_ID: 'MOD_' + (this.state.modules.length + 1),
            ...moduleData,
            UAT_Image_URLs: ''
          };
          this.state.modules.push(newModule);
          this.showToast('Module added (demo mode)', 'success');
        }
        this.renderDashboard();
      } else {
        if (moduleId) {
          moduleData.Module_ID = moduleId;
          await ApiService.updateModule(moduleData);
          this.showToast('Module updated successfully', 'success');
        } else {
          await ApiService.addModule(moduleData);
          this.showToast('Module added successfully', 'success');
        }
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      document.getElementById('module-form').reset();
      document.getElementById('form-module-id').value = '';
      btnText.textContent = 'Add Module';

    } catch (error) {
      this.showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      spinner.classList.add('hidden');
      if (!document.getElementById('form-module-id').value) {
        btnText.textContent = 'Add Module';
      }
    }
  },

  // ── Submodule Form Submission ──

  async handleSubModuleSubmit(event) {
    event.preventDefault();

    const subformId = document.getElementById('subform-id').value.trim();
    const subModuleData = {
      Parent_Module_ID: document.getElementById('subform-parent-id').value,
      Sub_Module_Name: document.getElementById('subform-name').value.trim(),
      UAT_Status: document.getElementById('subform-status').value,
      UAT_Date: document.getElementById('subform-date').value,
      Scope_Requirements: document.getElementById('subform-scope').value.trim(),
      Current_Blockers: document.getElementById('subform-blockers').value.trim(),
      IT_Cell_Last_Action: document.getElementById('subform-last-action').value.trim()
    };

    if (!subModuleData.Parent_Module_ID) {
      this.showToast('Parent module selection is required', 'error');
      return;
    }
    if (!subModuleData.Sub_Module_Name) {
      this.showToast('Sub-module name is required', 'error');
      return;
    }

    const btn = document.getElementById('submodule-submit-btn');
    const btnText = document.getElementById('submodule-submit-text');
    const spinner = document.getElementById('submodule-submit-spinner');

    btn.disabled = true;
    btnText.textContent = 'Saving...';
    spinner.classList.remove('hidden');

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 700));
        if (subformId) {
          const idx = this.state.subModules.findIndex(s => s.Sub_Module_ID === subformId);
          if (idx >= 0) {
            this.state.subModules[idx] = { ...this.state.subModules[idx], ...subModuleData };
          }
          this.showToast('Sub-module updated (demo mode)', 'success');
        } else {
          const newSub = {
            Sub_Module_ID: 'SUB_' + (this.state.subModules.length + 1),
            ...subModuleData,
            UAT_Image_URLs: ''
          };
          this.state.subModules.push(newSub);
          this.showToast('Sub-module added (demo mode)', 'success');
        }
        this.renderDashboard();
      } else {
        if (subformId) {
          subModuleData.Sub_Module_ID = subformId;
          await ApiService.updateSubModule(subModuleData);
          this.showToast('Sub-module updated successfully', 'success');
        } else {
          await ApiService.addSubModule(subModuleData);
          this.showToast('Sub-module added successfully', 'success');
        }
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      document.getElementById('submodule-form').reset();
      document.getElementById('subform-id').value = '';
      btnText.textContent = 'Add Sub-module';

    } catch (error) {
      this.showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      spinner.classList.add('hidden');
      if (!document.getElementById('subform-id').value) {
        btnText.textContent = 'Add Sub-module';
      }
    }
  },

  // ── Image Upload ───────────────────────────────────────

  async handleImageUpload() {
    const moduleSelect = document.getElementById('upload-module-select');
    const subModuleSelect = document.getElementById('upload-submodule-select');
    const fileInput = document.getElementById('upload-file-input');
    
    const moduleId = moduleSelect.value;
    const subModuleId = subModuleSelect.value;
    const file = fileInput.files[0];

    if (!moduleId) {
      this.showToast('Please select a module', 'error');
      return;
    }
    if (!file) {
      this.showToast('Please select an image file', 'error');
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.showToast('Only image files are allowed', 'error');
      return;
    }

    const btn = document.getElementById('upload-btn');
    const btnText = document.getElementById('upload-btn-text');
    const spinner = document.getElementById('upload-btn-spinner');
    const progress = document.getElementById('upload-progress');

    btn.disabled = true;
    btnText.textContent = 'Uploading...';
    spinner.classList.remove('hidden');
    progress.classList.remove('hidden');

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const demoUrl = `https://placehold.co/400x300/14B8A6/white?text=${encodeURIComponent(file.name)}`;
        
        if (subModuleId) {
          const sub = this.state.subModules.find(s => s.Sub_Module_ID === subModuleId);
          if (sub) {
            sub.UAT_Image_URLs = sub.UAT_Image_URLs ? sub.UAT_Image_URLs + ',' + demoUrl : demoUrl;
          }
        } else {
          const mod = this.state.modules.find(m => m.Module_ID === moduleId);
          if (mod) {
            mod.UAT_Image_URLs = mod.UAT_Image_URLs ? mod.UAT_Image_URLs + ',' + demoUrl : demoUrl;
          }
        }
        this.showToast('Image uploaded (demo mode)', 'success');
        this.renderDashboard();
      } else {
        // Direct route based on whether subModuleId is specified
        if (subModuleId) {
          await ApiService.uploadImage(subModuleId, file, true);
        } else {
          await ApiService.uploadImage(moduleId, file, false);
        }
        this.showToast('Image uploaded to Google Drive!', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      fileInput.value = '';
      document.getElementById('upload-preview').classList.add('hidden');

    } catch (error) {
      this.showToast('Upload failed: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Upload Image';
      spinner.classList.add('hidden');
      progress.classList.add('hidden');
    }
  },

  // ── Add Payment Milestone ──────────────────────────────

  async handleAddPaymentSubmit(event) {
    event.preventDefault();

    const paymentData = {
      Milestone_Name: document.getElementById('add-payment-name').value.trim(),
      Amount: Number(document.getElementById('add-payment-amount').value) || 0,
      Payment_Status: document.getElementById('add-payment-status').value,
      Type: document.getElementById('add-payment-type').value
    };

    if (!paymentData.Milestone_Name) {
      this.showToast('Milestone name is required', 'error');
      return;
    }

    const btn = document.getElementById('add-payment-submit-btn');
    const btnText = document.getElementById('add-payment-submit-text');
    const spinner = document.getElementById('add-payment-submit-spinner');

    btn.disabled = true;
    btnText.textContent = 'Adding...';
    spinner.classList.remove('hidden');

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 800));
        this.state.payments.push(paymentData);
        this.showToast('Milestone added (demo mode)', 'success');
        this.renderDashboard();
      } else {
        await ApiService.addPayment(paymentData);
        this.showToast('Milestone added successfully', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      document.getElementById('add-payment-form').reset();
    } catch (error) {
      this.showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btnText.textContent = 'Add Milestone';
      spinner.classList.add('hidden');
    }
  },

  // ── Payment Update ─────────────────────────────────────

  async handlePaymentUpdate(event) {
    event.preventDefault();

    const milestoneName = document.getElementById('payment-milestone-select').value;
    const status = document.getElementById('payment-status-select').value;

    if (!milestoneName) {
      this.showToast('Please select a milestone', 'error');
      return;
    }

    const btn = document.getElementById('payment-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Updating...';

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE' || !CONFIG.APPS_SCRIPT_URL;

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 600));
        const payment = this.state.payments.find(p => p.Milestone_Name === milestoneName);
        if (payment) payment.Payment_Status = status;
        this.showToast('Payment status updated (demo mode)', 'success');
        this.renderDashboard();
      } else {
        await ApiService.updatePayment(milestoneName, status);
        this.showToast('Payment status updated', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.subModules = data.subModules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

    } catch (error) {
      this.showToast('Error: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Update Payment';
    }
  },

  // ── Toast ──────────────────────────────────────────────

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const html = Components.renderToast(message, type);
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    const toast = wrapper.firstElementChild;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 350);
    }, 4000);
  },

  // ── Loading ────────────────────────────────────────────

  hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  },

  // ── Event Listeners ────────────────────────────────────

  setupEventListeners() {
    // Filter buttons
    document.getElementById('filter-buttons')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (btn) this.filterModules(btn.dataset.filter);
    });

    // Admin toggle
    document.getElementById('admin-toggle-btn')?.addEventListener('click', () => {
      this.toggleAdminPanel();
    });

    // Admin unlock
    document.getElementById('admin-unlock-btn')?.addEventListener('click', () => {
      this.unlockAdmin();
    });
    document.getElementById('admin-password-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.unlockAdmin();
    });

    // Module form
    document.getElementById('module-form')?.addEventListener('submit', (e) => {
      this.handleModuleSubmit(e);
    });

    // Module form reset
    document.getElementById('module-reset-btn')?.addEventListener('click', () => {
      document.getElementById('module-form').reset();
      document.getElementById('form-module-id').value = '';
      document.getElementById('module-submit-text').textContent = 'Add Module';
    });

    // Submodule form
    document.getElementById('submodule-form')?.addEventListener('submit', (e) => {
      this.handleSubModuleSubmit(e);
    });

    // Submodule form reset
    document.getElementById('submodule-reset-btn')?.addEventListener('click', () => {
      document.getElementById('submodule-form').reset();
      document.getElementById('subform-id').value = '';
      document.getElementById('submodule-submit-text').textContent = 'Add Sub-module';
    });

    // Upload module change -> dynamic populate submodules
    document.getElementById('upload-module-select')?.addEventListener('change', () => {
      this.populateUploadSubModules();
    });

    // Image upload submit
    document.getElementById('upload-btn')?.addEventListener('click', () => {
      this.handleImageUpload();
    });

    // File input — drop zone click
    document.getElementById('upload-drop-zone')?.addEventListener('click', () => {
      document.getElementById('upload-file-input').click();
    });

    // File input change — preview + enable button
    document.getElementById('upload-file-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      const preview = document.getElementById('upload-preview');
      const btn = document.getElementById('upload-btn');

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          preview.src = reader.result;
          preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        btn.disabled = false;
      } else {
        preview.classList.add('hidden');
        btn.disabled = true;
      }
    });

    // Drag and drop on upload zone
    const dropZone = document.getElementById('upload-drop-zone');
    if (dropZone) {
      ['dragenter', 'dragover'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropZone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(evt => {
        dropZone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropZone.classList.remove('dragover');
        });
      });
      dropZone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) {
          const input = document.getElementById('upload-file-input');
          const dt = new DataTransfer();
          dt.items.add(file);
          input.files = dt.files;
          input.dispatchEvent(new Event('change'));
        }
      });
    }

    // Payment form
    document.getElementById('payment-form')?.addEventListener('submit', (e) => {
      this.handlePaymentUpdate(e);
    });

    // Add Payment milestone form
    document.getElementById('add-payment-form')?.addEventListener('submit', (e) => {
      this.handleAddPaymentSubmit(e);
    });

    // Modal close
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      this.closeModuleModal();
    });
    document.getElementById('module-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'module-modal') this.closeModuleModal();
    });

    // Lightbox close
    document.getElementById('lightbox-close-btn')?.addEventListener('click', () => {
      this.closeLightbox();
    });
    document.getElementById('lightbox')?.addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') this.closeLightbox();
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!document.getElementById('lightbox').classList.contains('hidden')) {
          this.closeLightbox();
        } else if (!document.getElementById('module-modal').classList.contains('hidden')) {
          this.closeModuleModal();
        }
      }
    });
  }
};

// ── Bootstrap ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => App.init());
