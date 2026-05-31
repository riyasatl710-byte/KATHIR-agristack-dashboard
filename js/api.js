const ApiService = {

  async fetchData() {
    try {
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'GET',
        redirect: 'follow'
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'API returned an error');
      }
      return result.data;
    } catch (error) {
      console.error('ApiService.fetchData error:', error);
      throw error;
    }
  },

  async addModule(moduleData) {
    try {
      const payload = { action: 'add_module', ...moduleData };
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to add module');
      }
      return result;
    } catch (error) {
      console.error('ApiService.addModule error:', error);
      throw error;
    }
  },

  async updateModule(moduleData) {
    try {
      const payload = { action: 'update_module', ...moduleData };
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update module');
      }
      return result;
    } catch (error) {
      console.error('ApiService.updateModule error:', error);
      throw error;
    }
  },

  async updatePayment(milestoneName, status) {
    try {
      const payload = {
        action: 'update_payment',
        Milestone_Name: milestoneName,
        Payment_Status: status
      };
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to update payment');
      }
      return result;
    } catch (error) {
      console.error('ApiService.updatePayment error:', error);
      throw error;
    }
  },

  async uploadImage(moduleId, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Full = reader.result;
          const imageData = base64Full.split(',')[1];
          const mimeType = file.type;
          const fileName = file.name;
          const payload = {
            action: 'upload_uat_image',
            moduleId: moduleId,
            imageData: imageData,
            mimeType: mimeType,
            fileName: fileName
          };
          const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
            method: 'POST',
            redirect: 'follow',
            body: JSON.stringify(payload)
          });
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const result = await response.json();
          if (result.status !== 'success') {
            throw new Error(result.message || 'Failed to upload image');
          }
          resolve(result);
        } catch (error) {
          console.error('ApiService.uploadImage POST error:', error);
          reject(error);
        }
      };
      reader.onerror = () => {
        console.error('ApiService.uploadImage FileReader error:', reader.error);
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  },

  async deleteModule(moduleId) {
    try {
      const payload = { action: 'delete_module', Module_ID: moduleId };
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.status !== 'success') {
        throw new Error(result.message || 'Failed to delete module');
      }
      return result;
    } catch (error) {
      console.error('ApiService.deleteModule error:', error);
      throw error;
    }
  }
};
