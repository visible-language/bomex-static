;(function () {
const connectionsNs = window.ConnectionsWidget || (window.ConnectionsWidget = {});
// some local data for display
var imageFiles = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma2', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon2', 'Ammoron', 'Amulek', 'Angels', 'AntiNephiLehi', 'Antionah', 'Benjamin', 'BrotherJared', 'BrothersNephi', 'CaptainMoroni', 'Chemish', 'Christ', 'ChristAmerica', 'DaughterJared', 'Enos', 'Ether', 'FatherLamoni', 'Gid', 'Giddianhi', 'Giddonah', 'Giddonah2', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman2', 'Isaiah', 'Jacob', 'Jacob2', 'Jared', 'Jared2', 'Jarom', 'JohnBaptist', 'Joseph', 'Joseph2', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman2', 'Lamoni', 'Lehi', 'Lehi2', 'Lehi3', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi2', 'Nephihah', 'Noah', 'Omni', 'Pahoran', 'SamuelLamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']
const idNames = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma2', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon2', 'Ammoron', 'Amulek', 'Angels', 'AntiNephiLehi', 'Antionah', 'Benjamin', 'BrotherJared', 'BrothersNephi', 'CaptainMoroni', 'Chemish', 'ChristAmerica', 'DaughterJared', 'Enos', 'Ether', 'FatherLamoni', 'Gid', 'Giddianhi', 'Giddonah', 'Giddonah2', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman2', 'Isaiah', 'Jacob', 'Jacob2', 'Jared', 'Jared2', 'Jarom', 'JohnBaptist', 'Joseph', 'Joseph2', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman2', 'Lamoni', 'Lehi', 'Lehi2', 'Lehi3', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi2', 'Nephihah', 'Noah', 'Omni', 'Pahoran', 'SamuelLamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']
const displayNames = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma the Younger', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon the Mulekite', 'Ammoron', 'Amulek', 'Angels', 'Anti-Nephi-Lehi', 'Antionah', 'Benjamin', 'Brother of Jared', 'Brothers of Nephi', 'Captain Moroni', 'Chemish', 'Christ in America', 'Daughter of Jared', 'Enos', 'Ether', 'Father of Lamoni', 'Gid', 'Giddianhi', 'Giddonah the Priest', 'Giddonah Father of Amulek', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman, Son of Helaman', 'Isaiah', 'Jacob, Son of Lehi', 'Jacob, Son of Isaac', 'Jared', 'Jared, Son of Omer', 'Jarom', 'John the Baptist', 'Joseph in Egypt', 'Joseph', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman the Nephite Spy', 'Lamoni', 'Lehi', 'Lehi, Son of Helaman', 'Lehi, Son of Zoram', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi, Son of Helaman', 'Nephihah', 'King Noah', 'Omni', 'Pahoran', 'Samuel the Lamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']

function getDisplayName(idName) {
    return displayNames[idNames.indexOf(idName)];
}

let langCXForSVG = []
let relCXForSVG = []
let linesData = [];
let iconsData = [];
let svgLangLines = [];
let svgRelLines = [];
const DEFAULT_SPEAKER = "Nephi";
const CONNECTIONS_DEFAULT_OPTIONS = {
    speaker: '',
    allowSpeakerSelect: true
};
const INITIAL_CONNECTIONS_STATE = {
    speaker: DEFAULT_SPEAKER,
    typeLines: ["Language", "Family", "Associate", "Enemy", "Divine"]
};
let connectionsInitComplete = false;
let connectionsInitRoot = null;
let connectionsBoundRoot = null;
let connectionsSpeakerSelectHandler = null;
let connectionsLegendClickHandlers = [];
let mainImageLoadToken = 0;
let mainImageRetryTimer = null;

// set current speaker
let state = { ...INITIAL_CONNECTIONS_STATE };
let path = location.pathname.split("/");

function getSearchParams() {
    return new URLSearchParams(window.location.search);
}

function getConnectionsOptions() {
    const params = getSearchParams();
    const options = (window.ConnectionsWidgetOptions || {});
    const merged = { ...CONNECTIONS_DEFAULT_OPTIONS, ...options };
    if (options.speaker === undefined) {
        merged.speaker = params.get('speaker') || '';
    }
    if (typeof merged.allowSpeakerSelect !== 'boolean') {
        const paramAllow = params.get('allowSpeakerSelect');
        if (paramAllow !== null) {
            merged.allowSpeakerSelect = String(paramAllow) !== '0';
        } else {
            merged.allowSpeakerSelect = String(merged.allowSpeakerSelect) !== '0';
        }
    }
    return merged;
}

function normalizeSpeakerParam(list, raw) {
    if (!raw) return null;
    const value = String(raw).trim();
    if (!value) return null;
    const direct = list.find(name => name === value);
    if (direct) return direct;
    const lower = value.toLowerCase();
    const ci = list.find(name => String(name).toLowerCase() === lower);
    return ci || null;
}

function resolveInitialSpeaker() {
    const paramSpeaker = normalizeSpeakerParam(imageFiles, getConnectionsOptions().speaker);
    const pathSpeaker = normalizeSpeakerParam(imageFiles, path[3]);
    return paramSpeaker || pathSpeaker || DEFAULT_SPEAKER;
}

function resetConnectionsState() {
    state = { ...INITIAL_CONNECTIONS_STATE, speaker: resolveInitialSpeaker() };
}

resetConnectionsState();
function updateSpeakerSelect(value) {
    const selectEl = document.getElementById("speaker-names");
    if (selectEl) {
        selectEl.value = value;
    }
}
function syncLegendChecks() {
    const options = ["family", "associate", "enemy", "divine"];
    for (let i = 0; i < options.length; i++) {
        const key = options[i];
        const el = document.getElementById("check-" + key);
        if (!el) continue;
        const typeName = key.charAt(0).toUpperCase() + key.slice(1);
        const enabled = state.typeLines.includes(typeName);
        el.classList.toggle('unchecked', !enabled);
    }
}


const horzGap = 67;     // Spacing in between each icon
const initOffset = 20;  // "left padding" to add to first icon's x-coord
const lineStartY = 210; // Y-coord to start drawing line arcs at. Counted from top.

let xCoorMap = new Map();
let j_index = 0;
function makeCoordinates() {
    // assemble array of icons: selected speaker and all relations
    iconsData = [state.speaker]; 
    for (let rel of relationshipData.find(a => a.name == state.speaker).relations) {
        iconsData.push(rel.name)
    }

    // make map of icons to icon x-coords
    xCoorMap = new Map();
    j_index = 0;
    for (let name of iconsData) {
        xCoorMap.set(name, j_index * horzGap + initOffset);
        j_index++;
    }
}

// find the name's image in the widget's image folder
function getImageLink(name) {
    const assetBase = window.ConnectionsWidgetAssetBase || '.';
    const imageBase = new URL('../../Images/', `${assetBase}/`).toString();
    return new URL(`${name}.jpg`, imageBase).toString();
}

function getImageLinkWithCacheBust(name, bustValue) {
    const url = new URL(getImageLink(name));
    if (bustValue) {
        url.searchParams.set('_', String(bustValue));
    }
    return url.toString();
}

function clearMainImageRetryTimer() {
    if (mainImageRetryTimer) {
        clearTimeout(mainImageRetryTimer);
        mainImageRetryTimer = null;
    }
}

function setMainImageForSpeaker(speakerId) {
    const imageEl = document.getElementById('main-image');
    if (!imageEl) return;
    const displayName = getDisplayName(speakerId) || speakerId;
    imageEl.alt = `Portrait of ${displayName}`;

    const token = ++mainImageLoadToken;
    clearMainImageRetryTimer();
    const maxAttempts = 2;

    function applyLoadedSource(src) {
        if (token !== mainImageLoadToken) return;
        const target = document.getElementById('main-image');
        if (!target) return;
        target.style.visibility = 'visible';
        // Force a repaint reload when src is identical but previous decode stalled.
        if (target.getAttribute('src') === src) {
            target.removeAttribute('src');
            requestAnimationFrame(function() {
                if (token !== mainImageLoadToken) return;
                const reTarget = document.getElementById('main-image');
                if (reTarget) reTarget.setAttribute('src', src);
            });
            return;
        }
        target.setAttribute('src', src);
    }

    function attemptLoad(attempt) {
        if (token !== mainImageLoadToken) return;
        const src = getImageLinkWithCacheBust(
            speakerId,
            attempt > 0 ? `${Date.now()}-${attempt}` : ''
        );
        const probe = new Image();
        let settled = false;

        function failOver() {
            if (settled) return;
            settled = true;
            if (attempt < maxAttempts) {
                attemptLoad(attempt + 1);
                return;
            }
            if (token !== mainImageLoadToken) return;
            const target = document.getElementById('main-image');
            if (target) {
                // Final fallback: apply source directly with bust to avoid stale cache edge-cases.
                target.setAttribute('src', getImageLinkWithCacheBust(speakerId, Date.now()));
                target.style.visibility = 'visible';
            }
            console.warn('Connections main-image required fallback load for speaker:', speakerId);
        }

        mainImageRetryTimer = setTimeout(failOver, 1800);

        probe.onload = function() {
            if (settled) return;
            settled = true;
            clearMainImageRetryTimer();
            applyLoadedSource(src);
        };

        probe.onerror = failOver;
        probe.src = src;
    }

    attemptLoad(0);
}

// Use the state to update the upper right corner with the current speaker
function updateMainInfo() {
    let name = document.getElementById('main-name')
    name.innerHTML = getDisplayName(state.speaker)

    setMainImageForSpeaker(state.speaker);
}

// Selects a new speaker and re-renders graphics. Used by icon click and html dropdown.
function updateSpeaker(speaker) {
    updateSpeakerSelect(speaker);
    if (!(speaker == "Godhead" || speaker == "Satan")) {
        // store speaker name in state 
        state.speaker = speaker;

        // update overhead banner with new speaker
        updateMainInfo();

        // prepare to render
        makeCoordinates();
    
        // render icons
        createIcons();
    
        // render lines
        convertDataForSVGLines();
        drawLines();
        
        // update bottom boxes 
        updateInfoBoxes();
    }
}

// Using the coordinate map made in makeCoordinates(), make a list of start- and endpoints
function convertDataForSVGLines() {
    linesData = [];
    let startX, stopX;

    // find the current speaker
    let speakerObj = relationshipData.find(a => a.name == state.speaker);

    // Social Connections
    // Every line starts at the speaker and ends at an icon
    startX = xCoorMap.get(speakerObj.name); 
    for (let rel of speakerObj.relations) {
        stopX = xCoorMap.get(rel.name);
        linesData.push({startX: startX, stopX: stopX, type: rel.type})
    }

    // Language Connections
    // Deprecated; does not push to any array for rendering
    // stopX = xCoorMap.get(speakerObj.name);
}

function createConnectionsDiagram() {
    // create lines
    drawLines();

    // create icons
    createIcons();
}

// Renders icons
function createIcons() {
    // Create d3 selection and wipe past icons
    let svg = d3.select("#speaker-icons")
    svg.selectAll('.icon').remove()
    let icons = svg.selectAll('.icon')

    // Make icon divs and name captions
    icons.data(iconsData)   // iconsData: list of all needed speaker names
        .enter()
        .append('div')
            .attr('class', 'icon')
            .style('left', function(d) { return xCoorMap.get(d) + 'px'})
            .on('click', (c, d) => updateSpeaker(d))
            .append('div')
                .attr('class', 'icon-name')
                .html(function(d) { return getDisplayName(d); })
    
    // put images in icon divs
    svg.selectAll('.icon')
        .append('div')
            .attr('class', 'img-cont')
                .append('img')
                .attr('src', function(d) { return getImageLink(d); })
}

// Render lines in the <svg> tag according to coordinate data calculated
function drawLines() {
    // Create d3 selection and wipe past lines
    let svg = d3.select("#svg-connections")

    svg.selectAll('.line').remove()

    let lines = svg.selectAll('.line')

    lines.data(linesData)   // linesData: array of objs with start- and endpoints
        .enter()
        .append('path')
            .attr('class', function(d) { return getLineClass(d.type, 'animate')}) // animates
            .attr('d', function(d) { return getLinePath(d); })
}

// Draw lines again, w/o new animations. Used when new relation type is checked by user.
function updateLines() {
    let svg = d3.select("#svg-connections")
    let lines = svg.selectAll('.line')
    lines.data(linesData)
        .attr('class', function(d) { return getLineClass(d.type, '')})  // doesn't animate
        .attr("stroke-dasharray", 0 )
        .attr("stroke-dashoffset", 0 )
}

// Quarter circumference plus 20, calculated from x1 (left end of arc) and x2 (right end of arc)
function getArcLength(x1, x2) {
    let r = Math.abs(x2 - x1);
    return r * 3.14 / 2 + 20
}

// Generates "d" attribute used by SVG <path> elements to draw lines.
// obj = one of the objects stored in the linesData array.
// M = moveto (move from one point to another point)
// A = elliptical Arc (create a elliptical arc)
//
function getLinePath(obj) {
    const fineTuneX = 7;
    let start = obj.startX + initOffset + fineTuneX;
    let stop = obj.stopX + initOffset + fineTuneX;
    let top = (stop > start) ? 1 : 0;
    let y = lineStartY;
    let ratio = 1 + Math.abs(stop - start) / 450
    return "M " + start + " " + y + " A " + ratio + " 1 0 0 " + top + " " + stop + " " + y;
}

// Returns CSS classes of a line given 1) its relationship type in the database and 2) whether or not to animate it
function getLineClass(type, animate) {
    if (!state.typeLines.includes(type)) return "line unselected " + animate;
    if (type == "Language") return "line " + animate;
    if (type == "Family") return "line family " + animate;
    if (type == "Associate") return "line associate " + animate;
    if (type == "Enemy") return "line enemy " + animate;
    if (type == "Divine") return "line divine " + animate;
    return "line" + animate;
}

// Update the boxes in the bottom 
function updateInfoBoxes() {
    updateRelationshipInfoBox();
}

// Populates the info box with expandable information bars on each connection
function updateRelationshipInfoBox() {
    const box = document.getElementById('social');
    box.innerHTML = "";
    const current = relationshipData.find(obj => obj.name == state.speaker);    // gets speaker name

    const typelist = ["Family", "Associate", "Divine", "Enemy"];
    // We want to sort by type  
  
    // for each speaker that the current speaker has a relation to, add an expandable to the selected box
   for (let reltype of typelist) {
     for (let obj of current.relations) {
        if (!imageFiles.includes(obj.name)) continue;   // safety against unimplemented speakers
        if (obj.type != reltype) continue;  // not the type we're looking for
        let icon = createSmallIcon('rel', obj.name, obj.connection, obj.type);    
        box.append(icon);
    }
  }
}

// Returns HTML for a brand new expandable list element of a connection,
// given the name of the connected (not the selected) speaker and some descriptive text.
function createSmallIcon(type, speaker, connection, relationship) {
    // Create parent
    let icon = document.createElement('div');
    icon.setAttribute('class', 'icon-small');
    icon.setAttribute('id', type + "-col-" + speaker);

    // name for header
    let speakerName = document.createElement('div');
    speakerName.setAttribute('class', 'name');
    speakerName.innerHTML = getDisplayName(speaker);

    // image for header
    let imgBox = document.createElement('div');
    imgBox.setAttribute('class', 'img-cont-small');
    let img = document.createElement('img');
    img.setAttribute('src', getImageLink(speaker));
    imgBox.appendChild(img);

    // bundle image and name together, with a color based on the relationship
    let imageAndName = document.createElement('div');
    imageAndName.setAttribute('class', 'icon-small-speaker ' + relationship.toLowerCase());
    imageAndName.appendChild(imgBox);
    imageAndName.appendChild(speakerName);

    // a "v" that flips when header is clicked
    let collapseIcon = document.createElement('div');
    collapseIcon.setAttribute('class', 'small-collapse');
    collapseIcon.innerHTML = "v";

    // bundle the image/name and v into one (clickable) header bar
    let header = document.createElement('div');
    header.setAttribute('class', 'header color-key');
    header.appendChild(imageAndName);
    header.appendChild(collapseIcon);
    header.addEventListener('click', function() {
        expandSmallIcon(type + "-col-" + speaker);
    });
  

    // descriptive dropdown
    let content = document.createElement('div');
    content.setAttribute('class', 'content'); 
    content.innerHTML = connection;

    // assemble and return
    icon.appendChild(header);
    icon.appendChild(content);

    return icon;
}

// Expansion function referred to by small icons' onclick attribute. Uses CSS to hide children
function expandSmallIcon(id) {
    let icon = document.getElementById(id);

    if (icon.classList.contains('icon-small-expanded')) {
        // collapse
        icon.classList.remove('icon-small-expanded');
    } else {
        // expand
        icon.classList.add('icon-small-expanded');
    }
}


function collapseLegend() {
    let descriptionContainer = document.getElementById('description-container');
    let bottomBar = document.getElementById('legend-collapse');
    let legend = document.getElementById('legend');

    if (descriptionContainer.style.display == ""||descriptionContainer.style.display == "none") {
        // is collapsed -> not collapsed
        bottomBar.innerHTML = "Less";
        bottomBar.classList.add('round-bottom');
        legend.classList.add('round-bottom');
        descriptionContainer.style.display = "block";
    } else {
        // is not collapsed ->  collapsed
        bottomBar.innerHTML = "More";
        bottomBar.classList.remove('round-bottom');
        legend.classList.remove('round-bottom');
        descriptionContainer.style.display = "none";
    }
}

// When a relationship type's checkbox is clicked, turn its associated lines on or off.
// There are 4 checkboxes, with IDs "check-[relationship type]" 
function check(option) {
    let id = "check-" + option.toLowerCase();
    let index = state.typeLines.indexOf(option);

    // If the given type isn't in the array of types, add it to the array and check its box
    if (index == -1) {
        state.typeLines.push(option)
        document.getElementById(id).classList.remove('unchecked')
    }
    // If it is in the array of types, turn it off by removing its type from the array and unchecking the box
    else {
        state.typeLines.splice(index, 1);
        document.getElementById(id).classList.add('unchecked')
    }

    updateLines();
}

function applyControlVisibility() {
    const options = getConnectionsOptions();
    const speakerSelect = document.querySelector('.speaker-select');
    const speakerDropdown = document.getElementById('speaker-names');
    if (speakerDropdown) {
        speakerDropdown.disabled = !options.allowSpeakerSelect;
    }
    if (speakerSelect && !options.allowSpeakerSelect) {
        speakerSelect.style.display = 'none';
    } else if (speakerSelect) {
        speakerSelect.style.display = '';
    }
}

function bindConnectionsEvents() {
    const root = connectionsInitRoot || document;
    connectionsBoundRoot = root;
    const speakerSelect = root.querySelector('#speaker-names');
    if (speakerSelect) {
        connectionsSpeakerSelectHandler = function() {
            updateSpeaker(this.value);
        };
        speakerSelect.addEventListener('change', connectionsSpeakerSelectHandler);
    }

    const legendKeys = root.querySelectorAll('.color-key[data-option]');
    connectionsLegendClickHandlers = [];
    legendKeys.forEach((el) => {
        const handler = function() {
            const option = this.getAttribute('data-option');
            if (option) check(option);
        };
        connectionsLegendClickHandlers.push({ el: el, handler: handler });
        el.addEventListener('click', handler);
    });
}

function unbindConnectionsEvents() {
    if (!connectionsBoundRoot) return;
    const speakerSelect = connectionsBoundRoot.querySelector('#speaker-names');
    if (speakerSelect && connectionsSpeakerSelectHandler) {
        speakerSelect.removeEventListener('change', connectionsSpeakerSelectHandler);
    }
    for (let i = 0; i < connectionsLegendClickHandlers.length; i++) {
        const item = connectionsLegendClickHandlers[i];
        if (item && item.el && item.handler) {
            item.el.removeEventListener('click', item.handler);
        }
    }
    connectionsBoundRoot = null;
    connectionsSpeakerSelectHandler = null;
    connectionsLegendClickHandlers = [];
}

function rerenderConnectionsWidget() {
    makeCoordinates();
    convertDataForSVGLines();
    updateSpeakerSelect(state.speaker);
    updateMainInfo();
    syncLegendChecks();
    createConnectionsDiagram();
    updateInfoBoxes();
}

function initializeConnectionsWidget() {
    const social = document.getElementById('social');
    if (!social) return;
    const currentRoot = social.closest('.vl-connections-root') || document.body;
    if (connectionsInitComplete && connectionsInitRoot === currentRoot) return;
    connectionsInitComplete = true;
    connectionsInitRoot = currentRoot;
    resetConnectionsState();

    const options = getConnectionsOptions();
    const requested = normalizeSpeakerParam(imageFiles, options.speaker);
    if (requested) {
        state.speaker = requested;
    }

    bindConnectionsEvents();
    applyControlVisibility();
    rerenderConnectionsWidget();
}

function destroyConnectionsWidget() {
    ++mainImageLoadToken;
    clearMainImageRetryTimer();
    unbindConnectionsEvents();
    resetConnectionsState();
    connectionsInitComplete = false;
    connectionsInitRoot = null;
}

window.ConnectionsWidgetApi = {
    init: initializeConnectionsWidget,
    destroy: destroyConnectionsWidget,
    resize: function() {},
    setOptions: function(options) {
        window.ConnectionsWidgetOptions = { ...(window.ConnectionsWidgetOptions || {}), ...(options || {}) };
        const merged = getConnectionsOptions();
        const requested = normalizeSpeakerParam(imageFiles, merged.speaker);
        if (requested && requested !== state.speaker) {
            state.speaker = requested;
            if (connectionsInitComplete) {
                rerenderConnectionsWidget();
            }
        }
        applyControlVisibility();
    }
};
connectionsNs.api = window.ConnectionsWidgetApi;

if (document.readyState === 'complete') {
    initializeConnectionsWidget();
} else {
    window.addEventListener('load', initializeConnectionsWidget);
}
})();
