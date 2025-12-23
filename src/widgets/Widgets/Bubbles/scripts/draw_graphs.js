/*
 © Copyright 2021 Visiblelanguage
*/

/*
This javascript file is linked to packedbubbles.html and controls the drawing of the packed
bubble charts. The javascript to draw the tree charts is found in the treecharts.html file, not
a separate js file. I intended to separate it from the html, but never reached that point.
*/

// Initialization of Bubbles app state, including query parameter extraction
let state =  {
    currentDataSet: "nephi1",
    currentChartType: "content",
    currentChartData: {},
    isDrillDown: false,
    currentFilteredData: {},
    isFiltered: false,
    isInitialized: false,
    showTooltip: false,
    currentSpeakerData: {},
    type: 'all',
    loaded: false
}
const urlParams = new URLSearchParams(window.location.search);

// Get speaker
function getSpeaker() {
    if (urlParams.get('speaker')) {
        const paramSpeaker = urlParams.get("speaker").charAt(0).toLowerCase() + urlParams.get("speaker").slice(1);
        if (idNames.includes(paramSpeaker)) {
            state.currentDataSet = paramSpeaker;
            console.log("Successfully retrieved speaker from parameters");
        }
    } else {
        // the conditions that were here appear to be redundant
        loadNewDataset(state.currentDataSet);
        console.log("Bad URL parameter for speaker. Default to Nephi.");
    }  
}


// Get word. If no word, stay on default.
const paramWord = urlParams.get("word");

let filter = {
    uniqueFilter: "All", // other options "Unqiue"
}

const chartId = '#graph-display';

function fillDropDown() {
    let dropdown = document.getElementById('dropdown');

    for (id of idNames) {
        let option = document.createElement('option');
        option.setAttribute('value', id);
        option.innerHTML = idNameToDisplayName(id);
        dropdown.appendChild(option);
    }
    
    dropdown.value = state.currentDataSet; // dropdown should default to speaker
}

fillDropDown();

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
    const content = ["noun", "verb"];
    
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

// Creates tooltip at mouse
function tooltipEventListener(e) {
    const toolTip = document.querySelector('.tooltip');

    if (toolTip == null) return;

    toolTip.style.left = e.offsetX + 'px';
    toolTip.style.top = e.offsetY + 'px';
}

function createTooltipEventListener() {
    document.addEventListener('mousemove', tooltipEventListener);
}

function destroyTooltipEventListener() {
    document.removeEventListener("mousemove", tooltipEventListener);
}

function showText(text, fontSize, y = 0, radius = 0) {
    const textWidth = getTextWidth(fontSize, String(text), 10);
    const textAnchor = getTextHeight(fontSize, String(text)) / 2;
    
    return textWidth < (getInnerCircleDistance(radius, y + textAnchor) * 80);
}

function mouseOver(event, data) {
    const tooltip = d3.select(".tooltip");

    d3.select(this)
        .select('circle')
        .attr('class', `${getClassName(data.data.partOfSpeech)} bubble-hover`);

    // Adds tooltip if text will overflow
    if (true) {	
        tooltip
            .attr('class', 'tooltip tooltip--visible');	
        tooltip
            .html(data.data.name + "<br/>"  + data.data.size);
            state.showTooltip = true;

        createTooltipEventListener();
    }
}

function mouseOut(event, data) {
    const tooltip = d3.select(".tooltip");

    d3.select(this).select('circle')
        .attr('class', getClassName(data.data.partOfSpeech));

    // Hides tooltip
    state.showTooltip = false;
    destroyTooltipEventListener();

    tooltip
        .attr('class', 'tooltip');
}

function onClick(event, data) {
    const tooltip = d3.select(".tooltip");

    if (state.showTooltip) {
        state.showTooltip = false;
        destroyTooltipEventListener();
    }

    // clear tooltip in the case that the user is clicking while hovering
    tooltip
        .attr('class', 'tooltip');

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
    
    resetRadiosToAll();
    
    state.currentSpeakerData = getSpeakerDataJSON(speaker);
}

function resetRadiosToAll(){
    const el = document.getElementById('radio-all');
    
    el.checked = true;
    state.type = 'all';
}

function renderChart(data = state.currentChartData) {
    clearChart();

    if (data.children.length == 0) return;
    const MAX_QUANTITY = 1000;

    // Change dataset depending on user parameters
    var dataArrayFinal = [];

    var min = Number(document.getElementById("wordmin").value);
    var max = Number(document.getElementById("wordmax").value);
    
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
        document.getElementById('graph-container').className = "graph graph--initialized";
    }
    
    const width = 900;
    const height = 750;

    const svg = d3.select(chartId).append('svg')
                    .attr("viewBox", `0 0 ${width} ${height}`)
                    .attr("preserveAspectRatio", "xMinYMin meet")
                    .attr("class", "svg-graph")
                    .attr('style', state.isDrillDown ? `clip-path: circle(${800/2}px at 50% 50%)` : '')
                    .attr('id', 'svg-graph')

    
    // create tooltip
    if (!state.isDrillDown) {
        d3.select(chartId)
            .append('div')
            .attr('class', 'tooltip');
    }


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
    
    const maxRadius = d3.max(nodes, (node) => node.r);
    
    let count = 0;

    let currentNodes = determineNodeInit();
    
    var graph, circles, texts;
    
    function determineNodeInit() {
        if (state.loaded) {
            return nodes.children;
        } else {
            return [nodes.children[count]]
        }
    }
    
    const initializeNodes = () => {
        graph = svg.selectAll('g')
            .data(currentNodes)
            .enter()
            .append('g')
                .attr('class', 'bubble-element')
                .on('mouseover', mouseOver)
                .on('mouseout', mouseOut)
                .on('click', onClick)
                .call(d3.drag() // call specific function when circle is dragged
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));

        circles = graph.append('circle')
            .attr('class', (d) => getClassName(d.data.partOfSpeech));
            
        texts = textContainerAppend(graph)
    }
    
    const restart = () => {
        d3.selectAll(".bubble-element").remove();

        simulation.nodes(currentNodes);
        
        initializeNodes();
        simulation.restart();
    }

    if (!state.loaded) {
        const interval = d3.interval(() => {
            if (count >= nodes.children.length) {
                state.loaded = true;
                interval.stop();
            } else if (count > 0) {
                currentNodes.push(nodes.children[count]);
                restart();
            }
            
            count += 1;
        }, 50)   
    }

        // Simulation to remove pack()
    var simulation = d3.forceSimulation(currentNodes)
      .force('charge', d3.forceManyBody().strength(-10))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.9))
      .force("collide", d3.forceCollide()
          .radius((d) => d.r - d.r/10)
          .strength(0.8)
          .iterations(5))
      .on('tick', ticked);
      
    initializeNodes();
    
    function distanceBoundary(dim, rad) {
        if (dim > width - rad) {
            return width - rad;
        } else if (dim < rad) {
            return rad;
        } else {
            return dim;
        }        
    }

    function ticked() {
        circles.data(currentNodes)
            .join('circle')
            .attr('r', (d) => d.r)
            .attr('cx', function(d) {
                return distanceBoundary(d.x, d.r);
            })
            .attr('cy', function(d) {
                return distanceBoundary(d.y, d.r);
            })
            
        texts.data(currentNodes)
            .join('text')
            .attr('transform', (d) => {
                const x = distanceBoundary(d.x, d.r);
                const y = distanceBoundary(d.y, d.r);
                
                return `translate(${x - (d.r / 1.25)}, ${y - (d.r / 1.25)})`
            })
    }
    
    function dragstarted(d) {
      if (!d.active) simulation.alphaTarget(.03).restart();
      if (dragConditions(d.x, d.y, width, height)) {
          d.subject.fx = d.subject.x;
          d.subject.fy = d.subject.y;
      }
    }
    
    function dragged(d) {
        if (dragConditions(d.x, d.y, width, height)) {
            d.subject.fx = d.x;
            d.subject.fy = d.y;   
        }
    }
    
    function dragended(d) {
      if (!d.active) simulation.alphaTarget(.03);
      d.subject.fx = null;
      d.subject.fy = null;
    }
}

function dragConditions(x, y, width, height) {
    return x < width && y < height && x > 0 && y > 0;
}

function textContainerAppend(graph){
    const textContainer = graph.append('g')
        
    const text = textContainer.append('foreignObject')
        .attr("width", d => (d.r * 1.5 ) + "px" )
        .attr("height", d => (d.r * 1.5 ) + "px")
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
    const numChar = 500;
    const str = text.length > numChar ? text.substr(0, numChar) + "..." : text;

    return `<p class="bubble-title">${name}</p><p>${str}</p><p>- ${ref}</p>`;
}

function updateChartTitle() {
    const chartType = state.currentChartType[0].toUpperCase() + state.currentChartType.slice(1);
    document.getElementById('graph-title').innerHTML = `${idNameToDisplayName(state.currentDataSet)} Words Chart`;
    
    // update Image as well
    // const urlBase = 'PackedBubble/graphs/json/json'; // Online Server
    const urlBase = '/Widgets/Bubbles/images/'; // local Server

    imageString = urlBase + state.currentDataSet + ".jpg"
    document.getElementById('speaker-image').setAttribute('src', imageString)
}

function updateStats() {
    document.getElementById('stat-1').innerHTML = String(state.currentSpeakerData.totalCount).replace(/\B(?=(\d{3})+(?!\d))/g, ","); // add thousand comma
    document.getElementById('stat-2').innerHTML = (state.currentSpeakerData.totalCount / 273275 * 100).toFixed(1) + "%"
    if (state.currentSpeakerData.totalCount / 273275 < .01) {
        document.getElementById('stat-2').innerHTML = "< 1%"
    }
    document.getElementById('stat-3').innerHTML = state.currentSpeakerData.rank
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
    let message = { height: document.body.scrollHeight, width: document.body.scrollWidth };
    window.top.postMessage(message, "*");
    
    document.getElementById('unique-button').addEventListener("click", (e) => {
        e.preventDefault();
        
        updateUniqueButton(e)
    });
    
    document.getElementById('wordmax').value = 25;
    
    document.getElementById('wordmax').addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            // Trigger the button element with a click
            e.preventDefault();
            goButton();
        }
    });

    getSpeaker();
});