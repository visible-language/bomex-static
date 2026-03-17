function setPanelState(button, panel, isOpen) {
  button.classList.toggle("active", isOpen);
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
  if (!panel) return;

  panel.classList.toggle("panel--open", isOpen);
  if (isOpen) {
    panel.style.maxHeight = panel.scrollHeight + "px";
  } else {
    panel.style.maxHeight = "0px";
  }
}

function initializeBubblesAccordions(root) {
  var bubblesAccordionRoot = root || document.querySelector(".graph-info");
  if (!bubblesAccordionRoot) return;

  var acc = bubblesAccordionRoot.querySelectorAll("button.accordion");
  for (var i = 0; i < acc.length; i++) {
    var button = acc[i];
    if (button.getAttribute("data-bubbles-accordion") === "1") continue;
    button.setAttribute("data-bubbles-accordion", "1");

    var panel = button.nextElementSibling;
    setPanelState(button, panel, false);

    button.addEventListener("click", function() {
      var nextPanel = this.nextElementSibling;
      var isOpen = this.getAttribute("aria-expanded") === "true";
      setPanelState(this, nextPanel, !isOpen);
    });
  }
}

window.initializeBubblesAccordions = initializeBubblesAccordions;
initializeBubblesAccordions();
