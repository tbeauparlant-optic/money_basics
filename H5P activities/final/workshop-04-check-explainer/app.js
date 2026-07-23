const stage = document.getElementById("stage");
const checkImage = document.getElementById("checkImage");
const panelPlaceholder = document.getElementById("panelPlaceholder");
const panelContent = document.getElementById("panelContent");
const panelTitle = document.getElementById("panelTitle");
const panelBullets = document.getElementById("panelBullets");

let hotspotsData = [];

function showDetails(num) {
  const item = hotspotsData.find((h) => h.num === num);
  if (!item) return;

  // Toggle active class on hotspots
  document.querySelectorAll(".hotspot").forEach((btn) => {
    const btnNum = parseInt(btn.getAttribute("data-num"), 10);
    if (btnNum === num) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  // Populate panel content
  panelTitle.textContent = item.title;
  panelBullets.innerHTML = "";

  item.bullets.forEach((bulletText) => {
    const li = document.createElement("li");
    li.textContent = bulletText;
    panelBullets.appendChild(li);
  });

  // Hide placeholder and show content
  panelPlaceholder.style.display = "none";
  panelContent.style.display = "block";
}

function buildHotspots(data) {
  checkImage.src = data.image;
  checkImage.alt = data.imageAlt;
  hotspotsData = data.hotspots;

  data.hotspots.forEach((h) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot";
    btn.style.left = `${h.xPct}%`;
    btn.style.top = `${h.yPct}%`;
    btn.setAttribute("data-num", h.num);
    btn.setAttribute("aria-label", `Show explanation for number ${h.num}`);
    btn.innerHTML = `<span>+</span>`;
    btn.addEventListener("click", () => showDetails(h.num));
    stage.appendChild(btn);
  });
}

async function init() {
  const res = await fetch("./data/hotspots.json");
  const data = await res.json();
  buildHotspots(data);
}

init();
