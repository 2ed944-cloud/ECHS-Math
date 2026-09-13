(() => {
  const buttons = [...document.querySelectorAll("[data-tab]")];
  const panels = [...document.querySelectorAll(".panel")];
  function show(id) {
    buttons.forEach(b => b.classList.toggle("active", b.dataset.tab === id));
    panels.forEach(p => p.classList.toggle("active", p.id === id));
    history.replaceState(null, "", "#" + id);
  }
  buttons.forEach(b => b.addEventListener("click", () => show(b.dataset.tab)));
  const initial = location.hash.slice(1);
  if (panels.some(p => p.id === initial)) show(initial);
})();
