document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("toggle-script");
  const statusText = document.getElementById("status-text");
  const balanceDisplay = document.getElementById("balance-display");
  const logList = document.getElementById("log-list");
  const statsEl = document.getElementById("stats");
  const autoRollTime = document.getElementById("auto-roll-time");
  const autoRefresh = document.getElementById("auto-refresh");
  const autoWithdraw = document.getElementById("auto-withdraw");

  chrome.storage.local.get(["enhancerEnabled", "enhancerLog", "enhancerBalance", "rollStats", "autoRollTime", "autoRefresh", "autoWithdraw"], data => {
    toggle.checked = data.enhancerEnabled || false;
    statusText.textContent = toggle.checked ? "ON" : "OFF";

    balanceDisplay.textContent = data.enhancerBalance || "-";

    const logs = data.enhancerLog || [];
    logs.slice(-10).reverse().forEach(log => {
      const li = document.createElement("li");
      li.textContent = log;
      logList.appendChild(li);
    });

    const stats = data.rollStats || { date: today(), rolls: 0, totalGain: 0 };
    statsEl.innerText = `Rolls: ${stats.rolls}x\nGain: ${stats.totalGain.toFixed(8)} BTC`;

    autoRollTime.checked = data.autoRollTime || false;
    autoRefresh.checked = data.autoRefresh || false;
    autoWithdraw.checked = data.autoWithdraw || false;
  });

  toggle.addEventListener("change", () => {
    chrome.storage.local.set({ enhancerEnabled: toggle.checked });
    statusText.textContent = toggle.checked ? "ON" : "OFF";
  });

  autoRollTime.addEventListener("change", () => {
    chrome.storage.local.set({ autoRollTime: autoRollTime.checked });
  });

  autoRefresh.addEventListener("change", () => {
    chrome.storage.local.set({ autoRefresh: autoRefresh.checked });
  });

  autoWithdraw.addEventListener("change", () => {
    chrome.storage.local.set({ autoWithdraw: autoWithdraw.checked });
  });

  document.getElementById("export-log").addEventListener("click", () => {
    chrome.storage.local.get(["enhancerLog"], data => {
      const logs = data.enhancerLog || [];
      const csv = logs.map(line => `"${line.replace(/"/g, '""')}"`).join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      downloadFile(url, "enhancer_log.csv");
    });
  });

  document.getElementById("backup-log").addEventListener("click", () => {
    chrome.storage.local.get(["enhancerLog"], data => {
      const blob = new Blob([JSON.stringify(data.enhancerLog || [])], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      downloadFile(url, "enhancer_log_backup.json");
    });
  });

  document.getElementById("restore-log").addEventListener("click", () => {
    document.getElementById("restore-input").click();
  });

  document.getElementById("restore-input").addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      try {
        const logs = JSON.parse(e.target.result);
        if (Array.isArray(logs)) {
          chrome.storage.local.set({ enhancerLog: logs }, () => {
            alert("Log berhasil di-restore. Reload popup untuk melihat.");
          });
        }
      } catch (e) {
        alert("File tidak valid.");
      }
    };
    reader.readAsText(file);
  });

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  function downloadFile(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
});
