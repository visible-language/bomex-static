// some local data for display
var imageFiles = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma2', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon2', 'Ammoron', 'Amulek', 'Angels', 'AntiNephiLehi', 'Antionah', 'Benjamin', 'BrotherJared', 'BrothersNephi', 'CaptainMoroni', 'Chemish', 'Christ', 'ChristAmerica', 'Enos', 'Ether', 'FatherLamoni', 'Gid', 'Giddianhi', 'Giddonah', 'Giddonah2', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman2', 'Isaiah', 'Jacob', 'Jacob2', 'Jared', 'Jared2', 'Jarom', 'JohnBaptist', 'Joseph', 'Joseph2', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman2', 'Lamoni', 'Lehi', 'Lehi2', 'Lehi3', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi2', 'Nephihah', 'Noah', 'Omni', 'Pahoran', 'SamuelLamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']
const idNames = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma2', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon2', 'Ammoron', 'Amulek', 'Angels', 'AntiNephiLehi', 'Antionah', 'Benjamin', 'BrotherJared', 'BrothersNephi', 'CaptainMoroni', 'Chemish', 'ChristAmerica', 'Enos', 'Ether', 'FatherLamoni', 'Gid', 'Giddianhi', 'Giddonah', 'Giddonah2', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman2', 'Isaiah', 'Jacob', 'Jacob2', 'Jared', 'Jared2', 'Jarom', 'JohnBaptist', 'Joseph', 'Joseph2', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman2', 'Lamoni', 'Lehi', 'Lehi2', 'Lehi3', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi2', 'Nephihah', 'Noah', 'Omni', 'Pahoran', 'SamuelLamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']
const displayNames = ['Aaron', 'Abinadi', 'Abinadom', 'Akish', 'Alma', 'Alma the Younger', 'Amaleki', 'Amalickiah', 'Amaron', 'Aminadab', 'Ammaron', 'Ammon', 'Ammon the Mulekite', 'Ammoron', 'Amulek', 'Angels', 'Anti-Nephi-Lehi', 'Antionah', 'Benjamin', 'Brother of Jared', 'Brothers of Nephi', 'Captain Moroni', 'Chemish', 'Christ in America', 'Enos', 'Ether', 'Father of Lamoni', 'Gid', 'Giddianhi', 'Giddonah the Priest', 'Giddonah Father of Amulek', 'Gideon', 'Gidgiddoni', 'Godhead', 'Helaman', 'Helaman, Son of Helaman', 'Isaiah', 'Jacob, Son of Lehi', 'Jacob, Son of Isaac', 'Jared', 'Jared, Son of Omer', 'Jarom', 'John the Baptist', 'Joseph in Egypt', 'Joseph', 'Joshua', 'Korihor', 'Laban', 'Lachoneus', 'Laman the Nephite Spy', 'Lamoni', 'Lehi', 'Lehi, Son of Helaman', 'Lehi, Son of Zoram', 'Limhi', 'Malachi', 'Micah', 'Mormon', 'Moroni', 'Moses', 'Mosiah', 'Nephi', 'Nephi, Son of Helaman', 'Nephihah', 'King Noah', 'Omni', 'Pahoran', 'Samuel the Lamanite', 'Sariah', 'Satan', 'Sherem', 'Zeezrom', 'Zeniff', 'Zenock', 'Zenos', 'Zerahemnah']

function getDisplayName(idName) {
    return displayNames[idNames.indexOf(idName)];
}

let langCXForSVG = []
let relCXForSVG = []
let linesData = [];
let iconsData = [];
let svgLangLines = [];
let svgRelLines = [];

// set current speaker
let state = {
    speaker: "Nephi1",
    typeLines: ["Language", "Family", "Associate", "Enemy", "Divine"]
}
let path = location.pathname.split("/");
let parameters = new URLSearchParams(window.location.search);

// get from url query
if (parameters.get("speaker")) {
    paramSpeaker = parameters.get("speaker").charAt(0).toUpperCase() + parameters.get("speaker").slice(1)
    if (imageFiles.includes(paramSpeaker)) {
        state.speaker = paramSpeaker
    } else {
        state.speaker = "Mormon";
        console.log("Bad URL parameter for speaker. Default to Mormon.")
    }
}
// get from url path (never used so far)
else if (imageFiles.includes(path[3])){
    state.speaker = path[3];    
}
// default to Mormon
else {
    state.speaker = "Mormon";
    console.log("No query detected. Default to Mormon.")
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

makeCoordinates();

// find the name's image in the widget's image folder
function getImageLink(name) {
    folder = "../../Images/"
    return folder + name + ".jpg";
}

// Use the state to update the upper right corner with the current speaker
function updateMainInfo() {
    let name = document.getElementById('main-name')
    name.innerHTML = getDisplayName(state.speaker)

    let image = document.getElementById('main-image')
    image.setAttribute('src', getImageLink(state.speaker))
}

updateMainInfo();

// Selects a new speaker and re-renders graphics. Used by icon click and html dropdown.
function updateSpeaker(speaker) {
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

convertDataForSVGLines();

// For initialization
function createConnectionsDiagram() {
    // create lines
    drawLines();

    // create icons
    createIcons();
}
createConnectionsDiagram();

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

updateInfoBoxes();

// Populates the info box with expandable information bars on each connection
function updateRelationshipInfoBox() {
    const box = document.getElementById('social');
    box.innerHTML = "";
    const current = relationshipData.find(obj => obj.name == state.speaker);    // gets speaker name

    // for each speaker that the current speaker has a relation to, add an expandable to the selected box
    for (let obj of current.relations) {
        if (!imageFiles.includes(obj.name)) continue;   // safety against unimplemented speakers
        let icon = createSmallIcon('rel', obj.name, obj.connection);    
        box.append(icon);
    }
}

// Returns HTML for a brand new expandable list element of a connection,
// given the name of the connected (not the selected) speaker and some descriptive text.
function createSmallIcon(type, speaker, connection) {
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

    // bundle image and name together
    let imageAndName = document.createElement('div');
    imageAndName.setAttribute('class', 'icon-small-speaker');
    imageAndName.appendChild(imgBox);
    imageAndName.appendChild(speakerName);

    // a "v" that flips when header is clicked
    let collapseIcon = document.createElement('div');
    collapseIcon.setAttribute('class', 'small-collapse');
    collapseIcon.innerHTML = "v";

    // bundle the image/name and v into one (clickable) header bar
    let header = document.createElement('div');
    header.setAttribute('class', 'header');
    header.appendChild(imageAndName);
    header.appendChild(collapseIcon);
    header.setAttribute("onclick", "expandSmallIcon('" + type + "-col-" + speaker + "')");

    // descriptive dropdown
    let content = document.createElement('div');
    content.setAttribute('class', 'content'); 
    content.innerHTML = connection;

    // assmeble and return
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
