/**
 * ============================================================
 * Agristack Dashboard — Main Application
 * ============================================================
 * Orchestrates state management, event handling, API calls,
 * and UI rendering for the entire dashboard.
 */

const App = {

  // ── State ──────────────────────────────────────────────

  state: {
    modules: [],
    payments: [],
    currentFilter: 'All',
    currentModule: null,
    isAdminUnlocked: false
  },

  // ── Initialization ────────────────────────────────────

  async init() {
    this.setupEventListeners();

    const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

    if (isDemo) {
      // Load demo data immediately
      const data = this.loadDemoData();
      this.state.modules = data.modules;
      this.state.payments = data.payments;
      this.renderDashboard();
      this.hideLoading();
      this.showToast('Running in demo mode — configure APPS_SCRIPT_URL for live data', 'info');
    } else {
      try {
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
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
          Scope_Requirements: 'Interactive GIS-based mapping platform for agricultural land parcels. Includes satellite imagery integration, cadastral map overlays, crop pattern visualization, and administrative boundary layers. Supports WMS/WFS protocols and integrates with ISRO Bhuvan APIs.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-15',
          UAT_Image_URLs: 'https://placehold.co/400x300/0F766E/white?text=Geoportal+Map,https://placehold.co/400x300/065F46/white?text=Layer+Controls',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Final UAT sign-off completed. Performance optimized for 50K concurrent users.'
        },
        {
          Module_ID: 'MOD_2',
          Module_Name: 'AI Field Boundary Detection',
          Type: 'AI',
          Scope_Requirements: 'Deep learning model for automatic delineation of agricultural field boundaries from high-resolution satellite imagery (Sentinel-2, Planet Labs). Uses U-Net architecture with attention mechanisms. Target accuracy: 92% IoU on Indian farmland datasets.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-20',
          UAT_Image_URLs: 'https://placehold.co/400x300/8B5CF6/white?text=AI+Boundary+Detection',
          Current_Blockers: 'Model accuracy at 88% IoU — needs improvement on fragmented holdings in hilly terrain. Additional training data from North-East India required.',
          IT_Cell_Last_Action: 'Initiated data collection from Meghalaya and Mizoram. GPU cluster allocated for retraining.'
        },
        {
          Module_ID: 'MOD_3',
          Module_Name: 'Unified Farmer Database',
          Type: 'Core',
          Scope_Requirements: 'Centralized registry linking Aadhaar-authenticated farmer profiles with land records, bank accounts, and scheme enrollment data. Supports deduplication, family linkage, and multi-state federation. GDPR-compliant data governance framework.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-03-28',
          UAT_Image_URLs: 'https://placehold.co/400x300/059669/white?text=Farmer+Database,https://placehold.co/400x300/0F766E/white?text=Search+Interface',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Database migrated to production. 12.3 million farmer records verified and linked.'
        },
        {
          Module_ID: 'MOD_4',
          Module_Name: 'Crop Survey Module',
          Type: 'Core',
          Scope_Requirements: 'Mobile-first crop cutting experiment (CCE) digitization platform. Offline-capable Android app for field enumerators with GPS-tagged photo capture, automated yield estimation, and real-time sync to central dashboard.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-30',
          UAT_Image_URLs: 'https://placehold.co/400x300/14B8A6/white?text=Crop+Survey+App',
          Current_Blockers: 'Offline sync failing intermittently on Android 12 devices. Photo compression causing quality loss in yield verification images.',
          IT_Cell_Last_Action: 'Bug fix deployed for sync issue (v2.4.1). Testing in progress across 5 pilot districts.'
        },
        {
          Module_ID: 'MOD_5',
          Module_Name: 'Weather Intelligence',
          Type: 'AI',
          Scope_Requirements: 'AI-powered hyper-local weather forecasting (5km grid) integrating IMD data, AWS station networks, and ML ensemble models. Provides crop-specific advisories, frost/heatwave alerts, and 10-day forecasts for agriculture planning.',
          UAT_Status: 'Not Started',
          UAT_Date: '',
          UAT_Image_URLs: '',
          Current_Blockers: 'IMD API data agreement pending. AWS station integration awaiting NABCONS procurement clearance.',
          IT_Cell_Last_Action: 'MoU draft sent to IMD for data sharing. Follow-up meeting scheduled for June 5.'
        },
        {
          Module_ID: 'MOD_6',
          Module_Name: 'Soil Health Dashboard',
          Type: 'Core',
          Scope_Requirements: 'Interactive dashboard displaying soil test results across all districts. Integrates with SHC (Soil Health Card) portal data. Includes nutrient deficiency heatmaps, fertilizer recommendation engine, and trend analytics over 5-year periods.',
          UAT_Status: 'Completed',
          UAT_Date: '2026-04-02',
          UAT_Image_URLs: 'https://placehold.co/400x300/059669/white?text=Soil+Health+Map,https://placehold.co/400x300/065F46/white?text=Nutrient+Charts',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'Dashboard deployed. Historical data loaded for 2021-2026 from 38 districts.'
        },
        {
          Module_ID: 'MOD_7',
          Module_Name: 'Market Price Predictor',
          Type: 'AI',
          Scope_Requirements: 'LSTM-based time series model predicting mandi prices for 15 key commodities across 200+ APMCs. Integrates eNAM data feeds, seasonal indices, and macroeconomic indicators. Provides 7-day and 30-day price forecasts with confidence intervals.',
          UAT_Status: 'In Progress',
          UAT_Date: '2026-05-25',
          UAT_Image_URLs: 'https://placehold.co/400x300/8B5CF6/white?text=Price+Forecast',
          Current_Blockers: '',
          IT_Cell_Last_Action: 'LSTM model v3 deployed to staging. Accuracy within 8% MAPE for top 10 commodities.'
        },
        {
          Module_ID: 'MOD_8',
          Module_Name: 'Subsidy Disbursement Tracker',
          Type: 'Additional',
          Scope_Requirements: 'End-to-end tracking of PM-KISAN and state-level subsidy disbursements. Real-time reconciliation with bank NPCI data. Beneficiary-level status tracking (initiated → processed → credited → failed). Exception handling dashboard for rejected transfers.',
          UAT_Status: 'Not Started',
          UAT_Date: '',
          UAT_Image_URLs: '',
          Current_Blockers: 'NPCI sandbox access pending approval. State treasury integration specification not finalized.',
          IT_Cell_Last_Action: 'Request submitted to NPCI for sandbox credentials. Expected turnaround: 2 weeks.'
        }
      ],
      payments: [
        { Milestone_Name: 'MoU Signed', Amount: 0, Payment_Status: 'Completed' },
        { Milestone_Name: 'CAPEX 50:50 GoK/NABCONS', Amount: 15000000, Payment_Status: 'Pending' },
        { Milestone_Name: 'OPEX Phase 1', Amount: 8000000, Payment_Status: 'Pending' },
        { Milestone_Name: 'OPEX Phase 2', Amount: 12000000, Payment_Status: 'Pending' },
        { Milestone_Name: 'UAT Completion Milestone', Amount: 5000000, Payment_Status: 'Pending' }
      ]
    };
  },

  // ── Rendering ──────────────────────────────────────────

  renderDashboard() {
    // Stats
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
      statsContainer.innerHTML = Components.renderStatCards(this.state.modules, this.state.payments);
    }

    // Payments
    const paymentsContainer = document.getElementById('payments-container');
    if (paymentsContainer) {
      paymentsContainer.innerHTML = Components.renderPaymentCards(this.state.payments);
    }

    // Modules
    this.renderModules();

    // Populate admin dropdowns
    this.populateAdminDropdowns();
  },

  renderModules() {
    const container = document.getElementById('modules-container');
    if (container) {
      container.innerHTML = Components.renderModuleCards(this.state.modules, this.state.currentFilter);
    }
  },

  populateAdminDropdowns() {
    // Module selector for image upload
    const uploadSelect = document.getElementById('upload-module-select');
    if (uploadSelect) {
      const current = uploadSelect.value;
      uploadSelect.innerHTML = '<option value="">-- Select Module --</option>';
      this.state.modules.forEach(m => {
        uploadSelect.innerHTML += `<option value="${m.Module_ID}">${m.Module_Name} (${m.Module_ID})</option>`;
      });
      if (current) uploadSelect.value = current;
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
  },

  // ── Filters ────────────────────────────────────────────

  filterModules(type) {
    this.state.currentFilter = type;

    // Update active button
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
      modalBody.innerHTML = Components.renderModuleModal(module, this.state.isAdminUnlocked);
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
    // Update tab buttons
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
      const btnTab = btn.textContent.toLowerCase();
      const isActive = (
        (tabName === 'overview' && btnTab.includes('overview')) ||
        (tabName === 'blockers' && btnTab.includes('blockers')) ||
        (tabName === 'gallery' && btnTab.includes('gallery'))
      );
      btn.classList.toggle('active', isActive);
    });

    // Update tab panes
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
      // If modal is open, refresh it to show admin actions
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

    // Populate form fields
    document.getElementById('form-module-id').value = module.Module_ID;
    document.getElementById('form-module-name').value = module.Module_Name || '';
    document.getElementById('form-module-type').value = module.Type || 'Core';
    document.getElementById('form-uat-status').value = module.UAT_Status || 'Not Started';
    document.getElementById('form-uat-date').value = module.UAT_Date || '';
    document.getElementById('form-scope').value = module.Scope_Requirements || '';
    document.getElementById('form-blockers').value = module.Current_Blockers || '';
    document.getElementById('form-last-action').value = module.IT_Cell_Last_Action || '';

    // Update submit button text
    document.getElementById('module-submit-text').textContent = 'Update Module';

    // Close modal
    this.closeModuleModal();

    // Scroll to admin panel
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

    if (!confirm(`Are you sure you want to delete the module "${module.Module_Name}"?`)) {
      return;
    }

    try {
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 600));
        this.state.modules = this.state.modules.filter(m => m.Module_ID !== moduleId);
        this.showToast('Module deleted (demo mode)', 'success');
        this.renderDashboard();
      } else {
        await ApiService.deleteModule(moduleId);
        this.showToast('Module deleted successfully', 'success');
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }
      this.closeModuleModal();
    } catch (error) {
      this.showToast('Failed to delete module: ' + error.message, 'error');
    }
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
      IT_Cell_Last_Action: document.getElementById('form-last-action').value.trim()
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
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

      if (isDemo) {
        // Simulate in demo mode
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
        // Refresh data from server
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      // Reset form
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

  // ── Image Upload ───────────────────────────────────────

  async handleImageUpload() {
    const moduleSelect = document.getElementById('upload-module-select');
    const fileInput = document.getElementById('upload-file-input');
    const moduleId = moduleSelect.value;
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
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const demoUrl = `https://placehold.co/400x300/14B8A6/white?text=${encodeURIComponent(file.name)}`;
        const mod = this.state.modules.find(m => m.Module_ID === moduleId);
        if (mod) {
          mod.UAT_Image_URLs = mod.UAT_Image_URLs
            ? mod.UAT_Image_URLs + ',' + demoUrl
            : demoUrl;
        }
        this.showToast('Image uploaded (demo mode)', 'success');
        this.renderDashboard();
      } else {
        const result = await ApiService.uploadImage(moduleId, file);
        this.showToast('Image uploaded to Google Drive!', 'success');
        // Refresh data
        const data = await ApiService.fetchData();
        this.state.modules = data.modules || [];
        this.state.payments = data.payments || [];
        this.renderDashboard();
      }

      // Reset upload form
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
      const isDemo = CONFIG.APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

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

    // Auto-remove after 4 seconds
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

    // Image upload
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
