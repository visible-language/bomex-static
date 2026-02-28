;(function () {
const similarNs = window.SimilarVerseWidget || (window.SimilarVerseWidget = {});

let initComplete = false;
let initRoot = null;
let inputKeypressHandler = null;
let submitClickHandler = null;
let coverClickHandler = null;
let closeClickHandler = null;

function getScopeRoot() {
    return similarNs.root || document;
}

function byId(id) {
    return getScopeRoot().getElementById ? getScopeRoot().getElementById(id) : getScopeRoot().querySelector('#' + id);
}

function getSearchParams() {
    return new URLSearchParams(window.location.search);
}

function getWidgetOptions() {
    const params = getSearchParams();
    const options = window.SimilarVerseWidgetOptions || {};
    const merged = { ...options };
    if (merged.reference === undefined) {
        merged.reference = params.get('reference') || '';
    }
    return merged;
}

function helpAppear() {
    const help = byId('faq-holder');
    const background = byId('cover');
    if (help) help.style.visibility = "visible";
    if (background) background.style.visibility = "visible";
}

function helpDisappear() {
    const help = byId('faq-holder');
    const background = byId('cover');
    if (help) help.style.visibility = "hidden";
    if (background) background.style.visibility = "hidden";
}

function validateInput(rawInput) {
    let text = String(rawInput || '').trim();
    text = text.toLowerCase();
    text = text.replaceAll(';', ':');
    text = text.replaceAll('.', '');
    text = text.replace(/\s\s+/g, ' ');
    return text;
}

function createTab(idx) {
    const verseText = idx2txt[idx] || '';
    const reference = idx2ref[idx] || '';
    return `<button class="accordion">${reference}</button>
            <div class="panel">
            <p>${verseText}</p>
            </div>`;
}

function accordionEventListeners() {
    const acc = getScopeRoot().querySelectorAll(".accordion");
    for (let i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active");
            const panel = this.nextElementSibling;
            if (!panel) return;
            panel.style.display = (panel.style.display === "block") ? "none" : "block";
        });
    }
}

function buttonFunction() {
    const input = byId('ref');
    const verseSpot = byId("verse");
    const resultArea = byId("result-list");
    if (!input || !verseSpot || !resultArea) return;

    const ref = validateInput(input.value);
    if (!Object.prototype.hasOwnProperty.call(ref2idx, ref)) return;

    verseSpot.innerHTML = '<p>' + (idx2txt[ref2idx[ref]] || '') + '</p>';

    const nNeighbors = neighbors[ref2idx[ref]] || [];
    let html = '';
    for (let i = 0; i < nNeighbors.length; i++) {
        html += createTab(nNeighbors[i]);
    }
    resultArea.innerHTML = html;
    accordionEventListeners();
}

function applyInitialReference() {
    const options = getWidgetOptions();
    const input = byId("ref");
    if (!input || !options.reference) return;
    input.value = String(options.reference);
    buttonFunction();
}

function initializeSimilarVerseWidget() {
    const widget = byId('widget');
    if (!widget) return;
    const currentRoot = widget.closest('.vl-similarverse-root') || document.body;
    if (initComplete && initRoot === currentRoot) return;
    initComplete = true;
    initRoot = currentRoot;

    const input = byId("ref");
    const submit = byId("submit");
    const cover = byId("cover");
    const close = byId("faq-close");

    if (input) {
        inputKeypressHandler = function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                buttonFunction();
            }
        };
        input.addEventListener("keypress", inputKeypressHandler);
    }

    if (submit) {
        submitClickHandler = function() { buttonFunction(); };
        submit.addEventListener('click', submitClickHandler);
    }

    if (cover) {
        coverClickHandler = function() { helpDisappear(); };
        cover.addEventListener('click', coverClickHandler);
    }

    if (close) {
        closeClickHandler = function() { helpDisappear(); };
        close.addEventListener('click', closeClickHandler);
    }

    accordionEventListeners();
    applyInitialReference();
}

function destroySimilarVerseWidget() {
    const input = byId("ref");
    if (input && inputKeypressHandler) {
        input.removeEventListener("keypress", inputKeypressHandler);
    }
    inputKeypressHandler = null;

    const submit = byId("submit");
    if (submit && submitClickHandler) {
        submit.removeEventListener('click', submitClickHandler);
    }
    submitClickHandler = null;

    const cover = byId("cover");
    if (cover && coverClickHandler) {
        cover.removeEventListener('click', coverClickHandler);
    }
    coverClickHandler = null;

    const close = byId("faq-close");
    if (close && closeClickHandler) {
        close.removeEventListener('click', closeClickHandler);
    }
    closeClickHandler = null;

    initComplete = false;
    initRoot = null;
}

window.SimilarVerseWidgetApi = {
    init: initializeSimilarVerseWidget,
    destroy: destroySimilarVerseWidget,
    resize: function() {},
    setOptions: function(options) {
        window.SimilarVerseWidgetOptions = { ...(window.SimilarVerseWidgetOptions || {}), ...(options || {}) };
        applyInitialReference();
    },
    openHelp: helpAppear,
    closeHelp: helpDisappear,
    submit: buttonFunction
};
similarNs.api = window.SimilarVerseWidgetApi;

if (document.readyState === 'complete') {
    initializeSimilarVerseWidget();
} else {
    window.addEventListener('load', initializeSimilarVerseWidget);
}
})();
