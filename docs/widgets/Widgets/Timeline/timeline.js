const timelineBoxHeight = 30;
const timelineStart = 700;
const tickHeight = 200;
const markerNums = [-700, -600, -500, -400, -300, -200, -100, 1, 100, 200, 300, 400, 500]
const timelineAnchors = [-600, -589, -587, -580, -550, -225, 1, 34, 231, 385, 421]
const anchorDescriptions = [
    "Lehites leave Jerusalem",
    "Lehites arrive in the Promised Land",
    "Mulekites leave Jerusalem",
    "Lehites separate into Nephites and Lamanites",
    "Jaredites destroyed by war",
    "A group of Nephites unites with the people of Zarahemla",
    "Christ is born",
    "The resurrected Savior appears",
    "The people again divide into factions",
    "Nephites destroyed by war",
    "End of the Nephite record"
]
const timelineOffsetY = 50;
const horzLineOffset = 20;
const boxOffsetY = 10;

let timelineEvents = [
    { text: "Lehites leave Jerusalem", date: "600 B.C.", dateNum: -600, index: 0},
    { text: "Lehites arrive in the Promised Land", date: "589 B.C.", dateNum: -589, index: 1},
    { text: "Mulekites leave Jerusalem", date: "587 B.C.", dateNum: -587, index: 2},
    { text: "Lehites separate into Nephites and Lamanites", date: "580 B.C.", dateNum: -580, index: 3},
    { text: "Jaredites destroyed by war", date: "550 B.C.", dateNum: -550, index: 4},
    { text: "A group of Nephites unites with the people of Zarahemla", date: "225 B.C.", dateNum: -225, index: 5},
    { text: "Christ is born", date: "A.D. 1", dateNum: 1, index: 6},
    { text: "The resurrected Savior appears", date: "A.D. 34", dateNum: 34, index: 7},
    { text: "The people again divide into factions", date: "A.D. 231", dateNum: 231, index: 8},
    { text: "Nephites destroyed by war", date: "A.D. 385", dateNum: 385, index: 9},
    { text: "End of the Nephite record", date: "A.D. 421", dateNum: 421, index: 10}
]

class TimeLineState {
    static baseTextY = 170;
    // The y level text like "Lehi and family leave Jerusalem" is
    // displayed at when no alternate speakers are selected.

    static baseDateY = 190;
    // The y level text like "600 B.C." is displayed at when no alternate
    // speakers are selected.

    static baseMarkerY = 200;
    // The y level the thick vertical lines under the key events is
    // displayed at when no alternate speakers are selected.

    constructor() {
        this.speaker = "nephi1";
        this.altSpeakers = [];
        this.speakerEvents = [];
        this.initialized = false; // set to true after createTimelineFramework is called
    }

    eventLabelLevel() {
        return TimeLineState.baseTextY + this.altSpeakers.length*timelineBoxHeight;
    }

    eventDateLevel() {
        return TimeLineState.baseDateY + this.altSpeakers.length*timelineBoxHeight;
    }
    eventTickLevel() {
        return TimeLineState.baseMarkerY + this.altSpeakers.length*timelineBoxHeight;
    }

    tempRectLevel() {
        return timelineOffsetY + boxOffsetY + (this.altSpeakers.length+1)*timelineBoxHeight;
    }

    tempLabelLevel() {
        return timelineOffsetY + boxOffsetY + (this.altSpeakers.length+1)*timelineBoxHeight + timelineBoxHeight/1.5
    }

    currentRectLevel() {
        return timelineOffsetY + boxOffsetY + this.altSpeakers.length*timelineBoxHeight;
    }

    currentLabelLevel() {
        return timelineOffsetY + boxOffsetY + this.altSpeakers.length*timelineBoxHeight + timelineBoxHeight/1.5
    }

    svgHeight() {
        return 340 + this.altSpeakers.length*timelineBoxHeight;
    }

    xTickLabelLevel() {
        return parseInt(timelineOffsetY + tickHeight + 20) + this.altSpeakers.length*timelineBoxHeight;
    }

    xAxisLevel() {
        return parseFloat(timelineOffsetY + tickHeight - horzLineOffset) + this.altSpeakers.length*timelineBoxHeight;
    }

    xTickEnd() {
        return parseInt(this.xAxisLevel() + horzLineOffset);
    }

    currentEventRectLevel() {
        return timelineOffsetY + boxOffsetY + this.speakerEvents.length*timelineBoxHeight; 
    }

    eventEventLabelLevel() {
        return TimeLineState.baseTextY + this.speakerEvents.length*timelineBoxHeight;
    }

    eventEventDateLevel() {
        return TimeLineState.baseDateY + this.speakerEvents.length*timelineBoxHeight;
    }

    eventEventTickLevel() {
        return TimeLineState.baseMarkerY + this.speakerEvents.length*timelineBoxHeight;
    }

    svgEventHeight() {
        return 300 + this.speakerEvents.length*timelineBoxHeight;
    }

    xEventTickLabelLevel() {
        return parseInt(timelineOffsetY + tickHeight + 20) + this.speakerEvents.length*timelineBoxHeight;
    }

    xEventAxisLevel() {
        return parseFloat(timelineOffsetY + tickHeight - horzLineOffset) + this.speakerEvents.length*timelineBoxHeight;
    }

    xEventTickEnd() {
        return parseInt(this.xEventAxisLevel() + horzLineOffset);
    }
}

let state = new TimeLineState();

let parameters = new URLSearchParams(window.location.search);
let path = location.pathname.split("/");

if (parameters.get('speaker')) {
    paramSpeaker = parameters.get("speaker").charAt(0).toUpperCase() + parameters.get("speaker").slice(1)
    if (Dropdown.idNames.includes(paramSpeaker)) {
        Dropdown.fillDropDown('dropdown', paramSpeaker);
        state.speaker = paramSpeaker;
    }
} else if (Dropdown.idNames.includes(path[3])) {
    Dropdown.fillDropDown('dropdown', path[3]);
    state.speaker = path[3];    
} else {
    Dropdown.fillDropDown('dropdown', "Mormon");
    state.speaker = "Mormon";
}

function numToDate(num) {
    var result;
    let tag = (num >= 0) ? "A.D." : "B.C.";
    let year = Math.abs(num);

    if(num >= 0) {
        result = tag + " " + parseInt(year, 10);
    } else {
        result = parseInt(year, 10) + " " + tag;
    }
    return result;
}

function getImageLink(name) {
    return "../../Images/" + name + ".jpg";
}

// Opens/closes the list of alternate speaker buttons
function showList() {
    let list = document.querySelector('.horizontal-scroll')
    list.style.maxHeight = '110px';
}

function updateMainInfo() {
    let image = document.getElementById('main-image');
    image.setAttribute('src', getImageLink(state.speaker));
}

function createAltSpeakerList() {
    let list = document.getElementById('name-list');

    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    for (let id of Dropdown.idNames) {
        if (id == state.speaker) {
            continue;
        }
        let name = document.createElement('div');
        name.classList.add('name');
        name.id = `${id}-button`;
        if (state.altSpeakers.includes(id)) {
            name.style.backgroundColor = '#bddac88c';
        }
        name.innerHTML = Dropdown.idNameToDisplayName(id);
        list.appendChild(name);
        name.addEventListener('mouseover', function( event ) {
            createTempTimelineBox(id);
        });
        name.addEventListener('mouseout', function(event) {
            removeTempTimelineBox(id);
        });
        name.addEventListener('click', function(event) {
            toggleAltTimelineBox(id);
        });
    }
}

function loadSpeaker(name) {
    if (state.altSpeakers.includes(name)) {
        removeAltTimelineBox(name);
    } else if (!state.initialized) {
        createTimelineFramework();
    }

    state.speaker = name;
    state.speakerEvents = [];
    updateMainInfo();
    createTimelineBox();
    
    createTimelineBoxEvents();
    createAltSpeakerList();
}

loadSpeaker(state.speaker);


// Create timeline framework from object
function createTimelineFramework() {
    state.initialized = true;
    let svg = d3.select("#svg-lifespan");
    
    xAxis = svg.append('path')
        .attr('class', 'horz-line')
        .attr('d', 'M 0 ' + state.xAxisLevel() + ' L 1200 ' + state.xAxisLevel());

    let ticks = svg.selectAll(".tick")
    ticks.data(markerNums)
        .enter()
        .append('path')
            .attr('class', 'tick')
            .attr('d', function(d) { return getTickPath(d) })

    let dates = svg.selectAll(".date")
    dates.data(markerNums)
        .enter()
        .append('text')
            .attr('class', 'date')
            .html(function(d) { return numToDate(d) })
            .attr('x', function(d) { return d + timelineStart - 20 })
            .attr('y', state.xTickLabelLevel());

    let events = svg.selectAll("g")
        .data(timelineEvents)
        .enter()
        .append('g')
            .attr('opacity', 0)
            .style('transform', 'translateY(20px)')

    events.transition()
        .attr('opacity', 1)
        .style('transform', 'translateY(0px)')
        .duration(1000)
        .delay((d, i) => i * 400)

    let peacefulYears = svg.append("foreignObject")
            .attr("class", "peacefulYears")
            .attr("x", 740)
            .attr("y", state.eventEventTickLevel() + 4.4)
            .attr("width", 185)
            .attr("height", 25)
            .attr("style", "outline: thin solid rgba(0, 0, 0, 0.25)")
            .attr('opacity', 0)
            .style('transform', 'translateY(20px)')
            .append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("font-size", "14px")
                .style("padding-top", "4px")
                .style("background-color", "#d6e6e6")
                .style("text-align", "center")
                .html("200 years of peace and unity");

    createCompareAnchors(svg);

    d3.select(".peacefulYears")
        .transition()
            .attr('opacity', 1)
            .style('transform', 'translateY(0px)')
            .duration(1000)
            .delay(2900)
    
}

function createCompareAnchors(svg) {
    const texts = svg.selectAll('g')
        .append("foreignObject")
            .attr("class", "lowerhalf-text")
            .attr("x", d => getAnchorTextXLevel(d))
            .attr('y', d => getAnchorTextYLevel(d))
            .attr("width", d => getAnchorTextWidth(d))
            .attr("height", 22)
            .attr("style", "outline: thin solid rgba(0, 0, 0, 0.25)")
            .append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("font-size", "14px")
                .style("padding-top", "2px")
                .style("background-color", "#d6e6e6")
                .style("text-align", "center")
                .html(d => d.text);

    const eventMarkers = svg.selectAll('g')
        .append('rect')
            .attr('x', d => d.dateNum + timelineStart -1)
            .attr('class', 'lowerhalf-marker')
            .attr('y', d => getAnchorMarkerYLevel(d)) 
            .attr('width', 2)
            .attr('height', d => getAnchorMarkerHeight(d))
}

function getAnchorTextYLevel(d) {
    let switcher = 0;
    switch (d.index) {
        case 0:
            switcher = -68;
            break;
        case 1:
            switcher = 110;
            break;
        case 2:
            switcher = -40;
            break;
        case 3:
            switcher = 81;
            break;
        case 4:
            switcher = -13;
            break;
        case 5:
            switcher = 110;
            break;
        case 6:
            switcher = -27;
            break;
        case 7:
            switcher = 80;
            break;
        case 8:
            switcher = -43;
            break;
        case 9:
            switcher = 80;
            break;
        case 10:
            switcher = -13;
            break;
    }

    return state.eventTickLevel() + switcher;
}

function getAnchorTextXLevel(d) {
    let offset = 5;
    switch (d.index) {
        case 0:
            offset = 80;
            break;
        case 1:
            offset = 80;
            break;
        case 2:
            offset = 5;
            break;
        case 3:
            offset = 2;
            break;
        case 4:
            offset = 5;
            break;
        case 5:
            offset = 100;
            break;
        case 6:
            offset = 50;
            break;
        case 7:
            offset = 80;
            break;
        case 8:
            offset = 125;
            break;
        case 9:
            offset = 100;
            break;
        case 10:
            offset = 125;
            break;
    }

    return d.dateNum + timelineStart - offset;
}

function getAnchorMarkerYLevel(d) {
    let switcher = 30;
    switch (d.index) {
        case 0:
            switcher = -45;
            break;
        case 2:
            switcher = -17;
            break;
        case 4:
            switcher = 10;
            break;
        case 6:
            switcher = -5;
            break;
        case 8:
            switcher = -20;
            break;
        case 10:
            switcher = 10;
            break;
    }

    return state.eventTickLevel() + switcher;
}

function getAnchorMarkerHeight(d) {
    switch (d.index) {
        case 0:
            return 75;
        case 1:
            return 80;
        case 2:
            return 47;
        case 3:
            return 50;
        case 4:
            return 20;
        case 5:
            return 80;
        case 6:
            return 35;
        case 7:
            return 50;
        case 8:
            return 50;
        case 9:
            return 50;
        case 10:
            return 20;
        default:
            return 25;
    }
}

function getAnchorTextWidth(d) {
    switch(d.index) {
        case 0:
            return 170;
        case 1:
            return 235;
        case 2:
            return 180;
        case 3:
            return 300;
        case 4:
            return 180;
        case 5:
            return 360;
        case 6:
            return 100;
        case 7:
            return 210;
        case 8:
            return 250;
        case 9:
            return 180;
        case 10:
            return 180;
    }
}

// For ensuring that the timeline events and axis markers are at the
// correct Y-level when alternate speakers are added/removed.
function adjustTimelineFramework() {
    d3.select('#svg-lifespan').attr('viewBox', `-50 0 1300 ${state.svgHeight()}`);

    d3.selectAll('.lowerhalf-text').attr('y', d => getAnchorTextYLevel(d));
    d3.selectAll('.lowerhalf-date').attr('y', state.eventDateLevel());
    d3.selectAll('.lowerhalf-marker').attr('y', d => getAnchorMarkerYLevel(d));
    d3.select('.peacefulYears').attr('y', state.eventTickLevel() + 4.4);
    
    d3.selectAll('.date').attr('y', state.xTickLabelLevel());
    
    d3.selectAll(".tick").attr('d', function(d) { return getTickPath(d) });

    d3.select('.horz-line')
        .attr('d', 'M 0 ' + state.xAxisLevel() + ' L 1200 ' + state.xAxisLevel());
}


function getTickPath(num) {
    num += 700;
    return "M " + parseInt(num) + " " + timelineOffsetY + " " + parseInt(num) + " " + state.xTickEnd();
}

function getEventTickPath(num) {
    num += 700;
    return "M " + parseInt(num) + " " + timelineOffsetY + " " + parseInt(num) + " " + state.xEventTickEnd();
}

function createTimelineBox() {
    d3.selectAll(`.timeline-lifespan`).remove();
    d3.selectAll(`.timeline-rect`).remove();
    d3.select('.main-name').remove();
    let current = eventsData.find(obj => obj.name == state.speaker);
    let startX = getNumFromDate(current.lifespan_start);
    let stopX = getNumFromDate(current.lifespan_end);
    let width = stopX - startX;

    let svg = d3.select("#svg-lifespan");
    svg.append('rect')
        .attr('class', 'timeline-rect')
        .attr('x', startX)
        .attr('y', timelineOffsetY + boxOffsetY)
        .attr('width', width)
        .attr('height', timelineBoxHeight)
        .attr('rx', 5);

    svg.append('text')
        .attr('class', 'timeline-lifespan')
        .attr('x', startX - 50)
        .attr('y', timelineOffsetY - 10)
        .text(current.lifespan_start + " - " + current.lifespan_end);

    svg.append('text')
        .attr('class', 'main-name')
        .attr('x', startX + width + 5)
        .attr('y', timelineOffsetY + boxOffsetY + timelineBoxHeight/1.5)
        .text(Dropdown.idNameToDisplayName(state.speaker));
}

function createTempTimelineBox(speaker) {
    if (state.altSpeakers.includes(speaker)) {
        document.querySelector(`#${speaker}-rect`).style.strokeWidth = '2px';
        return;
    }

    let current = eventsData.find(obj => obj.name == speaker);
    let startX = getNumFromDate(current.lifespan_start);
    let stopX = getNumFromDate(current.lifespan_end);
    let width = stopX - startX;
    let svg = d3.select("#svg-lifespan");

    svg.append('rect')
        .attr('class', 'temp-timeline-rect')
        .attr('x', startX)
        .attr('y', state.tempRectLevel())
        .attr('width', width)
        .attr('height', timelineBoxHeight)
        .attr('rx', 5);

    svg.append('text')
        .attr('class', 'temp-name')
        .attr('x', startX + width + 5)
        .attr('y', state.tempLabelLevel())
        .text(Dropdown.idNameToDisplayName(speaker));
}

function toggleAltTimelineBox(speaker) {
    if (state.altSpeakers.includes(speaker)) {
        removeAltTimelineBox(speaker);
    } else {
        addAltTimelineBox(speaker);
    }
}

function removeAltTimelineBox(speaker) {
    document.querySelector(`#${speaker}-button`).style.backgroundColor = '#ffffff';
    d3.select(`#${speaker}-rect`).remove();
    d3.select(`#${speaker}-text`).remove();
    
    let after = false;

    for (let i = 0; i < state.altSpeakers.length; i++) {
        if (speaker == state.altSpeakers[i]) {
            after = true;
            continue;
        }
        if (after) {
            // All speakers that were placed after the speaker that 
            // is being removed need to be moved up one spot.
            newYLevel = timelineOffsetY + boxOffsetY + i*timelineBoxHeight;
            d3.select(`#${state.altSpeakers[i]}-rect`).attr('y', newYLevel);
            d3.select(`#${state.altSpeakers[i]}-text`).attr('y', newYLevel + timelineBoxHeight/1.5);
        }
    }

    state.altSpeakers.splice(state.altSpeakers.indexOf(speaker), 1);

    adjustTimelineFramework();
}

function addAltTimelineBox(speaker) {
    document.querySelector(`#${speaker}-button`).style.backgroundColor = '#bddac88c';
    removeTempTimelineBox(speaker);
    state.altSpeakers.push(speaker);

    let current = eventsData.find(obj => obj.name == speaker);
    let startX = getNumFromDate(current.lifespan_start);
    let stopX = getNumFromDate(current.lifespan_end);
    let width = stopX - startX;

    let svg = d3.select("#svg-lifespan");
    svg.append('rect')
        .attr('class', 'alt-timeline-rect')
        .attr('id', `${speaker}-rect`)
        .attr('x', startX)
        .attr('y', state.currentRectLevel())
        .attr('width', width)
        .attr('height', timelineBoxHeight)
        .attr('rx', 5);

    svg.append('text')
        .attr('class', 'alt-name')
        .attr('id', `${speaker}-text`)
        .attr('x', startX + width + 5)
        .attr('y', state.currentLabelLevel())
        .text(Dropdown.idNameToDisplayName(speaker));

    adjustTimelineFramework();
}

function removeTempTimelineBox(speaker) {
    d3.selectAll('.temp-timeline-rect').remove();
    d3.selectAll('.temp-name').remove();
    if (state.altSpeakers.includes(speaker)) {
        document.querySelector(`#${speaker}-rect`).style.strokeWidth = '1px';
        return;
    } 
}

function getNumFromDate(date) {
    var date_parts = date.split(" ");
    var num;

    if (date_parts[0] == 'A.D.') {
        num = parseInt(date_parts[1], 10);
    } else if (date_parts[1][0] == 'B') {
        num = parseInt(date_parts[0], 10) * -1;
    } else {
        num = parseInt(date_parts[0], 10);
    }

    num += timelineStart;
    return num;
}

let tabs = document.querySelectorAll('.tab');

tabs[0].addEventListener('click', function() {
    let eventPage = document.querySelector('#event-page');
    eventPage.style.display = 'block';

    let comparePage = document.querySelector('#compare-page');
    comparePage.style.display = 'none';
    tabs[0].classList.add('selected');
    tabs[1].classList.remove('selected');
});

tabs[1].addEventListener('click', function() {
    let eventPage = document.querySelector('#event-page');
    eventPage.style.display = 'none';
    
    let comparePage = document.querySelector('#compare-page');
    comparePage.style.display = 'block';
    showList();

    tabs[1].classList.add('selected');
    tabs[0].classList.remove('selected');
});


window.addEventListener('load', function() {
    let message = {
        height: document.body.scrollHeight,
        width: document.body.scrollWidth
    };

    window.top.postMessage(message, "*");
});

function convertYears(eventYears) {
    let convertedYears = [];
    var year_parts = [];

    eventYears.forEach((year) => {
        year_parts = year.split(' ');
        if (year_parts[1] == 'B.C.') {
            // Original format "yyyy B.C."
            convertedYears.push(parseInt(year_parts[0], 10) * -1);
        } else if (year_parts[0] == 'A.D.') {
            // Original format "A.D. yyyy"
            convertedYears.push(parseInt(year_parts[1]));
        } else {
            // assume format "yyyy AD"
            convertedYears.push(parseInt(year_parts[0]));
        }
    });

    return convertedYears;
}

// Create timeline framework from object
function createTimelineFrameworkEvents() {
    state.initialized = true;
    let svg = d3.select("#svg-events")
        .attr("preserveAspectRation", "xMidYmid meet")

    
    svg.append('path')
        .attr('class', 'horz-line-event')
        .attr('d', 'M 0 ' + state.xEventAxisLevel() + ' L 1200 ' + state.xEventAxisLevel());

    let ticks = svg.selectAll(".tick-event")
    ticks.data(markerNums)
        .enter()
        .append('path')
            .attr('class', 'tick-event')
            .attr('d', function(d) { return getEventTickPath(d) })

    let dates = svg.selectAll(".date-event")
    dates.data(markerNums)
        .enter()
        .append('text')
            .attr('class', 'date-event')
            .html(function(d) { return numToDate(d) })
            .attr('x', function(d) { return d + timelineStart - 20 })
            .attr('y', state.xEventTickLabelLevel());

    let events = svg.selectAll("g")
        .data(timelineEvents)
        .enter()
        .append('g')
            .attr('opacity', 0)
            .style('transform', 'translateY(20px)')

    events.transition()
        .attr('opacity', 1)
        .style('transform', 'translateY(0px)')
        .duration(1000)
        .delay((d, i) => i * 400)

    const texts = svg.selectAll('g')
        .append('text')
            .text(d => d.text)
            .attr('class', 'lowerhalf-text-event')
            .attr('x', d => d.dateNum + timelineStart - 80)
            .attr('y', state.eventEventLabelLevel())

    const eventDates = svg.selectAll('g')
        .append('text')
            .text(d => d.date)
            .attr('class', 'lowerhalf-date-event')
            .attr('x', d => d.dateNum + timelineStart - 17)
            .attr('y', state.eventEventDateLevel())

    const eventMarkers = svg.selectAll('g')
        .append('rect')
            .attr('x', d => d.dateNum + timelineStart - 2)
            .attr('class', 'lowerhalf-marker-event')
            .attr('y', d => state.eventEventTickLevel()) 
            .attr('width', 4)
            .attr('height', 30)
}

function createTimelineBoxEvents() {
    let current = eventsData.find(obj => obj.name == state.speaker);
    let eventYears = [];
    let eventDescriptions = [];
    let years = [];

    current.events.forEach(event => {
        let year = getNumFromDate(event.year);
        years.push(year);
        eventYears.push(event.year);
        eventDescriptions.push(event.description);
        
        state.speakerEvents.push(event);
        adjustEventTimelineFramework();
    });

    createGrid(convertYears(eventYears), eventDescriptions, eventYears, years);

}

function adjustEventTimelineFramework() {
    d3.select('#svg-events').attr('viewBox', `-50 0 1300 ${state.svgEventHeight()}`);

    d3.selectAll('.lowerhalf-text-event').attr('y', state.eventEventLabelLevel());
    d3.selectAll('.lowerhalf-date-event').attr('y', state.eventEventDateLevel());
    d3.selectAll('.lowerhalf-marker-event').attr('y', state.eventEventTickLevel());
    
    d3.selectAll('.date-event').attr('y', state.xEventTickLabelLevel());
    d3.selectAll(".tick-event").attr('d', function(d) { return getEventTickPath(d) });

    d3.select('.horz-line-event')
        .attr('d', 'M 0 ' + state.xEventAxisLevel() + ' L 1200 ' + state.xEventAxisLevel());
}

function createGrid(eventYears, eventDescriptions, originalEventYears, years) {
    d3.select(`.events-timeline`).remove();
    d3.selectAll(`circle`).remove();
    document.querySelector(".description-box-text").innerText = "";


    let total = 0;
    eventYears.forEach((year, i) => {
        total += parseInt(year);
    })
    averageYear = total / years.length;

    var margin = {top: 10, right: 40, bottom: 80, left: 30},
    height = 400 - margin.top - margin.bottom;

    // append the SVG object to the body of the page
    var SVG = d3.select(".zoom-box")
    .append("svg")
        .attr("width", "100%")
        .attr("height", height + margin.top + margin.bottom)
        .attr("class", "events-timeline")
    .append("g")
        .style("fill", "black")
        .style("pointer-events", "all")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    var x = d3.scaleLinear()
        .domain([d3.min(markerNums), d3.max(markerNums)])
    var xAxis = SVG.append("g")
        .attr("transform", "translate(0," + height + ")")
        .style("font-size", "14px")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([0, 9])
        .range([ height, 0]);
    var yAxis = SVG.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Create the scatter variable: where both the circles and the brush take place
    var scatter = SVG.append('g')
        .style("pointer-events", "all")

    eventYears.forEach((year,i) => {
        scatter
            .append("circle")
            .attr("class", "circle" + i)
            .attr("cy", 60 + (i * 20))
            .attr("r", 10)
            .style("fill", "#61a3a9")
            .style("pointer-events", "all")
            .style("stroke", "#19292b")
    })

    originalEventYears.forEach((year,i) => {
        SVG.append('text')
            .attr('class', 'event-text' + i)
            .attr('y', 65 + (i * 20))
            .text(year)
            .style("font-size", "14px")
    })

    SVG.append('text')
        .attr('class', 'timeline-title')
        .attr('x', "50%")
        .attr('y', 15)
        .style("text-anchor", "middle")
        .style("dominant-baseline", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text(Dropdown.idNameToDisplayName(state.speaker) + " (" + originalEventYears[0] + " - " + originalEventYears[originalEventYears.length - 1] + ")");

    SVG.append('text')
        .attr("class", "instructions")
        .attr('x', -15)
        .attr('y', 10)
        .style("font-size", "12px")
        .text('(scroll in and out to zoom / click and drag to pan)')

    // Set the zoom and Pan features: how much you can zoom, on which part, and what to do when there is a zoom
    var zoom = d3.zoom()
        .scaleExtent([1, 20])  // This control how much you can unzoom (x1) and zoom (x20)
        .on("zoom", updateChart);

    // This add an invisible rect on top of the chart area. This rect can recover pointer events: necessary to understand when the user zooms
    var myRect = SVG.append("rect")
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
        .call(zoom)

    // A function that updates the chart when the user zooms and thus new boundaries are available
    function updateChart() {

        // recover the new scale
        var newX = d3.event.transform.rescaleX(x);
        var newY = d3.event.transform.rescaleY(y);

        // update axes with these new boundaries
        xAxis.call(d3.axisBottom(newX))
        yAxis.call(d3.axisLeft(newY))

        // update circle position
        eventYears.forEach((year, i) => {
            scatter
            .select(".circle" + i)
            .attr('cx', newX(year))
            .attr('cy', 60 + (i * 20));
        })

        eventYears.forEach((year, i) => {
            d3.select(".event-text" + i)
                .attr('x', (newX(year) + 15))
                .attr('y',  65 + (i * 20));
        })

        drawLines();
        let oneTime = 0;
        d3.select('.yearsOfPeace').remove();
        timelineAnchors.forEach((year, i) => {
            d3.select('.line' + i).remove();
            d3.select('.anchorText' + i).remove();
            d3.select('.wrapText' + i).remove();
            let incrementer = 0;
            let textW = 135;
            let textH = 15;
            let shift = 0;
            oneTime = oneTime + 1;
            switch(i) {
                case 0:
                    incrementer = -45;
                    shift = -35;
                    textW = 130;
                    textH = 17;
                    break;
                case 1:
                    incrementer = -35;
                    shift = -35; 
                    textH = 17;
                    textW = 180;
                    break;
                case 2:
                    incrementer = -22;
                    shift = -2;
                    textH = 17;
                    textW = 140;
                    break;
                case 3:
                    incrementer = 0;
                    shift = -1;
                    textH = 30;
                    textW = 130;
                    break;
                case 4:
                    incrementer = 0;
                    shift = -2;
                    textH = 17;
                    textW = 140;
                    break;
                case 5:
                    incrementer = 0;
                    shift = -1;
                    textW = 104;
                    textH = 43;
                    break;
                case 6:
                    incrementer = -22;
                    shift = -35;
                    textW = 75;
                    textH = 17;
                    break;
                case 7:
                    incrementer = 0;
                    shift = -1;
                    textW = 90;
                    textH = 30;
                    break;
                case 8:
                    incrementer = -47;
                    shift = -35;
                    textW = 70;
                    textH = 42;
                    break;
                case 9:
                    incrementer = 0;
                    shift = -25;
                    textW = 60;
                    textH = 43;
                    break;
                case 10:
                    incrementer = -10;
                    shift = -40;
                    textW = 80;
                    textH = 30;
                    break;
                default:
                    break;    
            }
            
            drawAnchors(newX(year), i, incrementer, textW, textH, shift, newX);
        })
    }

    function drawChart() {
        currentWidth = parseInt(document.querySelector(".zoom-box").clientWidth);
        x.range([0, currentWidth - margin.left - margin.right]);
        xAxis.call(d3.axisBottom(x));
        zoom.extent([[0, 0], [currentWidth, height]]);
        zoom.translateExtent([[0, 0], [currentWidth, height]]);
        myRect.attr("width", currentWidth);
        eventYears.forEach((year,i) => {
            let currCircle = d3.select(".circle" + i);
            currCircle.attr("cx", function() { return x(year)})
        });

        eventYears.forEach((year,i) => {
            let currText = d3.select(".event-text" + i);
            currText.attr("x", function() { return (x(year) + 15)});
        });

        drawLines();

        if (averageYear < -575) {
            var transform = d3.zoomIdentity.translate(-averageYear - (-averageYear / 1.65) + (230 * ((currentWidth / 564) - 1)),0);
            myRect.call(zoom.transform, transform);
        } else if (averageYear < -200) {
            var transform = d3.zoomIdentity.translate(-averageYear - (-averageYear / 1.65) + (210 * ((currentWidth / 564) - 1)),0);
            myRect.call(zoom.transform, transform);
        } else if (averageYear < -100) {
            var transform = d3.zoomIdentity.translate(-averageYear + (averageYear / 1.70) + (20 * ((currentWidth / 564) - 1)),0);
            myRect.call(zoom.transform, transform);
        } else if (averageYear < -50) {
            var transform = d3.zoomIdentity.translate(-averageYear + (averageYear / 1.60),0);
            myRect.call(zoom.transform, transform);
        } else if (averageYear < 0) {
            var transform = d3.zoomIdentity.translate(-averageYear + (averageYear / 1.60) + (-25 * ((currentWidth / 564) - 1)),0);
            myRect.call(zoom.transform, transform);
        } else if (averageYear < 50) {
            var transform = d3.zoomIdentity.translate(-averageYear + (averageYear / 3) + (-60 * ((currentWidth / 564) - 1)),0);
            myRect.call(zoom.transform, transform);
        } else {
            var transform = d3.zoomIdentity.translate(-averageYear + (averageYear /1.78) + (-218 * ((currentWidth / 564) - 1)) ,0);
            myRect.call(zoom.transform, transform);
        }
        
        zoom.scaleTo(myRect.transition().duration(1000), 2);

    }
    
    drawChart();
    
    let tabs = document.querySelectorAll('.tab');
    // Recompute chart layout when switching to the Events tab.
    // Note: tab order is: [0] View significant events, [1] Compare with other speakers.
    tabs[0].addEventListener('click', function() {
        setTimeout(() => {drawChart();}, 1);
    });
    
    window.addEventListener('resize', drawChart);

    let text = document.querySelector('.description-box-text');
    text.innerHTML += '<p>* - estimated date</p>';
    originalEventYears.forEach((year, i) => {
        text.innerHTML += "<p>" + originalEventYears[i] + " - " + eventDescriptions[i] + "</p>";
    });

    function drawLines() {
        d3.selectAll("g.tick line").each(function(d) {
            d3.select(this)
                .attr("y1", -height + 30)
                .attr("stroke-width", 1)
                .attr("stroke", "black")
                .style("opacity", 0.5)
        });
    }

    function drawAnchors(xVal, i, incrementer, textW, textH, shift, newX) {
        let yVal = -25;
        let bonus = -5;

        if ((i + 1) % 2 == 0 ) {
            yVal = yVal * -1;
            bonus = 0;
            incrementer = incrementer * -1;
        }

        xAxis.append("line")
            .attr("class", "line" + i)
            .attr("x1", xVal)
            .attr("y1", yVal + incrementer)
            .attr("x2", xVal)
            .attr("y2", 0)
            .attr("stroke-width", 2)
            .attr("stroke", "black");
        xAxis.append("foreignObject")
            .attr("class", "wrapText" + i)
            .attr("x", xVal + shift)
            .attr("y", yVal + bonus + incrementer)
            .attr("width", textW)
            .attr("height", textH)
            .attr("style", "outline: thin solid rgba(0, 0, 0, 0.25)")
            .append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("padding-top", "2px")
                .style("text-align", "center")
                .style("font-size", "11px")
                .style("background-color", "#d6e6e6")
                .html(anchorDescriptions[i])
 
        if (i == 10) {
            xAxis.append("foreignObject")
            .attr("class", "yearsOfPeace")
            .attr("x", newX(35))
            .attr("y", -30)
            .attr("width", function() {
                if (newX(230) < newX(35)) {
                    return 0;
                }
                else {
                    return newX(230) - newX(35);
                }
            })
            .attr("height", 30)
            .attr("style", "outline: thin solid rgba(0, 0, 0, 0.25)")
            .append("xhtml:div")
                .style("width", "100%")
                .style("height", "100%")
                .style("font-size", "11px")
                .style("background-color", "#d6e6e6")
                .style("text-align", "center")
                .style("display", "flex")
                .style("align-items", "center")
                .style("justify-content", "center")
                .html("200 years of peace and unity");
        }
    }

    let resetButton = document.querySelector('#reset-button');
    resetButton.addEventListener('click', function() {
        drawChart();
    });
}

