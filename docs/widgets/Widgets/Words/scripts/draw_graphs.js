/*
 © Copyright 2021 Visiblelanguage
*/

/*
This javascript file is linked to packedbubbles.html and controls the drawing of the packed
bubble charts. The javascript to draw the tree charts is found in the treecharts.html file, not
a separate js file. I intended to separate it from the html, but never reached that point.
*/

;(function () {
const bubblesNs = window.BubblesWidget || (window.BubblesWidget = {});
const idNames = bubblesNs.idNames || [];
const idNameToDisplayName = bubblesNs.idNameToDisplayName || function(idName) { return idName; };

// Initialization of Bubbles app state, including query parameter extraction
const INITIAL_BUBBLES_STATE = {
    currentDataSet: "nephi1",
    currentChartType: "content",
    currentChartData: {},
    isDrillDown: false,
    currentFilteredData: {},
    isFiltered: false,
    isInitialized: false,
    currentSpeakerData: {},
    type: 'all',
    loaded: false,
    _resizeTimer: null,
    _rerenderTimer: null
};
let state = { ...INITIAL_BUBBLES_STATE };

function resetBubblesState() {
    state = { ...INITIAL_BUBBLES_STATE };
}
const urlParams = new URLSearchParams(window.location.search);
const DEFAULT_SPEAKER = "nephi1";
const BUBBLES_DEFAULT_OPTIONS = {
    speaker: '',
    allowSpeakerSelect: true,
    shellManagedResize: false
};
let bubblesInitComplete = false;
let bubblesInitRoot = null;
let wordmaxKeypressHandler = null;
let uniqueButtonClickHandler = null;

function getBubblesOptions() {
    const params = getSearchParams();
    const options = (window.BubblesWidgetOptions || {});
    const merged = { ...BUBBLES_DEFAULT_OPTIONS, ...options };
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

function getSearchParams() {
    return new URLSearchParams(window.location.search);
}

// Get speaker
function getSpeaker() {
    const options = getBubblesOptions();
    const params = getSearchParams();
    const requestedSpeaker = options.speaker || params.get('speaker');
    if (requestedSpeaker) {
        const paramSpeaker = requestedSpeaker.charAt(0).toLowerCase() + requestedSpeaker.slice(1);
        if (idNames.includes(paramSpeaker)) {
            state.currentDataSet = paramSpeaker;
            console.log("Successfully retrieved speaker from parameters");
            loadNewDataset(paramSpeaker);
            return;
        }
    } else {
        console.log("No URL parameter for speaker. Default to Nephi.");
    }
    state.currentDataSet = DEFAULT_SPEAKER;
    loadNewDataset(state.currentDataSet);
}


// Get word. If no word, stay on default.
const paramWord = urlParams.get("word");

const INITIAL_FILTER = {
    uniqueFilter: "All" // other options "Unique"
};
let filter = { ...INITIAL_FILTER };

function resetBubblesFilter() {
    filter = { ...INITIAL_FILTER };
}

const chartId = '#graph-display';

function fillDropDown() {
    let dropdown = document.getElementById('dropdown');
    if (!dropdown) return;

    while (dropdown.options.length > 1) {
        dropdown.remove(1);
    }

    for (id of idNames) {
        let option = document.createElement('option');
        option.setAttribute('value', id);
        option.innerHTML = idNameToDisplayName(id);
        dropdown.appendChild(option);
    }
    
    dropdown.value = state.currentDataSet; // dropdown should default to speaker
}

const updateTypeRadios = (el) => {
    state.type = el.value;
    
    setFilteredChartContent();
}

const isOverflown = ({ offsetWidth }, textWidth) => textWidth > offsetWidth - 20;

const resizeText = ({ 
    element, 
    elements, 
    minSize = 0.45, 
    maxSize = 2, 
    step = 0.1, 
    unit = 'rem' 
}) => {
  (elements || [element]).forEach(el => {
    let i = minSize
    let overflow = false

    const parent = el.parentNode

    while (!overflow && i < maxSize) {
        el.style.fontSize = `${i}${unit}`;
        let textWidth = el.offsetWidth;
        overflow = isOverflown(parent, textWidth)

      if (!overflow) i += step
    }

    el.style.fontSize = `${i - step}${unit}`
  })
}


// changes "My Class" to "my-class"
function getClassName(name) {
    const val = name.toLowerCase();
    const content = ["noun", "verb", "adjective", "adverb"];
    
    if(content.includes(val)){
        return 'noun';
    } else {
        return 'verb';
    }
}

function clearChart() {
    const chart = d3.selectAll(`${chartId} > *`);
    
    if(chart) {
        chart.remove();   
    }
}

function resetUISettings() {
    state = {
        ...state,
        isDrillDown: false,
        currentFilteredData: {},
        isFiltered: false,
    }
}

function showText(text, fontSize, y = 0, radius = 0) {
    const textWidth = getTextWidth(fontSize, String(text), 10);
    const textAnchor = getTextHeight(fontSize, String(text)) / 2;
    
    return textWidth < (getInnerCircleDistance(radius, y + textAnchor) * 80);
}

function onClick(event, data) {
    if (Date.now() < (state._suppressClickUntil || 0)) return;

    if (state.isDrillDown) {
        exitDrillDown();
    } else {
        enterDrillDown(data);
    }
}

function exitDrillDown(){
    state.isDrillDown = !state.isDrillDown;
    renderChart(state.isFiltered ? state.currentFilteredData : state.currentChartData);
}

function enterDrillDown(data) {
    state.isDrillDown = !state.isDrillDown;
    renderChart({children: [{...data.data}]});
    addCloseButton();
}

function addCloseButton(){
    // Get the element you want to add your new element before or after
    var target = document.querySelector('#svg-graph');
    var div = document.createElement('div');
    
    // Add content to the new element
    div.innerHTML = 'X';
    div.classList.add('close-button');
    
    div.addEventListener('click', () => {
        exitDrillDown();
    })
    
    // Insert the element after our target element
    target.parentNode.insertBefore( div, target.nextSibling );
}

function updateSpeakerData(speaker) {
    // fetch JSON object from folder
    state.loaded = false;
    
    resetRadiosToPink();
    
    state.currentSpeakerData = getSpeakerDataJSON(speaker);
}

function resetRadiosToAll(){
    const el = document.getElementById('radio-all');
    
    el.checked = true;
    state.type = 'all';
}

function resetRadiosToPink(){
    const el = document.getElementById('radio-pink');
    
    el.checked = true;
    state.type = 'noun';
}

function resetRadiosToBlue(){
    const el = document.getElementById('radio-blue');
    
    el.checked = true;
    state.type = 'verb';
}

function renderChart(data = state.currentChartData) {
    const graphDisplay = document.getElementById('graph-display');
    if (!graphDisplay || !data || !data.children) return;

    if (state._simulation) {
        state._simulation.stop();
        state._simulation = null;
    }
    if (state._renderInterval) {
        state._renderInterval.stop();
        state._renderInterval = null;
    }

    clearChart();

    if (data.children.length == 0) return;
    const MAX_QUANTITY = 1000;

    // Change dataset depending on user parameters
    var dataArrayFinal = [];

    const wordMinEl = document.getElementById("wordmin");
    const wordMaxEl = document.getElementById("wordmax");
    var min = Number(wordMinEl ? wordMinEl.value : 0);
    var max = Number(wordMaxEl ? wordMaxEl.value : 100);
    
    if(max > 100) {
        max = 100;
    }

    if (min == undefined || min == null) { min = 0; }
    if (max == undefined || max == null) { max = 100; }

    if (max < min) {
        let temp = max;
        max = min;
        min = temp;
    } // swap to give the right top/bottom

    var limit = data.children.length;
    if (limit < max) { max = limit; }
    if (max - min > MAX_QUANTITY) { max = min + MAX_QUANTITY; }

    // update data array from user parameters    
    if (min > 0) {
        min -= 1;
    }
    for (let i = min; i < max; i++) {
        dataArrayFinal.push(data.children[i]);
    }
    
    // returns if filter makes length 0 - doesn't try to iterate through empty array
    if (dataArrayFinal.length == 0) return;

    if (!state.isInitialized) {
        state.isInitialized = true;
        const graphContainer = document.getElementById('graph-container');
        if (graphContainer) {
            graphContainer.classList.add('graph--initialized');
            graphContainer.classList.remove('graph--zero-state');
        }
    }
    
    const rect = graphDisplay ? graphDisplay.getBoundingClientRect() : { width: 900, height: 750 };
    const width = Math.max(320, Math.floor(rect.width || 900));
    const height = Math.max(320, Math.floor(rect.height || 750));
    const edgePadding = 12;

    const svg = d3.select(chartId).append('svg')
                    .attr("viewBox", `0 0 ${width} ${height}`)
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("class", "svg-graph")
                    .attr('style', '')
                    .attr('id', 'svg-graph')

    
    // Creates bubble pack instance
    const bubblePack = d3.pack()
                    .size([width, height])
                    .padding(0);
    
    // Constructs hierarchical data 
    const rootNode = d3.hierarchy({children: dataArrayFinal})
                    .sum(d => d.size)
                    .sort(() => null);

    // Creates bubble pack with data
    const nodes = bubblePack(rootNode);
    const packedNodes = nodes.children || [];

    // Uniformly scale bubble radii to increase space utilization in the rectangle.
    // Keep a conservative cap so labels remain readable and collisions remain stable.
    if (packedNodes.length) {
        const usableArea = Math.max(1, (width - edgePadding * 2) * (height - edgePadding * 2));
        let totalCircleArea = 0;
        for (let i = 0; i < packedNodes.length; i++) {
            totalCircleArea += Math.PI * packedNodes[i].r * packedNodes[i].r;
        }
        const targetFillRatio = 0.68;
        const rawScale = Math.sqrt((usableArea * targetFillRatio) / Math.max(1, totalCircleArea));
        const radiusScale = Math.max(0.85, Math.min(1.45, rawScale));
        for (let i = 0; i < packedNodes.length; i++) {
            packedNodes[i].r = packedNodes[i].r * radiusScale;
        }
    }

    if (packedNodes.length === 1) {
        const only = packedNodes[0];
        only.tx = width / 2;
        only.ty = height / 2;
        const maxRadius = Math.max(60, Math.floor((Math.min(width, height) / 2) - (edgePadding * 2)));
        only.r = Math.min(only.r, maxRadius);
    } else if (packedNodes.length) {
        const xExtent = d3.extent(packedNodes, (n) => n.x);
        const yExtent = d3.extent(packedNodes, (n) => n.y);
        const xSpan = Math.max(1, (xExtent[1] || 0) - (xExtent[0] || 0));
        const ySpan = Math.max(1, (yExtent[1] || 0) - (yExtent[0] || 0));
        const usableWidth = Math.max(1, width - edgePadding * 2);
        const usableHeight = Math.max(1, height - edgePadding * 2);

        for (let i = 0; i < packedNodes.length; i++) {
            const node = packedNodes[i];
            node.tx = edgePadding + ((node.x - xExtent[0]) / xSpan) * usableWidth;
            node.ty = edgePadding + ((node.y - yExtent[0]) / ySpan) * usableHeight;
        }
    }
    
    const currentNodes = packedNodes;
    
    var graph, circles, texts;
    let activePointer = null;

    const initializeNodes = () => {
        graph = svg.selectAll('g')
            .data(currentNodes)
            .enter()
            .append('g')
                .attr('class', 'bubble-element')
                .style('touch-action', 'none')
                .on('click', onClick)
                .on('pointerdown', pointerDown)
                .on('pointermove', pointerMove)
                .on('pointerup pointercancel', pointerUpOrCancel)
                .on('touchstart', preventTouchScrollOnBubble, { passive: false })
                .on('touchmove', preventTouchScrollOnBubble, { passive: false })
            ;

        circles = graph.append('circle')
            .attr('class', (d) => getClassName(d.data.partOfSpeech));
            
        texts = textContainerAppend(graph)
    }
      
    initializeNodes();
    
    function distanceBoundary(dim, rad, maxDim) {
        const min = rad + edgePadding;
        const max = maxDim - rad - edgePadding;

        if (max <= min) {
            return maxDim / 2;
        }

        if (dim > max) {
            return max;
        } else if (dim < min) {
            return min;
        } else {
            return dim;
        }        
    }

    function positionNodes() {
        circles
            .attr('r', (d) => d.r)
            .attr('cx', function(d) {
                return distanceBoundary((d.tx || d.x || width / 2), d.r, width);
            })
            .attr('cy', function(d) {
                return distanceBoundary((d.ty || d.y || height / 2), d.r, height);
            })
            
        texts
            .attr('transform', (d) => {
                const boxSize = state.isDrillDown ? (d.r * 2.2) : (d.r * 1.5);
                const x = distanceBoundary((d.tx || d.x || width / 2), d.r, width);
                const y = distanceBoundary((d.ty || d.y || height / 2), d.r, height);
                
                return `translate(${x - (boxSize / 2)}, ${y - (boxSize / 2)})`
            })
    }

    function viewportToSvg(clientX, clientY) {
        const svgEl = svg.node();
        if (!svgEl) return [width / 2, height / 2];
        const rect = svgEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return [width / 2, height / 2];
        const px = ((clientX - rect.left) / rect.width) * width;
        const py = ((clientY - rect.top) / rect.height) * height;
        return [px, py];
    }

    function updatePointerPosition(clientX, clientY, d) {
        if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
        const [px, py] = viewportToSvg(clientX, clientY);
        d.tx = distanceBoundary(px, d.r, width);
        d.ty = distanceBoundary(py, d.r, height);
        positionNodes();
    }

    function pointerDown(event, d) {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        activePointer = {
            id: event.pointerId,
            node: d,
            target: event.currentTarget,
            startX: event.clientX,
            startY: event.clientY,
            moved: false
        };
        if (event.currentTarget?.setPointerCapture) {
            event.currentTarget.setPointerCapture(event.pointerId);
        }
        updatePointerPosition(event.clientX, event.clientY, d);
        if (event.cancelable) event.preventDefault();
    }

    function pointerMove(event, d) {
        if (!activePointer) return;
        if (activePointer.id !== event.pointerId || activePointer.node !== d) return;

        if (!activePointer.moved && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
            const dx = event.clientX - activePointer.startX;
            const dy = event.clientY - activePointer.startY;
            if ((dx * dx) + (dy * dy) > 9) {
                activePointer.moved = true;
            }
        }

        updatePointerPosition(event.clientX, event.clientY, d);
        if (event.cancelable) event.preventDefault();
    }

    function pointerUpOrCancel(event, d) {
        if (!activePointer) return;
        if (activePointer.id !== event.pointerId || activePointer.node !== d) return;

        if (!activePointer.moved && event.type !== 'pointercancel') {
            // Some touch browsers suppress synthetic click after pointer handling;
            // open drilldown directly for tap/click-without-drag.
            onClick(event, d);
            state._suppressClickUntil = Date.now() + 250;
        } else if (activePointer.moved) {
            state._suppressClickUntil = Date.now() + 250;
        }
        if (event.currentTarget?.releasePointerCapture) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        activePointer = null;
    }

    function preventTouchScrollOnBubble(event) {
        if (event.cancelable) event.preventDefault();
    }

    positionNodes();
    state.loaded = true;
}

function rerenderCurrentChart() {
    if (!document.getElementById('graph-display')) return;
    if (!state.currentChartData || !state.currentChartData.children) return;
    if (state.isDrillDown) {
        return;
    }
    if (state.isFiltered) {
        setFilteredChartContent();
    } else {
        renderChart(state.currentChartData);
    }
}

function scheduleRerender(delayMs) {
    const delay = typeof delayMs === 'number' ? delayMs : 260;
    if (state._rerenderTimer) {
        clearTimeout(state._rerenderTimer);
    }
    state._rerenderTimer = setTimeout(() => {
        rerenderCurrentChart();
        state._rerenderTimer = null;
    }, delay);
}

function onBubblesResize() {
    if (state._resizeTimer) {
        clearTimeout(state._resizeTimer);
    }
    state._resizeTimer = setTimeout(() => {
        scheduleRerender(0);
    }, 280);
}

function textContainerAppend(graph){
    const getTextBoxSize = (d) => state.isDrillDown ? (d.r * 2.2) : (d.r * 1.5);
    const textContainer = graph.append('g')
        
    const text = textContainer.append('foreignObject')
        .attr("width", d => getTextBoxSize(d) + "px" )
        .attr("height", d => getTextBoxSize(d) + "px")
        .append("xhtml:div")
        .attr('text-anchor', 'middle')
        .attr('class', state.isDrillDown ? 'bubble-text--drilldown' : 'bubble-text')
        .attr('width', d => d.r * 1.25)
        .attr('height', d => d.r * 1.25)
        .html(d => {
            if (state.isDrillDown) {
                return displayDrillDownText(d);
            } else {
                return displayMainText(d);
            }
        });
        
    resizeText({
      elements: document.querySelectorAll('.bubble-text-item')
    })
    
    return textContainer;
}

function displayMainText(d) {
    const name = d.data?.name;
    const length = d.data?.name?.length;
    const size = d.data.size;
    
    let className = 'medium';
    
    const word = Number(d.r) > 25 ? `<p class="bubble-text-item ${className}">${name}</p>` : "";
    
    return `${word}<p>${size}</p>`;
}

function displayDrillDownText(d) {
    const name = d.data?.name;
    const text = d.data.sourceText;
    const ref = d.data.sourceReference;
    const numChar = Math.max(120, Math.min(900, Math.floor((d.r || 120) * 3.2)));
    const str = text.length > numChar ? text.substr(0, numChar) + "..." : text;

    return `<p class="bubble-title">${name}</p><p>${str}</p><p>- ${ref}</p>`;
}

function updateChartTitle() {
 //   const chartType = state.currentChartType[0].toUpperCase() + state.currentChartType.slice(1);
//    document.getElementById('graph-title').innerHTML = `${idNameToDisplayName(state.currentDataSet)}'s Words`;
    
    // update Image as well
    // const urlBase = 'PackedBubble/graphs/json/json'; // Online Server
    const assetBase = window.BubblesWidgetAssetBase || '.';
    const urlBase = `${assetBase}/images`;
    const imageString = new URL(`${urlBase}/${state.currentDataSet}.jpg`, window.location.href).toString();
    document.getElementById('speaker-image').setAttribute('src', imageString)
}

function updateStats() {
    document.getElementById('stat-1').innerHTML = String(state.currentSpeakerData.totalCount).replace(/\B(?=(\d{3})+(?!\d))/g, ","); // add thousand comma
    document.getElementById('stat-2').innerHTML = (state.currentSpeakerData.totalCount / 273275 * 100).toFixed(1) + "%"
    if (state.currentSpeakerData.totalCount / 273275 < .01) {
        document.getElementById('stat-2').innerHTML = "< 1%"
    }
    document.getElementById('stat-3').innerHTML = state.currentSpeakerData.rank + " of 83"
}

function updateUniqueButton(e){
    updateUnique();
}

function updateUnique(reset) {
    if (reset) {
        filter.uniqueFilter == 'Unique';
        document.getElementById('unique-button').click()
        updateUnique();
    }
    
    state.isDrillDown = false;
    let button = document.getElementById('unique-button');
    if (filter.uniqueFilter == "All") {
        // turning it on
        button.innerHTML = "Unique Words: On";
        filter.uniqueFilter = 'Unique' ;
        state.isFiltered = true;
    } else {
        // turning it off
        button.innerHTML = "Unique Words: Off"
        filter.uniqueFilter = 'All' 
        state.isFiltered = false;
    }

    goButton(event)
}

function createChart(dataset = state.currentDataSet) {
    try {
        resetUISettings();
        state.currentDataSet = dataset;
        state.currentChartData = getChartData(dataset, state.currentChartType);

        // Sort the data array by size so that it selects the correct words to render
        state.currentChartData.children.sort((a,b) => b.size - a.size);
        // sorted by size

        updateStats();
        setFilteredChartContent();
        updateChartTitle();
    } catch(err) {
        console.log(err);
    }
}


// Function to run when a "name" of a speaker on the right sidebar is clicked.
function loadNewDataset(name) {
    const dropdown = document.getElementById('dropdown');
    if (dropdown) {
        dropdown.value = name;
    }
    updateSpeakerData(name);
    createChart(name);
}

// Function to run filtering options on the currently displayed chart when the Go button is clicked.
function goButton(event) {
    if (event != undefined) {
        event.preventDefault();  
    }
        
    state.loaded = false;
    
    setFilteredChartContent();
}

function setFilteredChartContent() {
    if (!document.getElementById('graph-display')) return;
    if (state.currentChartData.children && !state.isDrillDown) {
        let filteredData = [];
        
        for (object of state.currentChartData.children) {
            if (state.type == getClassName(object.partOfSpeech)) {
                filteredData.push(object)
            } else if (state.type == 'all') {
                filteredData.push(object)
            }
        }

        let filteredData2 = [];
        // if unique words is selected, cross check with unique words list.
        if (filter.uniqueFilter == "Unique") {
            for (object of filteredData) {
                // if word is in list of unique words, add to new set.
                if (state.currentSpeakerData?.uniqueWords?.includes(object.name)) {
                    filteredData2.push(object);
                }
            }
        }
        else {
            filteredData2 = filteredData;
        }
        
        state.isFiltered = true;
        state.currentFilteredData = { children: filteredData2 };
        
        renderChart(state.currentFilteredData);
    }
}

window.addEventListener('load', function(){
    initializeBubblesWidget();
});

function applyControlVisibility() {
    const options = getBubblesOptions();
    const controls = document.querySelector('.controls');
    const dropdown = document.getElementById('dropdown');
    const graphContainer = document.getElementById('graph-container');
    if (dropdown) {
        dropdown.disabled = !options.allowSpeakerSelect;
    }
    if (controls && !options.allowSpeakerSelect) {
        controls.style.display = 'none';
    } else if (controls) {
        controls.style.display = '';
    }
    if (graphContainer) {
        graphContainer.classList.add('graph--stacked');
    }
}

function initializeBubblesWidget() {
    const graphDisplay = document.getElementById('graph-display');
    if (!graphDisplay) return;
    const currentRoot = graphDisplay.closest('.vl-bubbles-root') || document.body;
    if (bubblesInitComplete && bubblesInitRoot === currentRoot) return;
    bubblesInitComplete = true;
    bubblesInitRoot = currentRoot;
    resetBubblesState();
    resetBubblesFilter();
    fillDropDown();
    applyControlVisibility();

    let message = { height: document.body.scrollHeight, width: document.body.scrollWidth };
    window.top.postMessage(message, "*");

    const uniqueButton = document.getElementById('unique-button');
    if (uniqueButton) {
        uniqueButtonClickHandler = (e) => {
            e.preventDefault();
            updateUniqueButton(e);
        };
        uniqueButton.addEventListener("click", uniqueButtonClickHandler);
    }

    const dropdown = document.getElementById('dropdown');
    if (dropdown) {
        dropdown.addEventListener('change', function() {
            loadNewDataset(this.value);
        });
    }

    const typeRadios = document.querySelectorAll('input[name="typeRadios"]');
    if (typeRadios && typeRadios.length) {
        typeRadios.forEach((radio) => {
            radio.addEventListener('change', function() {
                updateTypeRadios(this);
            });
        });
    }

    const wordmax = document.getElementById('wordmax');
    if (wordmax) {
        wordmax.value = 25;
        wordmaxKeypressHandler = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                goButton();
            }
        };
        wordmax.addEventListener("keypress", wordmaxKeypressHandler);
    }

    getSpeaker();
    const options = getBubblesOptions();
    if (!options.shellManagedResize) {
        window.addEventListener('resize', onBubblesResize);
    }
}

function destroyBubblesWidget() {
    if (state._resizeTimer) {
        clearTimeout(state._resizeTimer);
        state._resizeTimer = null;
    }
    if (state._rerenderTimer) {
        clearTimeout(state._rerenderTimer);
        state._rerenderTimer = null;
    }
    if (state._simulation) {
        state._simulation.stop();
        state._simulation = null;
    }
    if (state._renderInterval) {
        state._renderInterval.stop();
        state._renderInterval = null;
    }
    window.removeEventListener('resize', onBubblesResize);
    resetBubblesState();
    resetBubblesFilter();
    bubblesInitComplete = false;
    bubblesInitRoot = null;
}

window.BubblesWidgetApi = {
    init: initializeBubblesWidget,
    destroy: destroyBubblesWidget,
    resize: function() {
        scheduleRerender(280);
    },
    setOptions: function(options) {
        window.BubblesWidgetOptions = { ...(window.BubblesWidgetOptions || {}), ...(options || {}) };
        applyControlVisibility();
    }
};

if (document.readyState === 'complete') {
    initializeBubblesWidget();
}
bubblesNs.api = window.BubblesWidgetApi;
})();
