# Agristack Project Tracking Dashboard

A lightweight project-tracking dashboard for the **Agristack** initiative, powered by a **Google Apps Script** backend and a static **HTML/CSS/JS** frontend. All data is stored in a Google Sheet, images are uploaded to Google Drive, and the frontend communicates via the Apps Script Web App URL — no server required.

---

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| **Backend** | Google Apps Script (V8 runtime)   |
| **Database**| Google Sheets (two sheets)        |
| **Storage** | Google Drive (UAT images)         |
| **Frontend**| Vanilla HTML / CSS / JavaScript   |
| **API**     | REST-like JSON over HTTPS         |

---

## Data Model

### Sheet: `Modules_Data`

| Column               | Description                             |
|----------------------|-----------------------------------------|
| Module_ID            | Auto-generated (`MOD_1`, `MOD_2`, …)    |
| Module_Name          | Name of the module                      |
| Type                 | Module type / category                  |
| Scope_Requirements   | Scope & requirements description        |
| UAT_Status           | e.g. Not Started, In Progress, Passed   |
| UAT_Date             | Date of UAT completion                  |
| UAT_Image_URLs       | Comma-separated Drive image URLs        |
| Current_Blockers     | Active blockers                         |
| IT_Cell_Last_Action  | Last action taken by the IT Cell        |

### Sheet: `Payment_Milestones`

| Column          | Description                         |
|-----------------|-------------------------------------|
| Milestone_Name  | Name of the payment milestone       |
| Amount          | Amount in ₹                         |
| Payment_Status  | `Completed` or `Pending`            |

---

## Setup Instructions

### 1 — Google Apps Script Backend

#### 1.1 Create the project

1. Go to **[script.google.com](https://script.google.com)**.
2. Click **New project**.
3. Rename the project to **Agristack Dashboard** (or any name you prefer).
4. Delete the default `myFunction` code and paste the entire contents of **`apps-script/Code.gs`** into the editor.
5. Press **Ctrl + S** to save.

#### 1.2 Run `autoSetup()`

1. In the toolbar dropdown (next to the ▶ button), select **`autoSetup`**.
2. Click **▶ Run**.
3. Google will ask you to **authorize permissions** (Sheets, Drive). Follow the prompts and allow access.
4. Once complete, a Google Sheet will open with two new tabs: `Modules_Data` and `Payment_Milestones` (pre-populated with seed data).

#### 1.3 Deploy as Web App

1. Click **Deploy → New deployment**.
2. Click the gear icon ⚙ next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description**: `v1` (or any label)
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**.
5. **Copy the Web App URL** — you will need it for the frontend.

> [!IMPORTANT]
> Every time you change `Code.gs`, you must create a **new deployment** (or update the existing one) for changes to take effect.

#### 1.4 Set up the UAT Image Folder

1. Go to **[drive.google.com](https://drive.google.com)**.
2. Create a new folder (e.g. `Agristack_UAT_Images`).
3. Open the folder. The URL will look like:
   ```
   https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
   ```
4. Copy the folder ID — the part after `/folders/` (e.g. `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`).
5. Back in **Code.gs**, replace:
   ```js
   var FOLDER_ID = 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE';
   ```
   with your actual folder ID:
   ```js
   var FOLDER_ID = '1aBcDeFgHiJkLmNoPqRsTuVwXyZ';
   ```
6. **Re-deploy** (Deploy → Manage deployments → Edit → bump version → Deploy).

---

### 2 — Frontend Setup

1. Open `frontend/js/config.js` (or wherever the config constant is defined).
2. Set the Apps Script Web App URL:
   ```js
   const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/XXXXXXXXXX/exec';
   ```
3. Open `frontend/index.html` in any modern browser — no build step needed.

---

## API Reference

### `GET` — Fetch all data

**Request**

```
GET <APPS_SCRIPT_URL>
```

**Response**

```json
{
  "status": "success",
  "data": {
    "modules": [ { "Module_ID": "MOD_1", ... } ],
    "payments": [ { "Milestone_Name": "MoU Signed", ... } ]
  }
}
```

---

### `POST` — Add Module

```json
{
  "action": "add_module",
  "Module_Name": "Land Records Module",
  "Type": "Core",
  "Scope_Requirements": "Digitize all land records",
  "UAT_Status": "Not Started",
  "UAT_Date": "",
  "Current_Blockers": "",
  "IT_Cell_Last_Action": ""
}
```

---

### `POST` — Update Module

```json
{
  "action": "update_module",
  "Module_ID": "MOD_1",
  "UAT_Status": "In Progress",
  "Current_Blockers": "Waiting for API credentials"
}
```

---

### `POST` — Update Payment Status

```json
{
  "action": "update_payment",
  "Milestone_Name": "CAPEX 50:50 GoK/NABCONS",
  "Payment_Status": "Completed"
}
```

---

### `POST` — Delete Module

```json
{
  "action": "delete_module",
  "Module_ID": "MOD_1"
}
```

---

### `POST` — Upload UAT Image

```json
{
  "action": "upload_uat_image",
  "moduleId": "MOD_1",
  "imageData": "<base64-encoded-string>",
  "mimeType": "image/png",
  "fileName": "screenshot_uat_01.png"
}
```

**Response**

```json
{
  "status": "success",
  "imageUrl": "https://drive.google.com/uc?id=FILE_ID"
}
```

---

## Notes on CORS

Google Apps Script Web Apps handle CORS automatically for `GET` requests and for `POST` requests that use `Content-Type: text/plain` (or are sent without preflight). If you use `fetch()` from the browser:

```js
fetch(APPS_SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify(payload),
  headers: { 'Content-Type': 'text/plain' }  // avoid preflight
});
```

> [!NOTE]
> Apps Script does **not** support `OPTIONS` preflight requests. Setting the content type to `text/plain` avoids the preflight entirely. Apps Script will still parse the JSON body correctly.

If you encounter redirect issues, set `redirect: 'follow'` in your `fetch` options.

---

## Project Structure

```
agristack-dashboard/
├── apps-script/
│   └── Code.gs              # Google Apps Script backend
├── frontend/
│   ├── index.html            # Dashboard UI
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js         # APPS_SCRIPT_URL constant
│       └── app.js            # Frontend logic
└── README.md                 # This file
```

---

## License

This project is released under the **MIT License**.

```
MIT License

Copyright (c) 2026 Agristack Dashboard Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
