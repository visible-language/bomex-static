(function (global) {
        // Inline index.js
        // Very similar structure and functionality to SocialNetwork's index.html

        //Checkbox stuff 
        const onNames = new Set();
        const colorNodes = new Set();
        const highlightLinks = new Set();
    
        // size variables for graph creation (hard-coding is bad, but we have to because the force-directed graph library isn't super polished)
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;  
        var graphWidth = windowWidth - 500;
        var graphHeight = windowHeight - 500;
        var sideSizeMin = windowHeight - 275;
        var sideSizeMax = windowHeight - 275;
    
        var graphExtraHeight = 110;
        var graphExtraWidth = 310;
        var graphExtraWidthMed = 260;
        var graphExtraWidthSmall = 10;
        var graphExtraSideHeight = 210;
        var graphExtraSideHeightSmall = 210;
        var minAccordionHeight = 426;
    
        
        // variables for highlighting when nodes are right-clicked
        var selectedNode = null;  
        var highlightMode = false;
        var coloring = 0;
        const targetNodes = new Set();
        const incomingNodes = new Set();
        const outgoingNodes = new Set();
        const inHighlightLinks = new Set();
        const outHighlightLinks = new Set();
    
        const visibleLinks = new Set();
        var connectionDisplay = 1;
        var dimensions = 3;
        var lineWidth = 1;
    
        // set initial color for nodes and background and node drag
        var graphColoring = 'text';
        var backgroundColor = 'light';
        var beads = 'both';
        
        //color variables
        var transparentDark = "rgba(34, 34, 34, 0.5)";
        var transparentlight = "rgba(236, 236, 236, 0.5)";
        var lightBackgroundColor = "#ffffff";
        var darkBackgroundColor = "#222222";
        var assetBase =
            global.SpeakersNetworkWidgetAssetBase ||
            (document.currentScript && document.currentScript.src
                ? new URL(".", document.currentScript.src).toString().replace(/\/$/, "")
                : "");
        var dataUrl = assetBase ? assetBase + "/unpruned.json" : "unpruned.json";
    
        // create graph	
        const Graph = ForceGraph3D({controlType: 'orbit'})
            (document.getElementById('graph-3d'))
            .jsonUrl(dataUrl)
            .nodeLabel('Display_Name')
            .nodeResolution([10])
            .nodeRelSize([6])
            .linkWidth(['Weight'])
            .nodeOpacity([1])
            .linkOpacity([.75])
            .nodeColor('Color')
            .nodeId(["Id"])
            .linkSource(["Source"])
            .linkTarget(["Target"])

            // Since we are creating the graph here, we can't resize the canvas with media queries.
            // We keep an initial size here, and then resize precisely in resizeGraph().
            .width((windowWidth <= 1024 ? windowWidth : graphWidth))
            .height((windowWidth <= 1024 ? Math.max(320, Math.min(650, Math.floor(windowHeight * 0.55))) : graphHeight))
            .linkWidth(lineWidth)
            .backgroundColor('#222222')

 /*   // this info isn't relevant here. It's from the Social Network
            .onLinkClick((link) => {
                showLinkInfo(link);
                closeAccordion();
                openTab('infoTab');
                dehighlightGraph();
            })
*/
            .onLinkHover((link, link2) => {
               // linkHover(link, link2);
            })
            .onNodeClick((node, event) => {
                highlightNode(node);
            })	  
            .onNodeRightClick((node) => {
                showNodeInfo(node);
                closeAccordion();
                openTab('infoTab');
            })
            .onBackgroundClick(() =>{
                dehighlightGraph()
            });
    
        // Decide which links should be shown based on checkboxes    
        function updateVisibleLinks(){
            visibleLinks.clear(); 
            var links = Graph.graphData().links;

            for (index = 0; index < links.length; index++) {
                link = links[index]
                if(connectionDisplay){
                    visibleLinks.add(link);
                }
            }

            Graph.linkVisibility(link => highlightLinks.has(link) && visibleLinks.has(link) ? 1 : highlightLinks.has(link) && inHighlightLinks.has(link) ? 1 : highlightLinks.has(link)&&outHighlightLinks.has(link) ? 1 : 0); 
        }
    
        //do something when you hover over links
        function linkHover(link, link2){
            if (link != null) {
                //on hover start
                link.Weight = 2;
                Graph.linkWidth('Weight')
            } else {
                //on hover end
                link2.Weight = 1;
                Graph.linkWidth('Weight')
            }
        }
        
        //return graph to original colors
        function dehighlightGraph(){
            highlightMode = false;
                // return nodes to proper color
                if (coloring == 1) {
                    Graph.nodeColor('color1');
                } else if (coloring == 2) {
                    Graph.nodeColor('color2');
                } else {
                    Graph.nodeColor('Color');
                }
                // Turn on link visibility and size
                Graph.linkOpacity([.75]);
                if (backgroundColor === 'dark') {
                    Graph.linkColor(link => '#ffffff');
                } else {
                    Graph.linkColor(link => '#888888');
                }

                Graph.linkWidth(lineWidth);
                updateVisibleLinks();
                // Clean out sets for selective highlighting
                inHighlightLinks.clear();
                outHighlightLinks.clear();
                incomingNodes.clear();
                outgoingNodes.clear();
                targetNodes.clear();
                destroyLabel();
        }
       
        // Dynamically resize the canvas on window resize
        global.addEventListener('resize', resizeGraph);
        const appHeight = () => document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
        global.addEventListener('resize', appHeight)
        appHeight();

        function resizeGraph(){    
            // Column layout for <= laptop width
            if (window.innerWidth <= 1024) {
                const desiredH = Math.floor(window.innerHeight * 0.55);
                Graph.height(Math.max(320, Math.min(650, desiredH)));
                Graph.width(window.innerWidth - graphExtraWidthSmall);
                sideSizeMin = 1;
                sideSizeMax = window.innerHeight;
            } else {
                Graph.height(window.innerHeight - graphExtraHeight);
                Graph.width(window.innerWidth - graphExtraWidth);
                sideSizeMin = window.innerHeight - graphExtraSideHeight;
                sideSizeMax = window.innerHeight - graphExtraSideHeight;
            }

            populateInstructions();
            populateNavInfo();
            setSidebarSize(sideSizeMin,sideSizeMax);
            resetGraph();
        }
    
        // set max height on sidemenu (we are doing it with javaScript to integrate it with the graph resizing)
        function setSidebarSize(sizeMin, sizeMax){
            var sideMenu = document.getElementById("side-menu");

            sideMenu.style.maxHeight = sizeMax.toString()+'px'
            sideMenu.style.minHeight = sizeMin.toString()+'px'
        }

        //some versions of this graph have different color schemes, which is why this is so long    
        function setHighlightColor() {
            // Set node color, colored if highlighted, translucent otherwise
            if (coloring == 1) {
                Graph.nodeColor(node => targetNodes.has(node)||incomingNodes.has(node)||outgoingNodes.has(node) ? node.color1 : 'rgba(211, 211, 211, 0.3)');
            } else if (coloring == 2) {
                Graph.nodeColor(node => targetNodes.has(node)||incomingNodes.has(node)||outgoingNodes.has(node) ? node.color2 : 'rgba(211, 211, 211, 0.3)');
            } else {
                Graph.nodeColor(node => targetNodes.has(node)||incomingNodes.has(node)||outgoingNodes.has(node) ? node.Color : 'rgba(211, 211, 211, 0.3)');
            }
            // Set link colors, dependent on background color
            if (backgroundColor == "dark") {
                Graph.linkColor(link => inHighlightLinks.has(link) ? '#ffffff': outHighlightLinks.has(link) ? '#ffffff' : 'rgba(211, 211, 211, 0.3)');
            } else {
                Graph.linkColor(link => inHighlightLinks.has(link) ? '#888888': outHighlightLinks.has(link) ? '#888888' : 'rgba(211, 211, 211, 0.3)');
            }

            setBeads();
            Graph.linkWidth(1.5);
        }

        function setBeads(){
            //Add moving particles (Dr Fields really likes them)
            if (beads == "out") {
                Graph.linkDirectionalParticles(link => inHighlightLinks.has(link) ? 6 : 0);
            } else if (beads == "in") {
                Graph.linkDirectionalParticles(link => outHighlightLinks.has(link) ? 6 : 0);
            } else if(beads == "both"){
                Graph.linkDirectionalParticles(link => inHighlightLinks.has(link) ? 6 : outHighlightLinks.has(link) ? 6 : 0);
            } else if(beads == "none"){
                Graph.linkDirectionalParticles(0);
            }

            Graph.linkDirectionalParticleWidth(4);
            Graph.linkDirectionalParticleSpeed(.005);
            Graph.linkDirectionalParticleResolution(8);
        }
    
        //zoom to proper size
        function resetGraph() {
            destroyLabel();
            Graph.zoomToFit(500, -75)
        }
        
        //change background color and link color
        function changeBackgroundColor() {
            buttonText = document.getElementById("button3");
            var navInfo = document.getElementsByClassName("scene-nav-info")[0];
            if (backgroundColor === 'dark') {
                backgroundColor = 'light'
                Graph.backgroundColor(lightBackgroundColor);
                Graph.linkColor(link => '#888888');
                if (buttonText) {
                    buttonText.innerHTML = "Dark Mode";
                }
                if (navInfo) {
                    navInfo.style.color = "#222222";
                }
            } else {
                Graph.backgroundColor(darkBackgroundColor);	
                backgroundColor = 'dark';
                Graph.linkColor(link => '#ffffff');
                if (navInfo) {
                    navInfo.style.color = "#fafafa";
                }
                if (buttonText) {
                    buttonText.innerHTML = "Light Mode";
                }
            }

            if(highlightMode == true) {
                setHighlightColor();
            }

            updateTooltipColor();
            updatePopupColor();
        }
    
        //tooltip color has to be updated seperately
        function updateTooltipColor(){
            var tooltip = document.getElementsByClassName("scene-tooltip")[0]; 
            if (!tooltip || !tooltip.style) {
                return;
            }
            if (backgroundColor === 'dark') {
                tooltip.style.backgroundColor = transparentDark;
                tooltip.style.color = "#ffffff";
            } else {
                tooltip.style.backgroundColor = "rgba(228,237,240, 0.5)";
                tooltip.style.color = "#000000";	  
            }
        }
    
        //change label color if needs be
        function updatePopupColor(){
            var popup = document.getElementById("popup"); 

            if (popup) {
                if (backgroundColor === 'dark') {
                    popup.style.backgroundColor = transparentDark;
                    popup.style.color = "#ffffff";
                } else {
                    popup.style.backgroundColor = transparentlight;
                    popup.style.color = "#000000";	  
                }
            }
        }
    
        // Function change direction of influence beads 
        function cycleBeads(){
            if (beads == "in") {
                beads = "out";
            } else if (beads == "out"){
                beads = "both";
            } else if (beads == "both"){
                beads = "none";
            } else if (beads == "none"){
                beads = "in";
            }
            setBeads();
        }

        // Functions to change graph between 3-D and 2-D
        function updateDimensions(){
            Graph.numDimensions(dimensions);
        }
        function cycleDimensions(){
            destroyLabel();

            var button = document.getElementById("button2");       
            var explanationText = document.getElementById('Explanation');

            if (dimensions == 3) {
                dimensions = 2;
                button.innerHTML = "Change to 3-D";
            } else {
                dimensions = 3;
                button.innerHTML = "Change to 2-D";
            }

            populateExplanation();
            updateDimensions();
        }
    
        //Cycle through different color schemes 
        function changeColors(colorInt, colorText){
            elem = document.getElementById("legend-title");
            elem.innerHTML = `Colored by ${colorText}`;
            coloring = colorInt;
            populateCheckboxes();
            dehighlightGraph();
            checkAll(true);
        }
    
        // Checkbox functions    
        function checkAll(checked){ 
            var speakersLength = 0;
            var list = [];

            if (coloring == 1) {
                list = speakers1;
            } else if (coloring == 2) {
                list = speakers2;
            } else {
                list = speakers;
            }

            speakersLength=list.length;

            for (var i = 0; i < speakersLength; i++) {
                document.getElementById(list[i]).checked = checked;
            }

            updateVisibleLinks();
            check();
        }
    
        //loop over checkbox item for each element in list of all speakers
        function check(){
            //Clear names set and color nodes
            onNames.clear();
            colorNodes.clear();
            highlightLinks.clear();

            var nodes = Graph.graphData().nodes;
            var links = Graph.graphData().links;
            // loop over all speakers, add each checked one to set
            var speakersLength = 0;
            var list = [];

            if (coloring == 1) {
                speakersLength=speakers1.length;
                list = speakers1;
            } else if (coloring == 2) {
                speakersLength=speakers2.length;
                list = speakers2;
            } else {
                speakersLength=speakers.length;
                list = speakers;
            }

            for (var i = 0; i < speakersLength; i++) {
                var x = document.getElementById(list[i]).checked;

                if (x == true) {
                    onNames.add(document.getElementById(list[i]).id);
                }
            }
            //iterate over nodes
            for (index = 0; index < nodes.length; index++) {
                node = nodes[index];
                //add correct nodes to the set
                if (coloring == 1) {
                    if (onNames.has(node.group1)) {
                        colorNodes.add(node);
                    }
                } else if (coloring == 2) {
                    if (onNames.has(node.group2)) {
                        colorNodes.add(node);
                    }
                } else{
                    if (onNames.has(node.Speaker)) {
                        colorNodes.add(node);
                    }
                }  
            }

            for (index = 0; index < links.length; index++) {
              link = links[index];
              //add correct links to the set
              if (colorNodes.has(link.source)) {
                    if (colorNodes.has(link.target)) {
                        highlightLinks.add(link);   
                    }
                }	  
            }

            updateVisibleLinks();
            Graph.nodeVisibility(node => colorNodes.has(node) ? 1 : 0); 
        }

        // if you want something to float over graph (like a label), use this
        function positionElement(element,x,y){
            element.style.left = x+'px';
            element.style.top = y+'px';
        };
    
        //export graph info of current node and edge positions
        function exportSnapshot(){
            var nodes = Graph.graphData().nodes;
            var links = Graph.graphData().links;
            nodesJSON = JSON.stringify(nodes, null, 4);
            console.log(nodesJSON);

            linksJSON = "[";

            for (index = 0; index < links.length; index++) {
                link = links[index];
                info = `\n{
                    "weight": ${link.Line_Width},
                    "sourceX": ${link.source.x},
                    "sourceY": ${link.source.y},
                    "sourceZ": ${link.source.z},
                    "targetX": ${link.target.x},
                    "targetY": ${link.target.y},
                    "targetZ": ${link.target.z}
                },`
                linksJSON += info;
            }

            noTrailingComma = linksJSON.slice(0, -1);
            noTrailingComma += "\n]";
            console.log(noTrailingComma);
        }

        // accordion info   
        function openTab(tab){
            var explanation = document.getElementById(tab);
            if (!explanation) return;
            var open = explanation.classList.contains("active")
            closeAccordion();
            if (!open) {
                explanation.classList.add("active");
                var panel = explanation.nextElementSibling;
                if (!panel) return;
                panel.style.maxHeight = '200vh';
                var minHeight;
                if (window.innerWidth < 500) {
                    minHeight = 0;
                } else {
                    minHeight = window.innerHeight - minAccordionHeight;
                }

                panel.style.minHeight = minHeight.toString()+'px'
            }
        }

        function closeAccordion(){
            var accordion = document.getElementsByClassName("accordion");
            var i;

            for (i = 0; i < accordion.length; i++) {
                var current = accordion[i];
                current.classList.remove('active');
                var panel = current.nextElementSibling;
                if (!panel) continue;
                panel.style.maxHeight = null;
                panel.style.minHeight = null;
            }
        }
      
        // go to a certain speaker
        function flyToSpeaker(){
            selectedNode = null;
            var speaker = document.getElementById("bookSelect").value;

            goToSpeaker(speaker); 
        }
    
        //Manually update the color and size of nav info, or give mobile directions if relevant
        function populateNavInfo(){
            if (window.innerWidth > 500) {
                document.getElementsByClassName("scene-nav-info")[0].style.fontSize = "15px";
                document.getElementsByClassName("scene-nav-info")[0].innerHTML = "Left-click: rotate; mouse-wheel/middle-click: zoom; right-click: pan."
            } else {
                document.getElementsByClassName("scene-nav-info")[0].style.fontSize = "12px";
                document.getElementsByClassName("scene-nav-info")[0].innerHTML = "Drag to rotate; pinch to zoom; two-finger drag to pan."
            }

            if (backgroundColor === 'dark') {
                document.getElementsByClassName("scene-nav-info")[0].style.color = "#fafafa";        
            } else {
                document.getElementsByClassName("scene-nav-info")[0].style.color = "#222222";
            }
        }
        
        //turn connections on or off (off improves performance on large datasets)
        function toggleConnections(){
            var button = document.getElementById("button4");

            if (connectionDisplay === 1) {
                connectionDisplay = 0;
                button.innerHTML = "Connections On"
            } else {
                connectionDisplay = 1;
                button.innerHTML = "Connections Off"
            }

            updateVisibleLinks();
        }
    
        //create checkboxes
        function populateCheckboxes(){
            checkboxHolder = document.getElementById("checkbox-holder")

            if (coloring == 1) {
                checkboxHolder.innerHTML = checkboxes1
            } else if(coloring == 2) {
                checkboxHolder.innerHTML = checkboxes2
            } else {
                checkboxHolder.innerHTML = checkboxes
            }  
        }

        //create explanation
        function populateExplanation(){
            explanation = document.getElementById("explanation")
            explanation.innerHTML = `
            <h3>What am I looking at?</h3>
            <br>
            This network diagram represents the Book of Mormon. Each sphere (node) represents about 1000 words by a given speaker.
            <br>
            <br>
            The documents are connected by lines that indicate similarity. These lines are invisible by default to improve performance, but the connections can be turned on using the button at the bottom of the screen.
            <br>
            <br>
            The nodes float in 3-D space, with similar nodes close together.
            The connections ‘pull’ the documents into their positions. The result is a ${dimensions}-D network grouped by text similarity.
            <br>
            <br>
            Find more information in the <div class="appear" onclick="faqAppear()">FAQ</a>.
            `;
        }

        //create instructions 
        function populateInstructions(){
            instructions = document.getElementById("instructions")

            if (window.innerWidth>500) {
                instructions.innerHTML = fullInstructions
            } else {
                instructions.innerHTML = mobileInstructions 
            }
        }

        function showSpeakerInfo(speaker) {
            var info = document.getElementById('info');
            var url = getUrlFromSpeaker(speaker);

            par = speaker+'Paragraph';

            info.innerHTML =  `<div id ='nodeinfo'>
            <h3>Speaker:</h3>${speakerToDisplay[speaker]}<br>
            <br>
                <img src="${url}" alt="Portrait of ${speakerToDisplay[speaker]}"><br>
            <br>
            <br>
            <h3>Description:</h3>
                ${myDict[par]}<br>
            <br>        
            </div>
            `; 
        }
    

        //populate info in info tab
        function showNodeInfo(node) {
            var info = document.getElementById('info');
            var url = getUrlFromSpeaker(node.Speaker);

            var in_connections, out_connections;

            // get the nodes structure
            var nodes_struct = Graph.graphData().nodes;
  
            // get the incoming IDs
            var In_IDs = node.Incoming_Ids.split(' ');
            let size = In_IDs.length;

            // check for empty array
            if(In_IDs[0] == "None")
            {
              size = 0;
              in_connections = "0<br>";
            }
            else
              in_connections = "";

            var last_speaker = "";

            // copy the info into in_connections
            for(let i = 0; i < size; i++)
            {
               // only print the speaker once
               if(last_speaker != nodes_struct[In_IDs[i]].Speaker)
               {
                  last_speaker = nodes_struct[In_IDs[i]].Speaker;
                  in_connections += "<b>" + nodes_struct[In_IDs[i]].Display_Speaker + ": </b><br>"; 
               }

                in_connections +=  nodes_struct[In_IDs[i]].Start_Link 
                   + "--" + nodes_struct[In_IDs[i]].End_Link + "<br>";
            }

            // get the outgoing IDs
            var Out_IDs = node.Outgoing_Ids.split(' ');
            size = Out_IDs.length;

            // check for empty array
            if(Out_IDs[0] == "None")
            {
              size = 0;
              out_connections = "0<br>";
            }
            else
              out_connections = "";

            last_speaker = "";

            // copy the info into out_connections
            for(let i = 0; i < size; i++)
            {
            // only print the speaker once
               if(last_speaker != nodes_struct[Out_IDs[i]].Speaker)
               {
                  last_speaker = nodes_struct[Out_IDs[i]].Speaker;
                  out_connections += "<b>" + nodes_struct[Out_IDs[i]].Display_Speaker + ": </b><br>"; 
               }

                out_connections +=  nodes_struct[Out_IDs[i]].Start_Link 
                   + "--" + nodes_struct[Out_IDs[i]].End_Link + "<br>";
            }
            // assemble the info
            info.innerHTML =  `<div id ='nodeinfo'>
<!--            <h3>Node:</h3> 
            ${node.Display_Name}<br>-->

            <h3>Speaker:</h3>
            ${node.Display_Speaker}<br>
            <br>       
                <img src="${url}" alt="Portrait of ${node.Speaker}"><br>
            <br>
            <h3>Reference:</h3>
            ${node.Start_Link}--${node.End_Link}<br>
            <br>
            <h3>Incoming Connections</h3>
            ${in_connections}
            <br>    
            <h3>Outgoing Connections</h3>
            ${out_connections}
            <br>
            </div>
            `; 
        /*
            if(info.childNodes.length > 1)
            {
               for(let i = 1; i < info.childNodes.length; i++)
                 info.innerHTML += info.childNodes[i];
            }
            console.log(`childNodes = ${info.childNodes.length}`);
                                  */
        }

        function getUrlFromSpeaker(speaker){
            return assetBase
                ? new URL("../../Images/" + speaker + ".jpg", assetBase + "/").toString()
                : "../../Images/" + speaker + ".jpg";
        }
    
        function goToSpeaker(speaker, attempt){
            destroyLabel();
            var tries = Number(attempt || 0);
            var nodes = Graph.graphData().nodes || [];
            if (!nodes.length) {
                if (tries < 40) {
                    setTimeout(function () { goToSpeaker(speaker, tries + 1); }, 150);
                }
                return;
            }

            if (speakers.includes(speaker)) {
                document.getElementById("bookSelect").value = speaker;
                highlightSpeaker(speaker);
                setTimeout(() => {createLabel(speaker); }, 1000);
            }
        }    

        // --- Popup label tracking (keep the label next to the selected speaker) ---
        let popupRafId = null;
        let popupSpeaker = null;

        function stopPopupTracking(){
            if (popupRafId !== null) {
                cancelAnimationFrame(popupRafId);
                popupRafId = null;
            }
        }

        function startPopupTracking(speaker){
            stopPopupTracking();
            popupSpeaker = speaker;

            const tick = () => {
                const label = document.getElementById('popup');
                if (!label || !popupSpeaker) {
                    popupRafId = null;
                    return;
                }

                const canvas = document.querySelector('#graph-3d canvas');
                if (!canvas) {
                    popupRafId = requestAnimationFrame(tick);
                    return;
                }

                // Keep text in sync in case selection changes without recreating the popup
                const desiredText = speakerToDisplay[popupSpeaker] || popupSpeaker;
                if (label.textContent !== desiredText) label.textContent = desiredText;
                label.style.color = "#ffffff";

                // graph2ScreenCoords is canvas-relative; convert to viewport coords with canvas rect.
                const canvasRect = canvas.getBoundingClientRect();
                const coords = calculateGeometricMean(popupSpeaker);
                positionElement(label, canvasRect.left + coords.x + 12, canvasRect.top + coords.y - 12);

                popupRafId = requestAnimationFrame(tick);
            };

            popupRafId = requestAnimationFrame(tick);
        }

        //create label       
        function createLabel(speaker){     
            //get rid of old label
            destroyLabel();
            // create a new div element 
            const newDiv = document.createElement("div"); 
            // Put something in the div
            newDiv.innerHTML = `${speakerToDisplay[speaker]}`;
            // Give class to popup
            newDiv.id = 'popup';

            if (backgroundColor == 'dark') {
                newDiv.style.backgroundColor = transparentDark;
            } else {
                newDiv.style.backgroundColor = transparentlight;
            }

            newDiv.style.color = "#ffffff";
            document.body.append(newDiv); 
            // Keep the popup pinned to the speaker while rotating/zooming/panning.
            startPopupTracking(speaker);
        };
        //helper function for array averaging
        function calculateMeanOfArray(arr){
            sum = 0;

            for (index = 0; index < arr.length; index++) {
                sum += arr[index]
            }

            return sum / arr.length
        }
        //calculate center point in 3d space and translate it to screen coordinates
        function calculateGeometricMean(speaker){
            var nodes = Graph.graphData().nodes;

            Xs = [];
            Ys = [];
            Zs = [];

            for (index = 0; index < nodes.length; index++) {
                node = nodes[index];

                if (node.Speaker == speaker) {
                    Xs.push(node.x);
                    Ys.push(node.y);
                    Zs.push(node.z);
                }
            }

            return(Graph.graph2ScreenCoords(calculateMeanOfArray(Xs), calculateMeanOfArray(Ys), calculateMeanOfArray(Zs)));
        }

        //get rid of label
        function destroyLabel(){
            stopPopupTracking();
            var label = document.getElementById('popup');

            if (label) {
                label.remove();
            }
        }

        //highlight a given speaker
        function highlightSpeaker(speaker){

            var nodes = Graph.graphData().nodes;
            var node = null;

        for (index = 0; index < nodes.length; index++) {
            if (nodes[index] && nodes[index]["Speaker"] == speaker) {
              node = nodes[index];
              break;
            }
          }
          // Fallback for legacy data shapes that may use Label as the speaker id.
          if (!node) {
            for (index = 0; index < nodes.length; index++) {
              if (nodes[index] && nodes[index]["Label"] == speaker) {
              node = nodes[index];
              break;
              }
            }
          }
          if (!node) return;

          // Set the selected node for highlighting
          selectedNode = node;

          // Keep the main speaker dropdown in sync with the currently selected node.
          // This does not dispatch a change event (so it won't trigger flyToNode loops).
          if (selectedNode && selectedNode.Speaker) {
            const selectEl = document.getElementById("bookSelect");
            if (selectEl) selectEl.value = selectedNode.Speaker;
          }

            // loop over all nodes
            // if speaker matches speaker, set to colored, else grey
            // do the same with links
            targetNodes.clear();   //   clear the selected node
            highlightMode = true;
            // Clear the highlights of links and nodes
            inHighlightLinks.clear();
            outHighlightLinks.clear();
            incomingNodes.clear();
            outgoingNodes.clear();	


            for (index = 0; index < nodes.length; index++) {
                node = nodes[index];
                if (node['Speaker'] == speaker) {
                    outgoingNodes.add(node);
                }
            }
            // Set which links to highlight 
            check();
            setHighlightColor();
            updateVisibleLinks();
            showSpeakerInfo(speaker);
            closeAccordion();
            openTab('infoTab');
        }

        //highlight a given node
        function highlightNode(node){
            destroyLabel();    // remove any existing labels

        // Set the selected node for highlighting
          selectedNode = node;
          // Keep the main speaker dropdown in sync with the currently selected node.
          if (selectedNode && selectedNode.Speaker) {
            const selectEl = document.getElementById("bookSelect");
            if (selectEl) selectEl.value = selectedNode.Speaker;
          }



            highlightMode = true;
            targetNodes.clear();
                targetNodes.add(node);		
            // Clear the highlights of links and nodes
            inHighlightLinks.clear();
            outHighlightLinks.clear();
            incomingNodes.clear();
            outgoingNodes.clear();	
            // Loop over all nodes and get ins and outs
            targetNodes.forEach((node) => {
                Nodes = node.Incoming_Ids.split(' ');
                var outNum = Nodes.map(Number);
                var links = Graph.graphData().links;
                var nodes = Graph.graphData().nodes;

                outNum.forEach(num => outgoingNodes.add(nodes[num]));	
            });

            targetNodes.forEach((node) => {
                Nodes = node.Outgoing_Ids.split(' ');
                var outNum = Nodes.map(Number);
                var links = Graph.graphData().links;
                var nodes = Graph.graphData().nodes;

                outNum.forEach(num => outgoingNodes.add(nodes[num]));	
            });
            // Set which links to highlight 
            var links = Graph.graphData().links;
            for (index = 0; index < links.length; index++) {
                link = links[index];
                if (targetNodes.has(link.source)) {
                    inHighlightLinks.add(link);
                } else if (targetNodes.has(link.target)) {
                    outHighlightLinks.add(link);
                }
            };

            check();
            setHighlightColor();
            updateVisibleLinks();
            showNodeInfo(node);
            closeAccordion();
            openTab('infoTab');
        }

        //get query variable from url
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

        function getQueryVariable(variable){
            const urlParams = new URLSearchParams(window.location.search);
            const list = (typeof idNames !== "undefined" && idNames.length)
                ? idNames
                : ((typeof speakers !== "undefined" && speakers.length) ? speakers : []);
            if (urlParams.get("speaker") !== null) {
                return normalizeSpeakerParam(list, urlParams.get("speaker"));
            } else {
                let path = window.location.pathname;
                let pathArray = path.substr(1).split("/");
                
                if (pathArray[1] == "speaker") {
                    return normalizeSpeakerParam(list, pathArray[2]);
                }
            }
        }

        //go to speaker from url query
        const DEFAULT_SPEAKER = "Nephi";
        const mountSpeaker =
            (global.SpeakersNetworkWidgetOptions &&
             global.SpeakersNetworkWidgetOptions.speaker) || "";

        function goToURLSpeaker(){
            var speaker = getQueryVariable('speaker') || mountSpeaker || DEFAULT_SPEAKER;
            
            if (speaker && speakers.includes(speaker)) {
                document.getElementById("bookSelect").value = speaker;
                return true;
            } else {
                return null;
            }
            return false;
        }

        function faqDisappear(){
            var elem = document.getElementById("faq");
            if (elem) elem.style.visibility = "hidden";
            var elem2 = document.getElementById("grey-out");
            if (elem2) elem2.style.visibility = "hidden";
        }

        function faqAppear(){
            var elem = document.getElementById("faq");
            if (elem) elem.style.visibility = "visible";
            var elem2 = document.getElementById("grey-out");
            if (elem2) elem2.style.visibility = "visible";
        }

        // We wait a few seconds after page load before we set all of these things
        const hasParam = goToURLSpeaker();
        const startupSpeaker = document.getElementById("bookSelect")
            ? document.getElementById("bookSelect").value
            : (mountSpeaker || DEFAULT_SPEAKER);
        if (hasParam) {
          setTimeout(() => { goToSpeaker(startupSpeaker); }, 2500);
        } else {
          setTimeout(() => { goToURLSpeaker(); }, 2500);
        }
        setTimeout( () => { resetGraph(); }, 2000);
        setTimeout( () => { check(); }, 3000);
        setTimeout( () => { updateVisibleLinks(); }, 3500);

        // Now, execute the functions necessary to start the first initial page
        populateExplanation();
        populateCheckboxes();
        populateInstructions();
        populateNavInfo();
        // We only want to open the explanation tab if we're not on mobile.
        if (window.innerWidth > 500) {
            openTab('explanationTab');
        }

        resizeGraph();
        checkAll(true);	    
        Graph.nodeVisibility(1); 
        setSidebarSize(sideSizeMin,sideSizeMax);
        changeBackgroundColor();

        global.resetGraph = resetGraph;
        global.cycleDimensions = cycleDimensions;
        global.changeBackgroundColor = changeBackgroundColor;
        global.toggleConnections = toggleConnections;
        global.cycleBeads = cycleBeads;
        global.openTab = openTab;
        global.flyToSpeaker = flyToSpeaker;
        global.check = check;
        global.checkAll = checkAll;
        global.changeColors = changeColors;
        global.faqDisappear = faqDisappear;
        global.faqAppear = faqAppear;

        global.SpeakersNetworkWidgetApi = {
            resize: function () {
                resizeGraph();
            },
            destroy: function () {
                stopPopupTracking();
                global.removeEventListener('resize', resizeGraph);
                global.removeEventListener('resize', appHeight);
                if (Graph && typeof Graph.pauseAnimation === 'function') {
                    Graph.pauseAnimation();
                }
            }
        };
})(window);
