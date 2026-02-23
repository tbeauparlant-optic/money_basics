const stage = document.getElementById("stage");
const checkImage = document.getElementById("checkImage");
const backdrop = document.getElementById("backdrop");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const closeBtn = document.getElementById("closeBtn");

function openModal(item) {
  modalTitle.textContent = item.title || `Item ${item.num}`;
  modalText.textContent = item.text || "";
  backdrop.style.display = "flex";
  closeBtn.focus();
}

function closeModal() {
  backdrop.style.display = "none";
}

function buildHotspots(data) {
  checkImage.src = data.image;
  checkImage.alt = data.imageAlt;

  data.hotspots.forEach((h) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hotspot";
    btn.style.left = `${h.xPct}%`;
    btn.style.top = `${h.yPct}%`;
    btn.setAttribute("aria-label", `Open explanation for number ${h.num}`);
    btn.innerHTML = `<span>${h.num}</span>`;
    btn.addEventListener("click", () => openModal(h));
    stage.appendChild(btn);
  });
}

async function init() {
  const res = await fetch("./data/hotspots.json");
  const data = await res.json();
  buildHotspots(data);
}

closeBtn.addEventListener("click", closeModal);
backdrop.addEventListener("click", (e) => {
  if (e.target === backdrop) closeModal();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && backdrop.style.display === "flex") closeModal();
});

init();
