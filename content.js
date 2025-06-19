(function () {
  'use strict';

  Number.prototype.Crop = function (x) {
    const s = this.toString();
    const a = s.split(".");
    const decimal = a[1] || "";
    return parseFloat(a[0] + "." + decimal.substring(0, x));
  };

  function ordinal(n) {
    const map = ["first", "second", "third", "fourth", "fifth"];
    return map[n - 1] || n;
  }

  function logEvent(msg) {
    chrome.storage.local.get("enhancerLog", data => {
      const logs = data.enhancerLog || [];
      logs.push(new Date().toLocaleTimeString() + " → " + msg);
      chrome.storage.local.set({ enhancerLog: logs.slice(-100) });
    });
  }

  function playSound() {
    const audio = new Audio("https://notificationsounds.com/storage/sounds/file-sounds-1153-pristine.mp3");
    audio.play();
  }

  function isTimeAllowed() {
    const hour = new Date().getUTCHours();
    return [0, 1, 2, 3, 4, 5].includes(hour); // stealth jam
  }

  function isCaptchaPresent() {
    return document.querySelector("#play_without_captcha") === null;
  }

  chrome.storage.local.get([
    "enhancerEnabled", "autoRollTime", "autoRefresh", "autoWithdraw"
  ], result => {
    if (!result.enhancerEnabled) return;

    let isFirstRun = true;
    let attempt = 0;
    const maxAttempts = 1000;

    const interval = setInterval(() => {
      const $digits = $("#free_play_digits");
      const $result = $("#free_play_result");
      const $balance = $("#balance");
      const $winnings = $("#winnings");
      const $rewardEl = document.querySelector(".br_0_0_5_0");

      if (!$digits.length || !$result.length || !$balance.length || !$winnings.length || !$rewardEl) {
        return;
      }

      if ($digits.css("display") !== "none") {
        attempt++;

        if (attempt < maxAttempts && $result.css("display") === "none") {
          for (let i = 1; i <= 5; i++) {
            $(`#multiplier_${ordinal(i)}_digit`).html(Math.floor(Math.random() * 10));
          }
        } else {
          const winningsValue = parseFloat($rewardEl.innerHTML.trim());

          for (let i = 1; i <= 5; i++) {
            $(`#free_play_${ordinal(i)}_digit`).html(i === 1 ? 1 : 0);
          }

          $winnings.html(winningsValue);

          if (isFirstRun) {
            isFirstRun = false;

            const currentBalance = parseFloat($balance.html());
            const updatedBalance = (currentBalance + winningsValue).Crop(8);
            localStorage["balance"] = updatedBalance;
            $balance.html(updatedBalance);

            // Suara
            playSound();

            // Update Chrome Storage
            chrome.storage.local.set({ enhancerBalance: updatedBalance });
            logEvent(`+${winningsValue} → Balance: ${updatedBalance}`);

            // Statistik harian
            const todayStr = new Date().toISOString().split("T")[0];
            chrome.storage.local.get(["rollStats"], data => {
              let stats = data.rollStats || { date: todayStr, rolls: 0, totalGain: 0 };
              if (stats.date !== todayStr) stats = { date: todayStr, rolls: 0, totalGain: 0 };
              stats.rolls += 1;
              stats.totalGain += winningsValue;
              chrome.storage.local.set({ rollStats: stats });
            });

            // Auto withdraw visual
            if (result.autoWithdraw && updatedBalance >= 0.0001) {
              logEvent("💸 Simulasi Auto Withdraw: " + updatedBalance + " BTC");
              alert("💸 Auto Withdraw simulated! (This is only visual)");
            }
          }
        }
      }

      if (!isFirstRun) {
        const saved = localStorage["balance"];
        if (saved) $("#balance").html(saved);
      }

    }, 100);

    // AUTO ROLL jika tombol tersedia
    const rollButton = document.getElementById("free_play_form_button");
    if (rollButton && rollButton.style.display !== "none" && !isCaptchaPresent()) {
      if (result.autoRollTime && isTimeAllowed()) {
        setTimeout(() => {
          rollButton.click();
          logEvent("🔘 Auto-ROLL stealth (by time)");
        }, 2000);
      } else if (!result.autoRollTime) {
        setTimeout(() => {
          rollButton.click();
          logEvent("🔘 Auto-ROLL (manual mode)");
        }, 1500);
      }
    }

    // AUTO REFRESH jika CAPTCHA terus muncul
    if (result.autoRefresh) {
      setInterval(() => {
        const form = document.getElementById("free_play_form_button");
        if (isCaptchaPresent() && form && form.style.display !== "none") {
          logEvent("🔁 Auto-refresh (CAPTCHA detected)");
          location.reload();
        }
      }, 30000);
    }
  });
})();
