

# 📌 Hackathon Deadline Tracker Chrome Extension

## 🚀 Overview

**Hackathon Deadline Tracker** is a Chrome Extension that helps developers automatically save hackathon and event registration links, detect deadlines, and manage all registrations in a smart dashboard.

It is designed for students, developers, and hackathon participants who apply to multiple events and want a simple way to track deadlines and registrations.

---

## 🎯 Key Features

### ✅ 1. One-Click Hackathon Link Saver

* Copy any hackathon registration link
* Click the extension button
* The link is saved automatically

---

### ✅ 2. Automatic Deadline Detection

* Extracts deadline dates from hackathon pages
* Detects keywords like **“Last Date”, “Closes On”, “Registration Deadline”**

---

### ✅ 3. Countdown Timer

* Shows remaining days and hours before deadline
* Color alerts:

  * 🟢 Green – Enough time
  * 🟡 Yellow – Deadline soon
  * 🔴 Red – Urgent

---

### ✅ 4. Smart Hackathon Dashboard

Displays all saved events in a structured table:

| Hackathon Name | Platform | Deadline | Days Left | Register |
| -------------- | -------- | -------- | --------- | -------- |

---

### ✅ 5. Daily Summary Report

* Generates a summary of all hackathons registered in a day
* Useful for productivity tracking

---

### ✅ 6. Export to Excel / CSV

* Download hackathon data for analysis or sharing

---

### ✅ 7. Notification Reminders

* Alerts before deadlines (3 days, 1 day, last day)

---

### ✅ 8. Duplicate Link Detection

* Prevents saving the same hackathon multiple times

---

### 🌙 9. Dark Mode UI

* Developer-friendly light and dark themes

---
## 📂 Project Structure

```
hackathon-tracker-extension/
│
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── contentScript.js
├── dashboard.html
├── dashboard.js
├── styles.css
└── icons/
```

---

## ⚙️ Installation

1. Clone the repository
2. Open Chrome → `chrome://extensions`
3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select the project folder

---

## 📌 Use Case

This extension helps developers:

* Never miss hackathon deadlines
* Track registrations efficiently
* Stay organized during hackathon season

---
