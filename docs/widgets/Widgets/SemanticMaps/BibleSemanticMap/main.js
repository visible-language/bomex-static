
        //variables needed to draw graph
        var graphData = [];
        var transform =d3.zoomTransform(0);
        var x;
        var y;
        var quadTree = d3.quadtree();
        var biggerDimension;
        var smallerDimension;
        var xTranslate = 0;
        var yTranslate = 0;
        var width = window.innerWidth-1;
        var height = window.innerHeight-1;
        var htmlCanvas = null;
        var context = null;
        var scaleX;
        var scaleY;
        var radius;
        var colors = [];
        var batches = [];
        const pi2 =  Math.PI * 2;
        var currentMouseX = 0;
        var currentMouseY = 0;
        var lastTouchSelectAt = 0;
        var menuOn = false;
        var lastColor = '#ffffff';
        var lastText = '';

        function syncCanvasSize() {
            if (!htmlCanvas) return;
            var rect = htmlCanvas.getBoundingClientRect();
            var nextWidth = Math.max(1, Math.floor(rect.width));
            var nextHeight = Math.max(1, Math.floor(rect.height));
            if (htmlCanvas.width !== nextWidth) {
                htmlCanvas.width = nextWidth;
            }
            if (htmlCanvas.height !== nextHeight) {
                htmlCanvas.height = nextHeight;
            }
            width = nextWidth;
            height = nextHeight;
        }

        //calculate the center of the graph
        function calculate_center(){
            if(width >=height){
                smallerDimension = height;
                biggerDimension = width;
            }else{
                smallerDimension = width;
                biggerDimension = height;
            }
            xs = d3.extent(graphData.map(function(value,index) {return value[0];}));
            ys = d3.extent(graphData.map(function(value,index) {return value[1];}));
            var xRange = Math.max(1, xs[1] - xs[0]);
            var yRange = Math.max(1, ys[1] - ys[0]);
            var paddingFactor = smallerDimension < 500 ? 0.06 : 0.12;
            scaledXs = [xs[0] - (xRange * paddingFactor), xs[1] + (xRange * paddingFactor)];
            scaledYs = [ys[0] - (yRange * paddingFactor), ys[1] + (yRange * paddingFactor)];
            x = d3.scaleLinear().domain(scaledXs).range([0, smallerDimension]);
            y = d3.scaleLinear().domain(scaledYs).range([smallerDimension, 0]);
            d3.select(htmlCanvas).call(zoom_function);
        }

        //load json using d3
        var semanticBase = window.SemanticMapWidgetAssetBase || '';
        d3.json(semanticBase + "/BibleSemanticMap/bible_scatter.json").then(function(data) {
            data.forEach(function(element){
                const a = Math.floor(element['x']);
                const b = Math.floor(element['y']);
                const color = element['color'];
                const ref = element['ref'];
                const ref_long = element['verse_long'];
                const verse_text = element['text'];
                const href = element['href'];
                graphData.push([a, b, color, ref, ref_long, verse_text, href, 1]);
                if(!colors.includes(color)){
                    colors.push(color);
                }
            });
            htmlCanvas = document.getElementById('plot');
            syncCanvasSize();
            d3.select(htmlCanvas).on("click", onClick);
            htmlCanvas.addEventListener("pointerup", onPointerUp);
            context = htmlCanvas.getContext('2d');
            batchData(graphData);
            calculate_center();
            quadTree.extent([[-1, -1], [width + 1, height + 1]]).addAll(graphData);
            resetZoom();
            setTimeout(() => {document.getElementById("loader").remove();}, "500");
        });

        //track mouse position
        document.addEventListener("mousemove", logPosition);
        function logPosition(e) {
            var coords = getCanvasCoordinates(e);
            currentMouseX = coords[0];
            currentMouseY = coords[1];
        }

        function getCanvasCoordinates(e) {
            if (!htmlCanvas) return [0, 0];
            var rect = htmlCanvas.getBoundingClientRect();
            if (e && e.changedTouches && e.changedTouches.length) {
                return [e.changedTouches[0].clientX - rect.left, e.changedTouches[0].clientY - rect.top];
            }
            if (e && e.touches && e.touches.length) {
                return [e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top];
            }
            if (e && typeof e.clientX === "number" && typeof e.clientY === "number") {
                return [e.clientX - rect.left, e.clientY - rect.top];
            }
            return [currentMouseX, currentMouseY];
        }

        function onPointerUp(e) {
            if (!e || e.pointerType !== "touch") return;
            lastTouchSelectAt = Date.now();
            onClick(e);
        }

        //highlight a given node
        function highlightNode(name){
            dehighlightNode();
            var lowerName = name.toLowerCase();
            for(let i = 0; i < graphData.length; i++){
                if(graphData[i][4].toLowerCase() == lowerName | graphData[i][3].toLowerCase() == lowerName){
                    point = graphData[i]
                    graphData.push([point[0], point[1], 'rgba(0, 0, 0, 0.4)', point[3], point[5], 7]);
                    graphData.push([point[0], point[1], '#000', point[3], point[5], 1.1]);
                    writeVerse(point);
                    draw();
                    return true;
                }
            }
            return false;
        }

        //dehighlight the highlighted node (if exists)
        function dehighlightNode(){
            //we've reserved black as the highlighted node color. If you don't do that, you might break everything
            if(graphData.at(-1)[2] == '#000'){
                graphData.pop();
                graphData.pop();
                draw();
            }
        }

        //batch the data so that instead of drawing each point indifidually we batch the points by color and only draw points 50ish times instead of several thousand (very good for performance)
        function batchData(data){
            colors.forEach(function(color){
                var batch = []
                data.forEach(function(point){
                    if(point[2] == color){
                        batch.push([point[0], point[1], point.at([-1])]);
                    }
                })
                batches.push([batch, color]);         
            })
        }

        //zoom to a good starting point
        function resetZoom(){
            var t = d3.zoomIdentity;
            d3.select(htmlCanvas).transition()
            .duration(300)
            .ease(d3.easeCubicInOut)
            .call(zoom_function.transform, t);
        }

        // Draw plot on canvas
        function draw() {
            scaleX = transform.rescaleX(x);
            scaleY = transform.rescaleY(y);
            context.clearRect(0, 0, width, height);
            radius = Math.sqrt(transform.k);
            //draw points individually if zoomed in (we can draw individually because there's not as many on the screen)
            if (transform['k'] > 10){
                graphData.forEach( point => {
                drawPoint(point);
            })}else{
                //draw in batches otherwise
                for(let i = 0; i < batches.length; i++){
                    batch = batches[i];
                    drawBatch(batch[0], batch[1]);
                }
                if(graphData.at([-1])[2] == '#000'){
                    drawPoint(graphData.at([-1]));
                    drawPoint(graphData.at([-2]));
                }
            }
        }

        //function to draw points individually
        function drawPoint(point) {
            context.beginPath();
            context.fillStyle = point[2];
            context.strokeStyle = '#fff';
            if(point[2]=='#000'){
                context.strokeStyle = '#000';
            } 
            const px = scaleX(point[0]);
            const py = scaleY(point[1]);
            context.arc(px, py, point.at(-1) *radius, 0, pi2, true);
            context.stroke();
            context.fill();
        }

        //draw points as batches for efficiency
        function drawBatch(list, color){
            context.fillStyle = color;
            context.strokeStyle = '#fff';
            context.beginPath();
            list.forEach(function(point){
                const px = scaleX(point[0]);
                const py = scaleY(point[1]);
                //draw cirles if zoomed in a little
                if (transform['k'] > 2.5){
                    context.moveTo(px + point.at(-1)*radius, py ); 
                    context.arc(px, py, point.at(-1)*radius, 0, pi2, true);
                }else{
                    //squares are much less costly, when displaying the whole graph
                    context.rect(px, py, 1.5 * point.at(-1) * radius, 1.5* point.at(-1) * radius);
                }
            });
            context.fill();
        }

        //quick little helper function for disctane
        function euclideanDistance(x1, y1, x2, y2) {
            return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        }

        // Zoom/Drag handler
        const zoom_function = d3.zoom().scaleExtent([1, 1000])
        .on('zoom', (event) => {
                transform = event.transform;
                context.save();
                draw(transform);
                context.restore();
                context = htmlCanvas.getContext('2d');
            });
        function resizeWindow(){
            syncCanvasSize();
            calculate_center();
            quadTree.extent([[-1, -1], [width + 1, height + 1]]);
            draw(transform);
        }
        window.addEventListener('resize', resizeWindow);

        // Deal with clicks
        function onClick(e) {
            if (e && e.type === "click" && Date.now() - lastTouchSelectAt < 350) {
                return;
            }
            var mouse = getCanvasCoordinates(e);
            // map the clicked point to the data space
            var xClicked = scaleX.invert(mouse[0]);
            var yClicked = scaleY.invert(mouse[1]);
            // find the closest point in the dataset to the clicked point
            var closest = quadTree.find(xClicked,yClicked);
            // map the coordinates of the closest point to the canvas space
            var dX = scaleX(closest[0]);
            var dY = scaleY(closest[1]);
            // register the click if the clicked point is in the radius of the point
            var distance = euclideanDistance(mouse[0], mouse[1], dX, dY);
            var pickRadius = Math.max((e && e.pointerType === "touch") ? 14 : 8, radius * 2.2);
            if(distance < pickRadius) {
                highlightNode(closest[3]);
            }else{
                verseSpace = document.getElementById('verse-space');
                referenceSpace = document.getElementById('reference-space');
                referenceSpace.innerHTML = "No Verse Selected";
                verseSpace.innerHTML = "Click on a verse to display its text here.";
                dehighlightNode();
            }
        }

        // Check whether we are hovering over a node
        function checkHover(e){
            if(!menuOn){
                // map the clicked point to the data space
                var xClicked = scaleX.invert(currentMouseX);
                var yClicked = scaleY.invert(currentMouseY);
                // find the closest point in the dataset to the clicked point
                var closest = quadTree.find(xClicked,yClicked);
                // map the coordinates of the closest point to the canvas space
                var dX = scaleX(closest[0]);
                var dY = scaleY(closest[1]);
                // register the hover if the hovered point is in the radius of the point
                var distance = euclideanDistance(currentMouseX, currentMouseY, dX, dY);
                if(distance < Math.sqrt(transform['k']+1)) {
                    var color = closest[2];
                    var book =  closest[4].split(' ')[0];
                    if(book == '1'||book == '2'||book == '3'||book == '4'){
                        book = book + ' ' + closest[4].split(' ')[1];
                    }
                    if(lastColor != color){
                        lastColor = color;
                        lastText  = book;
                        updateLegend();
                    }
                }    
            }    
        }

        function updateLegend(){
            word = document.getElementById("legend-name");
            word.innerHTML = lastText;
            dot = document.getElementById("dot");
            dot.style.backgroundColor = lastColor;
        }

        //Check periodically if the mouse is stationary
        let lastMouseX = -1; // Initialize with a value outside the possible range
        let lastMouseY = -1; // Initialize with a value outside the possible range
        let stationaryThreshold = 5; // Adjust this value to set the sensitivity of the stationary detection
        let stationaryTimeThreshold = 25; // Time in milliseconds to consider the mouse stationary

        function isMouseStationary() {
            if (lastMouseX === -1 && lastMouseY === -1) {
                // Initial position
                lastMouseX = currentMouseX;
                lastMouseY = currentMouseY;
                return false;
            }
            const deltaX = Math.abs(currentMouseX - lastMouseX);
            const deltaY = Math.abs(currentMouseY - lastMouseY);
            if (deltaX <= stationaryThreshold && deltaY <= stationaryThreshold) {
                // Mouse is stationary
                return true;
            }
            // Update last position
            lastMouseX = currentMouseX;
            lastMouseY = currentMouseY;
            return false;
        }

        let stationaryTimer;
        document.addEventListener("mousemove", () => {
            clearTimeout(stationaryTimer);
            if (isMouseStationary()) {
                stationaryTimer = setTimeout(() => {
                checkHover();
                }, stationaryTimeThreshold);
            }
        });

        function helpAppear(){
            menuOn = true;
            help = document.getElementById('help-holder');
            background = document.getElementById('cover');
            help.style.visibility = "visible";
            background.style.visibility = "visible";
        }

        function helpDisappear(){
            menuOn = false;
            help = document.getElementById('help-holder');
            background = document.getElementById('cover');
            help.style.visibility = "hidden";
            background.style.visibility = "hidden";
        }
        
        // I did not write this autocomplete, just adapted it
        const autoCompleteJS = new autoComplete({
            submit: true,
            data: {
                src: verses
            },
            placeHolder: "Search for a verse",
            resultsList: {
                noResults: true,
                maxResults: 25,
                tabSelect: true
            },
            resultItem: {
                element: (item, data) => {
                item.style = "display: flex; justify-content: space-between;";
                item.innerHTML = `
                <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">
                    ${data.match}
                </span>`;
                },
                highlight: true
            },
            events: {
                input: {
                    focus: () => {
                        if (autoCompleteJS.input.value.length) autoCompleteJS.start();
                    }
                }
            }
        });

        //write the verse text when a point is clicked on
        function writeVerse(dataPoint){
            verseSpace = document.getElementById('verse-space');
            referenceSpace = document.getElementById('reference-space');
            referenceSpace.innerHTML = dataPoint[6];
            verseSpace.innerHTML = dataPoint[5];
        }

        //event listener for autocomplete
        autoCompleteJS.input.addEventListener("selection", function (event) {
            const feedback = event.detail;
            autoCompleteJS.input.blur();
            const selection = feedback.selection.value;
            autoCompleteJS.input.value = '';
            highlightNode(selection);
        });
        document.getElementById('autoComplete').addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                var query = document.getElementById('autoComplete').value;
                if(highlightNode(query.trim())){
                    document.getElementById("autoComplete_list_1").style.visibility = "hidden";
                    autoCompleteJS.input.value = '';
                }
            }
        });

        var exitButton = document.querySelector('.exit');
        if (exitButton) {
            exitButton.addEventListener('click', helpDisappear);
        }
        var cover = document.getElementById('cover');
        if (cover) {
            cover.addEventListener('click', helpDisappear);
        }
        var resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', resetZoom);
        }
        var helpButton = document.getElementById('help-button');
        if (helpButton) {
            helpButton.addEventListener('click', helpAppear);
        }
