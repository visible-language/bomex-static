(function (global) {
        // Inline index.js

        // Initialize checkbox vars
        const onNames = new Set();
        const colorNodes = new Set();
        const highlightLinks = new Set();

        // Initialize size vars for graph creation
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

        // Initialize vars for highlighting when nodes are right-clicked
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
        var pendingTapNodeId = null;
        const isTouchDevice =
          window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

        // Legend mode:
        // - "all": show global legend categories (current behavior)
        // - "selection": show only exact people in the selected neighborhood
        var legendMode = "all";
        var selectionRootId = null;
        var selectionNeighborhoodIds = [];
        // In selection mode, we only hide/unhide *neighborhood people*.
        // Keep all other nodes visible (so the rest of the graph stays translucent).
        const selectionHiddenIds = new Set();

        // Set initial color for nodes and background and node drag
        var graphColoring = "text";
        var backgroundColor = "light";

        // Theme colors
        var transparentDark = "rgba(34, 34, 34, 0.5)";
        var transparentlight = "rgba(236, 236, 236, 0.5)";
        var lightBackgroundColor = "#ffffff";
        var darkBackgroundColor = "#222222";
        var assetBase =
          global.SocialNetworkWidgetAssetBase ||
          (document.currentScript && document.currentScript.src
            ? new URL(".", document.currentScript.src).toString().replace(/\/$/, "")
            : "");
        var dataUrl = assetBase ? assetBase + "/unpruned.json" : "unpruned.json";

        // Create graph
        // Documentation for this library is at https://github.com/vasturiano/3d-force-graph
        const Graph = ForceGraph3D({ controlType: "orbit" })(
          document.getElementById("graph-3d"),
        )
          .jsonUrl(dataUrl)
          .nodeLabel("Label")
          //.linkLabel('Reference')
          .nodeResolution([15])
          .nodeRelSize([2])
          .linkWidth(["Weight"])
          .nodeOpacity([1])
          .linkOpacity([0.75])
          .nodeColor("Color")
          .nodeVal("Scaled3")
          .nodeId(["Id"])
          .linkSource(["Source"])
          .linkTarget(["Target"])
          //since we are creating the graph here, we can't resize the canvas with media queries.
          .width(windowWidth < 500 ? windowWidth : graphWidth)
          .height(windowWidth < 500 ? windowHeight - 25 : graphHeight)
          .linkWidth(lineWidth)
          // make spherical bound
          .d3Force("radial", d3.forceRadial(1))
          .backgroundColor("#222222")
          .onLinkClick((link) => {
            showLinkInfo(link);
            closeAccordion();
            openTab("infoTab");
            // dehighlightGraph();
          })
          .onLinkHover((link, link2) => {
            linkHover(link, link2);
          })
          .onNodeClick((node, event) => {
            if (isTouchDevice) {
              if (pendingTapNodeId === node.Id) {
                pendingTapNodeId = null;
                destroyLabel();
                highlightSpeaker(node.Label);
              } else {
                pendingTapNodeId = node.Id;
                selectedNode = node;
                createLabel(node.Label);
              }
              return;
            }
            highlightSpeaker(node.Label);
          })
          .onNodeRightClick((node) => {
            highlightNode(node);
          })
          .onBackgroundClick(() => {
            dehighlightGraph();
          });

        Graph.onEngineStop(() => {
          // Final fit after simulation settles avoids occasional tiny-network startup states.
          if (hasRenderableNodes()) {
            runZoomToFit();
          }
        });

        // Update each link's visibility status
        function updateVisibleLinks() {
          visibleLinks.clear();
          var links = Graph.graphData().links;

          // Cache a nodeId -> node map for resolving link endpoints (links may store ids or node objects)
          const nodesById = getNodesByIdMap();
          const resolveNode = (endpoint) => {
            if (!endpoint) return null;
            if (typeof endpoint === "object") return endpoint;
            return nodesById.get(endpoint) || null;
          };

          const endpointsVisible = (link) => {
            const src = resolveNode(link.source);
            const tgt = resolveNode(link.target);

            // If we can't resolve endpoints, don't hide (avoid transient bugs during graph init)
            if (!src || !tgt) return true;

            // Respect global legend filter (colorNodes) and selection legend hides
            if (!colorNodes.has(src) || !colorNodes.has(tgt)) return false;
            if (
              legendMode === "selection" &&
              (selectionHiddenIds.has(src.Id) || selectionHiddenIds.has(tgt.Id))
            )
              return false;

            return true;
          };

          for (index = 0; index < links.length; index++) {
            link = links[index];
            if (connectionDisplay) {
              visibleLinks.add(link);
            }
          }

          // Hide any link connected to a hidden node
          Graph.linkVisibility((link) =>
            visibleLinks.has(link) &&
            highlightLinks.has(link) &&
            endpointsVisible(link)
              ? 1
              : 0,
          );
        }

        // Apply node visibility considering both:
        // global legend filters (colorNodes)
        // selection legend filters (selectionHiddenIds) when legendMode === "selection"
        function applyCurrentNodeVisibility() {
          if (legendMode === "selection") {
            Graph.nodeVisibility((node) =>
              colorNodes.has(node) && !selectionHiddenIds.has(node.Id) ? 1 : 0,
            );
          } else {
            Graph.nodeVisibility((node) => (colorNodes.has(node) ? 1 : 0));
          }
        }

        // Resize links (used on hover)
        function linkHover(link, link2) {
          if (link != null) {
            //on hover start
            link.Weight = 2;
            Graph.linkWidth("Weight");
          } else {
            //on hover end
            link2.Weight = 1;
            Graph.linkWidth("Weight");
          }
        }

        // Return graph to default colors
        function dehighlightGraph() {
          highlightMode = false;
          selectedNode = null;
          pendingTapNodeId = null;
          // return nodes to proper color
          if (coloring == 1) {
            Graph.nodeColor("Color1");
          } else if (coloring == 2) {
            Graph.nodeColor("Color2");
          } else {
            Graph.nodeColor("Color");
          }
          // Turn on link visibility and size
          Graph.linkOpacity([0.75]);
          if (backgroundColor === "dark") {
            Graph.linkColor((link) => "#ffffff");
          } else {
            Graph.linkColor((link) => "#888888");
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

          // Restore full legend when selection is cleared
          if (legendMode === "selection") {
            legendSelectionExit();
          }
        }

        // Dynamically resize the canvas on window resize
        global.addEventListener("resize", resizeGraph);

        const appHeight = () =>
          document.documentElement.style.setProperty(
            "--app-height",
            `${window.innerHeight}px`,
          );
        window.addEventListener("resize", appHeight);
        appHeight();

        function resizeGraph() {
          // In column layout, keep the graph shorter so the user can reach content below without fighting
          // the graph's scroll-to-zoom behavior on trackpads/mice.
          if (window.innerWidth <= 1024) {
            const desired = Math.floor(window.innerHeight * 0.55);
            const clamped = Math.max(320, Math.min(650, desired));
            Graph.height(clamped);
          } else {
            Graph.height(window.innerHeight - graphExtraHeight);
          }

          // Match CSS: below laptop width we use a column layout, so the graph should use (nearly) full width.
          if (window.innerWidth > 1024) {
            Graph.width(window.innerWidth - graphExtraWidth);
            sideSizeMin = window.innerHeight - graphExtraSideHeight;
            sideSizeMax = window.innerHeight - graphExtraSideHeight;
          } else {
            Graph.width(window.innerWidth - graphExtraWidthSmall);
            sideSizeMin = 1;
            sideSizeMax = window.innerHeight;
          }

          populateInstructions();
          populateNavInfo();
          setSidebarSize(sideSizeMin, sideSizeMax);
          resetGraph();
        }

        // Dynamically set max height on sidemenu (to be used whenever graph resizes or first renders)
        function setSidebarSize(sizeMin, sizeMax) {
          var sideMenu = document.getElementById("side-menu");
          sideMenu.style.maxHeight = sizeMax.toString() + "px";
          sideMenu.style.minHeight = sizeMin.toString() + "px";
        }

        // Set correct colors for highlighting selected nodes and edges
        function setHighlightColor() {
          // Combined highlight logic.
          Graph.nodeColor((node) => {
            // Selected node color depends on background for contrast
            if (node === selectedNode) {
              return backgroundColor === "dark"
                ? "rgba(255, 255, 255, 1)"
                : "rgba(155, 155, 155, 1)";
            }
            // Highlighted nodes use their designated color
            if (
              targetNodes.has(node) ||
              incomingNodes.has(node) ||
              outgoingNodes.has(node)
            ) {
              if (coloring == 1) return node.Color1;
              if (coloring == 2) return node.Color2;
              return node.Color;
            }
            // Non-highlighted nodes are translucent
            return "rgba(211, 211, 211, 0.3)";
          });

          // Set link colors, dependent on background color
          const isSelectedLink = (link) =>
            selectedNode &&
            (link.source === selectedNode || link.target === selectedNode);

          if (backgroundColor == "dark") {
            Graph.linkColor((link) =>
              isSelectedLink(link)
                ? "rgba(255, 64, 64, 1)"
                : inHighlightLinks.has(link) || outHighlightLinks.has(link)
                  ? "#ffffff"
                  : "rgba(211, 211, 211, 0.3)",
            );
          } else {
            Graph.linkColor((link) =>
              isSelectedLink(link)
                ? "rgba(204, 0, 0, 1)"
                : inHighlightLinks.has(link) || outHighlightLinks.has(link)
                  ? "#888888"
                  : "rgba(211, 211, 211, 0.3)",
            );
          }

          // Keep link widths consistent (no size increase on selected links)
          Graph.linkWidth(1);
        }

        // Return graph to default display
        function resetGraph() {
          destroyLabel();
          runZoomToFit();
        }

        function hasRenderableNodes() {
          var nodes = Graph.graphData().nodes || [];
          if (!nodes.length) return false;
          for (var i = 0; i < nodes.length; i++) {
            var n = nodes[i];
            if (
              Number.isFinite(n.x) &&
              Number.isFinite(n.y) &&
              Number.isFinite(n.z)
            ) {
              return true;
            }
          }
          return false;
        }

        function runZoomToFit() {
          if (!hasRenderableNodes()) return;
          Graph.zoomToFit(500, -75);
        }

        // Get the screen coordinates of the center of the graph
        function getGraphCenterCoords() {
          var height = window.innerHeight - 350;
          var width;

          if (window.innerHeight > 500) {
            width = window.innerWidth - 150;
          } else {
            width = window.innerWidth - 250;
          }

          return [Math.floor(width / 2), Math.floor(height / 2)];
        }

        // Toggle graph background between light and dark color palettes
        function changeBackgroundColor() {
          buttonText = document.getElementById("backgroundColorButton");

          if (backgroundColor === "dark") {
            backgroundColor = "light";
            Graph.backgroundColor(lightBackgroundColor);
            Graph.linkColor((link) => "#888888");
            buttonText.innerHTML = "Dark Mode";
            document.getElementsByClassName("scene-nav-info")[0].style.color =
              "#222222";
          } else {
            Graph.backgroundColor(darkBackgroundColor);
            backgroundColor = "dark";
            Graph.linkColor((link) => "#ffffff");
            document.getElementsByClassName("scene-nav-info")[0].style.color =
              "#fafafa";
            buttonText.innerHTML = "Light Mode";
          }

          if (highlightMode == true) {
            setHighlightColor();
          }

          //    updateTooltipColor();
          updatePopupColor();
        }

        /*   // Does not apply in this widget
        // Update tooltip (called when we change the graph background color)
        function updateTooltipColor(){
            var tooltip = document.getElementsByClassName("scene-tooltip")[0];

            if (backgroundColor === 'dark') {
                tooltip.style.backgroundColor = transparentDark;
                tooltip.style.color = "#ffffff";
            } else {
                tooltip.style.backgroundColor = "rgba(228,237,240, 0.5)";
                tooltip.style.color = "#000000";
            }
        }
*/

        // Update popup label color (called when we change the graph background color)
        function updatePopupColor() {
          var popup = document.getElementById("popup");

          if (popup) {
            if (backgroundColor === "dark") {
              popup.style.backgroundColor = transparentDark;
              popup.style.color = "#ffffff";
            } else {
              popup.style.backgroundColor = transparentlight;
              popup.style.color = "#000000";
            }
          }
        }

        /*......Functions to change graph between 3-D and 2-D......*/
        function updateDimensions() {
          Graph.numDimensions(dimensions);
        }

        // Cycle between 2 or 3 dimensions
        function cycleDimensions() {
          destroyLabel();

          var button = document.getElementById("dimensionButton");
          var explanationText = document.getElementById("Explanation");

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

        // Change graph coloring scheme
        function changeColors(colorInt, colorText) {
          elem = document.getElementById("legend-title");
          elem.innerHTML = `Colored by ${colorText}`;
          coloring = colorInt;
          populateCheckboxes();
          dehighlightGraph();
          checkAll(true);
        }

        /*......Functions to give funtionality to the checkboxes in the legend......*/

        // Check all legend checkboxes
        function checkAll(checked) {
          var speakersLength = 0;
          var list = [];

          if (coloring == 1) {
            list = speakers1;
          } else if (coloring == 2) {
            list = speakers2;
          } else {
            list = speakers;
          }

          speakersLength = list.length;

          for (var i = 0; i < speakersLength; i++) {
            document.getElementById(list[i]).checked = checked;
          }

          updateVisibleLinks();
          check();
        }

        // Create checkbox item for each element in list of all speakers
        function check() {
          // Clear sets of names, color nodes, and highlight links
          onNames.clear();
          colorNodes.clear();
          highlightLinks.clear();

          var nodes = Graph.graphData().nodes;
          var links = Graph.graphData().links;

          // Loop over all speakers, add each checked one to set
          var speakersLength = 0;
          var list = [];

          if (coloring == 1) {
            speakersLength = speakers1.length;
            list = speakers1;
          } else if (coloring == 2) {
            speakersLength = speakers2.length;
            list = speakers2;
          } else {
            speakersLength = speakers.length;
            list = speakers;
          }

          for (var i = 0; i < speakersLength; i++) {
            var x = document.getElementById(list[i]).checked;

            if (x == true) {
              onNames.add(document.getElementById(list[i]).id);
            }
          }

          // iterate over nodes, add correct ones to the set
          for (index = 0; index < nodes.length; index++) {
            node = nodes[index];
            if (coloring == 1) {
              if (onNames.has(node.Group1)) {
                colorNodes.add(node);
              }
            } else if (coloring == 2) {
              if (onNames.has(node.Group2)) {
                colorNodes.add(node);
              }
            } else {
              if (onNames.has(node.Name)) {
                colorNodes.add(node);
              }
            }
          }

          // iterate over links, add correct ones to the set
          for (index = 0; index < links.length; index++) {
            link = links[index];

            if (colorNodes.has(link.source)) {
              if (colorNodes.has(link.target)) {
                highlightLinks.add(link);
              }
            }
          }

          updateVisibleLinks();
          applyCurrentNodeVisibility();
        }

        // -------- Selection Legend (exact people) ----------
        function getNodesByIdMap() {
          const map = new Map();
          const nodes = Graph.graphData().nodes || [];
          for (let i = 0; i < nodes.length; i++) {
            const n = nodes[i];
            map.set(n.Id, n);
          }
          return map;
        }

        function getSelectionNeighborhoodNodes() {
          if (!selectedNode) return [];

          const nodesById = getNodesByIdMap();
          const byId = new Map();

          const addNode = (n) => {
            if (!n || n.Id === undefined || n.Id === null) return;
            byId.set(n.Id, n);
          };

          // Prefer the sets that represent the highlighted neighborhood
          addNode(selectedNode);
          targetNodes.forEach(addNode);
          incomingNodes.forEach(addNode);
          outgoingNodes.forEach(addNode);

          // Fallback: if sets are empty for some reason, use selectedNode.Ids
          if (
            byId.size <= 1 &&
            typeof selectedNode.Ids === "string" &&
            selectedNode.Ids.trim().length
          ) {
            const ids = selectedNode.Ids.trim()
              .split(/\s+/)
              .map(Number)
              .filter(Number.isFinite);
            for (const id of ids) {
              addNode(nodesById.get(id));
            }
          }

          const arr = Array.from(byId.values());
          arr.sort((a, b) => {
            if (a.Id === selectedNode.Id) return -1;
            if (b.Id === selectedNode.Id) return 1;
            return (a.Label || "").localeCompare(b.Label || "");
          });

          return arr;
        }

        function renderSelectionLegend(neighborhoodNodes) {
          const holder = document.getElementById("checkbox-holder-selection");
          if (!holder) return;

          let html = "";
          for (const n of neighborhoodNodes) {
            const isSelected = selectedNode && n.Id === selectedNode.Id;
            const checked = !selectionHiddenIds.has(n.Id);
            const label = n.Label || n.Name || `Id ${n.Id}`;
            const swatchColor =
              n.Color && typeof n.Color === "string" ? n.Color : "#ddd";
            html += `
                    <label class="container">
                        ${label}
                        <input type="checkbox"
                               ${checked ? "checked" : ""}
                               ${isSelected ? "disabled" : ""}
                               ${isSelected ? "" : `onchange="legendSelectionToggle(${n.Id})"`}
                        >
                        <span class="checkmark" style="background-color:${checked ? swatchColor : "#eee"}; border-color:${swatchColor};"></span>
                    </label>
                `;
          }

          holder.innerHTML = html;
        }

        function updateSelectionLegendControls() {
          const controls = document.getElementById("legend-selection-controls");
          const title = document.getElementById("legend-selection-title");
          if (!controls || !title) return;

          if (legendMode === "selection" && selectedNode) {
            controls.style.display = "block";
            title.innerText = `Selection (${selectionNeighborhoodIds.length} people)`;
          } else {
            controls.style.display = "none";
            title.innerText = "";
          }
        }

        function legendSelectionEnter() {
          if (!selectedNode) return;

          legendMode = "selection";
          selectionRootId = selectedNode.Id;

          const neighborhood = getSelectionNeighborhoodNodes();
          selectionNeighborhoodIds = neighborhood.map((n) => n.Id);

          selectionHiddenIds.clear();
          // Never allow the selected node itself to be hidden
          selectionHiddenIds.delete(selectedNode.Id);

          updateSelectionLegendControls();
          // Swap legend UI: keep global checkboxes in DOM (hidden) so check()/checkAll never crash
          const globalHolder = document.getElementById(
            "checkbox-holder-global",
          );
          const selectionHolder = document.getElementById(
            "checkbox-holder-selection",
          );
          if (globalHolder) globalHolder.style.display = "none";
          if (selectionHolder) selectionHolder.style.display = "block";
          renderSelectionLegend(neighborhood);
          applyCurrentNodeVisibility();
          updateVisibleLinks();
        }

        function legendSelectionExit() {
          legendMode = "all";
          selectionRootId = null;
          selectionNeighborhoodIds = [];
          selectionHiddenIds.clear();

          updateSelectionLegendControls();
          const globalHolder = document.getElementById(
            "checkbox-holder-global",
          );
          const selectionHolder = document.getElementById(
            "checkbox-holder-selection",
          );
          if (selectionHolder) selectionHolder.style.display = "none";
          if (globalHolder) globalHolder.style.display = "block";
          // IMPORTANT: Do NOT rebuild global checkbox HTML here.
          // Rebuilding resets checked states to default (usually unchecked), which can hide the entire graph.
          // Just clear selection-mode hiding and re-apply visibility based on the existing global checkbox state.
          applyCurrentNodeVisibility();
          updateVisibleLinks();
        }

        function legendSelectionToggle(nodeId) {
          if (legendMode !== "selection") return;
          // Never allow hiding the selected node
          if (selectedNode && nodeId === selectedNode.Id) return;

          if (selectionHiddenIds.has(nodeId)) selectionHiddenIds.delete(nodeId);
          else selectionHiddenIds.add(nodeId);

          // Re-render so the color swatches update immediately
          renderSelectionLegend(getSelectionNeighborhoodNodes());
          applyCurrentNodeVisibility();
          updateVisibleLinks();
        }

        function legendSelectionReset() {
          if (legendMode !== "selection") return;
          selectionHiddenIds.clear();
          // Never allow the selected node itself to be hidden
          if (selectedNode) selectionHiddenIds.delete(selectedNode.Id);
          renderSelectionLegend(getSelectionNeighborhoodNodes());
          applyCurrentNodeVisibility();
          updateVisibleLinks();
        }

        function legendSelectionShowAll() {
          // Full reset: unselect node, clear highlights/selection legend, and recenter the camera.
          // dehighlightGraph() will also restore the full legend UI if we're in selection mode.
          dehighlightGraph();
          resetGraph();
        }

        // For debug: export graph info (current node; edge positions) as JSON to the console
        function exportSnapshot() {
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
                },`;
            linksJSON += info;
          }
          noTrailingComma = linksJSON.slice(0, -1);
          noTrailingComma += "\n]";
          console.log(noTrailingComma);
        }

        /*......Functions to control sidebar accordion menu......*/

        // Open one of the accordion tabs
        function openTab(tab) {
          var explanation = document.getElementById(tab);
          if (!explanation) return;
          var open = explanation.classList.contains("active");
          closeAccordion();

          if (!open) {
            explanation.classList.add("active");
            var panel = explanation.nextElementSibling;
            if (!panel) return;
            panel.style.maxHeight = "400vh";

            if (window.innerWidth < 500) {
              minHeight = 0;
            } else {
              minHeight = window.innerHeight - minAccordionHeight;
            }

            panel.style.minHeight = minHeight.toString() + "px";
          }
        }

        // Close all of the accordion tabs
        function closeAccordion() {
          var accordion = document.getElementsByClassName("accordion");
          var i;

          for (i = 0; i < accordion.length; i++) {
            var current = accordion[i];
            current.classList.remove("active");
            var panel = current.nextElementSibling;
            if (!panel) continue;
            panel.style.maxHeight = null;
            panel.style.minHeight = null;
          }
        }
        // Move the graph to center a given node based on the select menu
        function flyToNode(){
            selectedNode = null;
            var nodes = Graph.graphData().nodes;
            var book = document.getElementById("bookSelect").value;
            for (index = 0; index < nodes.length; index++) {
                node = nodes[index]

                if (node.Name === book) {
                    selectedNode = node;
                    break;
                }
            }
            const distance = 70;
        }

        // Move the graph to center a given node based on the select menu
        function flyToNode() {
          selectedNode = null;
          var nodes = Graph.graphData().nodes;
          var book = document.getElementById("bookSelect").value;
          for (index = 0; index < nodes.length; index++) {
            node = nodes[index];

            if (node.Name === book) {
              selectedNode = node;
            }
          }
          const distance = 70;

          // a 2-D graph needs different camera parameters vice a 3-D graph
          if (dimensions == 2) {
            Graph.cameraPosition(
              { x: selectedNode.x, y: selectedNode.y, z: 250 },
              { x: selectedNode.x, y: selectedNode.y, z: 0 },
              1000,
            );
          } else {
            const distRatio =
              (1 +
                distance /
                  Math.hypot(selectedNode.x, selectedNode.y, selectedNode.z)) *
              2;

            Graph.cameraPosition(
              {
                x: selectedNode.x * distRatio,
                y: selectedNode.y * distRatio,
                z: selectedNode.z * distRatio,
              },
              selectedNode,
              1000,
            );
          }

          showNodeInfo(selectedNode);
          goToSpeaker(selectedNode.Label);
          highlightSpeaker(selectedNode.Label);
        }

        // Add proper nav info based on screen size (for mobile). We only update the font size here since this label is already written by the library at load time.
        function populateNavInfo() {
          var navInfo = document.getElementsByClassName("scene-nav-info")[0];
          if (!navInfo) return;
          if (window.innerWidth > 500) {
            navInfo.style.fontSize = "15px";
            navInfo.innerHTML =
              "Left-click: rotate, Mouse-wheel/middle-click: zoom, Right-click: pan.";
          } else {
            navInfo.style.fontSize = "12px";
            navInfo.innerHTML =
              "Drag to rotate, Pinch to zoom, Two-finger drag to pan.";
          }

          if (backgroundColor === "dark") {
            navInfo.style.color = "#fafafa";
          } else {
            navInfo.style.color = "#222222";
          }
        }

        // Turn connections on or off. If there are a lot of lines it gets pretty costly to render in browser.
        function toggleConnections() {
          var button = document.getElementById("connectionsButton");

          if (connectionDisplay === 1) {
            connectionDisplay = 0;
            button.innerHTML = "Connections On";
          } else {
            connectionDisplay = 1;
            button.innerHTML = "Connections Off";
          }

          updateVisibleLinks();
        }

        // Display correct set of checkboxes
        function populateCheckboxes() {
          checkboxHolder = document.getElementById("checkbox-holder-global");

          if (coloring == 1) {
            checkboxHolder.innerHTML = checkboxes1;
          } else if (coloring == 2) {
            checkboxHolder.innerHTML = checkboxes2;
          } else {
            checkboxHolder.innerHTML = checkboxes;
          }
        }
        // Write content to Explanation sidebar tab (responsive based on number of dimensions currently displayed)
        function populateExplanation() {
          var explanation = document.getElementById("explanation");
          if (!explanation) return;
          explanation.innerHTML = `
                <h3>What am I looking at?</h3>
                <br>
                This diagram shows a social network of the Book of Mormon, i.e., who speaks to whom. Each sphere represents a speaker in the Book of Mormon.
                <br>
                <br>
                The speakers are connected by lines representing interactions. Larger spheres represent people with a higher number of recorded interactions.
                <br>
                <br>
                The speakers float in 3-D space.
                The connections ‘pull’ the nodes into their positions. The result is a ${dimensions}-D network grouped by similarity.
                <br>
                <br>
                Find more information in the <div class="appear" onclick="faqAppear()">FAQ</a>.
                `;
        }

        // Decide. based on screen size, whether to show full or mobile-specific navigation instructions in the Instructions sidebar tab.
        function populateInstructions() {
          var instructions = document.getElementById("instructions");
          if (!instructions) return;

          if (window.innerWidth > 500) {
            instructions.innerHTML = `
                    <h3>Navigation</h3>
                    <br>Click and drag to rotate the network, or use the mouse wheel to zoom.
                    <br><br>Click a node to highlight its connections, or click the background without dragging to return the graph to normal.
                    <br>Right-click any node to see its information in the node-information tab below.
                    <br><br>Use the buttons in the bottom-right corner to specify a node, then click "Go!" and the selected node will appear in the center of the screen.
                    <br>
                    <br>Check or uncheck legend items in the legend tab to toggle their display.
                    `;
          } else {
            instructions.innerHTML = `
                    <h3>Navigation</h3>
                    <br>Drag to rotate the network, or pinch to zoom. Drag with two fingers to pan.
                    <br>Tap any node to highlight its connections, or tap the background without dragging to return the graph to normal.
                    <br><br>Use the buttons in the bottom-right corner to specify a node, then click "Go!" and the selected node will appear in the center of the screen.
                    <br>
                    <br>Check or uncheck legend items in the legend tab to toggle their display.
                    `;
          }
        }

        // Display info about a given node (usually when clicked)
        function showNodeInfo(node) {
          var info = document.getElementById("info");
          var url = assetBase
            ? new URL("../../Images/" + node.Name + ".jpg", assetBase + "/").toString()
            : "../../Images/" + node.Name + ".jpg";

          // get the nodes structure
          var nodes_struct = Graph.graphData().nodes;
          var links = Graph.graphData().links;

          // get the IDs
          var IDs = node.Ids.split(" ");
          let size = IDs.length;


          info.innerHTML = `<div id ='nodeinfo'>
                <div class="nodeinfo-speaker-row">
                  <div class="nodeinfo-speaker-text">
                    <h3>Speaker:</h3>
                    ${node.Label}
                  </div>
                  <img src="${url}" alt="Portrait of ${node.Name}">
                </div>
                <br>
                <h3>Basic Info:</h3>
                ${node.Blurb}<br>
                <br>
                <h3>Spoke With:</h3>
                ${node.Docs}<br>
                </div>
            `;
          updateVisibleLinks();
          Graph.nodeVisibility((node) => (colorNodes.has(node) ? 1 : 0));
        }

        // Display info about a given link (usually when clicked)
        function showLinkInfo(link) {
          var info = document.getElementById("info");
          var href = `<a href="${link.Link}" target="blank">${link.Verse}</a>`;
          info.innerHTML = `<div id ='nodeinfo'>
                <h3>Speakers:</h3>
                ${link.Speaker1}<br>
                ${link.Speaker2}<br>
                <br>
                <h3>Scripture:</h3>
                ${href}<br>
                ${link.Idea}<br>
                <br>
                </div>
            `;
        }

        // Move to a speaker (rather than just a node)
        function goToSpeaker(speaker, attempt) {
          destroyLabel();
          var tries = Number(attempt || 0);
          var nodes = Graph.graphData().nodes || [];
          if (!nodes.length) {
            if (tries < 40) {
              setTimeout(function () {
                goToSpeaker(speaker, tries + 1);
              }, 150);
            }
            return;
          }
          if (speakers.includes(speaker)) {
            document.getElementById("bookSelect").value = speaker;
            highlightSpeaker(speaker);
            setTimeout(() => {
              createLabel(speaker);
            }, 1000);
          }
        }

        // Make and position a label for a given speaker
        function createLabel(speaker) {
          // Get rid of old label
          destroyLabel();
          // Ensure we have a node to anchor to
          if (!selectedNode || selectedNode.Label !== speaker) {
            const nodes = Graph.graphData().nodes || [];
            for (let i = 0; i < nodes.length; i++) {
              if (nodes[i] && nodes[i].Label === speaker) {
                selectedNode = nodes[i];
                break;
              }
            }
          }
          if (!selectedNode) return;

          // Create a new div element
          const newDiv = document.createElement("div");
          // Put someting in the div
          newDiv.innerHTML = `${speaker}`;
          // Give class to popup
          newDiv.id = "popup";

          if (backgroundColor == "dark") {
            newDiv.style.backgroundColor = transparentDark;
            newDiv.style.color = "#eee";
          } else {
            newDiv.style.backgroundColor = transparentlight;
            newDiv.style.color = "#222222";
          }

          document.body.append(newDiv);
          // Keep the popup pinned to the node even while rotating/zooming/panning.
          startPopupTracking();
        }

        // Destroy popup label if one exists
        function destroyLabel() {
          stopPopupTracking();
          var label = document.getElementById("popup");
          if (label == null) {
          } else {
            label.remove();
          }
        }

        // Function to position any element anywhere on screen
        function positionElement(element, x, y) {
          element.style.left = x + "px";
          element.style.top = y + "px";
        }

        // --- Popup label tracking (keep the label next to the selected node) ---
        let popupRafId = null;

        function stopPopupTracking() {
          if (popupRafId !== null) {
            cancelAnimationFrame(popupRafId);
            popupRafId = null;
          }
        }

        function startPopupTracking() {
          stopPopupTracking();

          const tick = () => {
            const label = document.getElementById("popup");
            if (!label || !selectedNode) {
              popupRafId = null;
              return;
            }

            // Keep the label text in sync with the currently selected node.
            // (We reuse the same DOM element across selections.)
            const desiredText = selectedNode.Label || selectedNode.Name || "";
            if (label.textContent !== desiredText) label.textContent = desiredText;

            const canvas = document.querySelector("#graph-3d canvas");
            if (!canvas) {
              popupRafId = requestAnimationFrame(tick);
              return;
            }

            const canvasRect = canvas.getBoundingClientRect();
            const coords = Graph.graph2ScreenCoords(
              selectedNode.x,
              selectedNode.y,
              selectedNode.z,
            );

            // graph2ScreenCoords() is canvas-relative; convert to viewport coords.
            // Small offset so the label doesn't cover the node.
            positionElement(
              label,
              canvasRect.left + coords.x + 12,
              canvasRect.top + coords.y - 12,
            );

            popupRafId = requestAnimationFrame(tick);
          };

          popupRafId = requestAnimationFrame(tick);
        }

        // Highlight a given speaker's node and edges
        function highlightSpeaker(speaker) {
          pendingTapNodeId = null;
          destroyLabel();
          var nodes = Graph.graphData().nodes;
          var node = null;

          for (index = 0; index < nodes.length; index++) {
            if (nodes[index] && nodes[index]["Label"] == speaker) {
              node = nodes[index];
              break;
            }
          }
          if (!node || !node.Ids) return;

          // Set the selected node for highlighting
          selectedNode = node;

          // Keep the main speaker dropdown in sync with the currently selected node.
          // This does not dispatch a change event (so it won't trigger flyToNode loops).
          if (selectedNode && selectedNode.Name) {
            const selectEl = document.getElementById("bookSelect");
            if (selectEl) selectEl.value = selectedNode.Name;
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
            Nodes = node.Ids.split(" ");
            var outNum = Nodes.map(Number);
            var links = Graph.graphData().links;
            var nodes = Graph.graphData().nodes;
            outNum.forEach((num) => outgoingNodes.add(nodes[num]));
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
          }

          check();
          setHighlightColor();
          updateVisibleLinks();
          legendSelectionEnter();
          showNodeInfo(node);
          closeAccordion();
          openTab("infoTab");
        }

        // Highlight a given node and its edges
        function highlightNode(label) {
          pendingTapNodeId = null;
          destroyLabel();
          var node = label;

          // Set the selected node for highlighting
          selectedNode = node;
          // Keep the main speaker dropdown in sync with the currently selected node.
          if (selectedNode && selectedNode.Name) {
            const selectEl = document.getElementById("bookSelect");
            if (selectEl) selectEl.value = selectedNode.Name;
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
            Nodes = node.Ids.split(" ");
            var outNum = Nodes.map(Number);
            var links = Graph.graphData().links;
            var nodes = Graph.graphData().nodes;
            outNum.forEach((num) => outgoingNodes.add(nodes[num]));
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
          }

          check();
          setHighlightColor();
          updateVisibleLinks();

          // Switch legend into exact-people mode for the selected neighborhood
          legendSelectionEnter();

          // Navigate sidebar to highlighted speaker's info
          showNodeInfo(node);
          closeAccordion();
          openTab("infoTab");
        }

        // get Query variable from URL string
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

        function getQueryVariable(variable) {
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
            } // the variable isn't set
            else return null;
          }
        }

        // Fly to speaker from URL string
        const DEFAULT_SPEAKER = "Nephi";
        const mountSpeaker =
          (global.SocialNetworkWidgetOptions &&
            global.SocialNetworkWidgetOptions.speaker) ||
          "";

        function goToURLSpeaker() {
          speaker = getQueryVariable("speaker") || mountSpeaker || DEFAULT_SPEAKER;
          if (speaker && speakers.includes(speaker)) {
            document.getElementById("bookSelect").value = speaker;
            return true;
          } else return null;
          return false;
        }

        // Functions for FAQ page popup; and to gray out the rest of the widget behind the FAQ popup.
        function faqDisappear() {
          elem = document.getElementById("faq");
          elem.style.visibility = "hidden";
          elem2 = document.getElementById("grey-out");
          elem2.style.visibility = "hidden";
        }

        function faqAppear() {
          elem = document.getElementById("faq");
          elem.style.visibility = "visible";
          elem2 = document.getElementById("grey-out");
          elem2.style.visibility = "visible";
        }

        // We set a little timeout to let the page load before doing all of this stuff. It ensures a smooth load.
        const hasParam = goToURLSpeaker();
        if (hasParam) {
          setTimeout(() => {
            goToSpeaker(speaker);
          }, 2500);
        } else {
          setTimeout(() => {
            goToURLSpeaker();
          }, 2500);
        }
        setTimeout(() => {
          check();
        }, 250);
        setTimeout(() => {
          resetGraph();
        }, 500);

        // Now, execute the functions necessary to start the first initial page
        populateExplanation();
        populateCheckboxes();
        populateInstructions();
        populateNavInfo();
        // We only want to open the explanation tab if we're not on mobile
        if (window.innerWidth > 500) {
          openTab("explanationTab");
        }
        resizeGraph();
        checkAll(true);
        Graph.nodeVisibility(1);
        setSidebarSize(sideSizeMin, sideSizeMax);
        changeBackgroundColor();

        global.resetGraph = resetGraph;
        global.cycleDimensions = cycleDimensions;
        global.changeBackgroundColor = changeBackgroundColor;
        global.toggleConnections = toggleConnections;
        global.openTab = openTab;
        global.legendSelectionToggle = legendSelectionToggle;
        global.legendSelectionReset = legendSelectionReset;
        global.legendSelectionShowAll = legendSelectionShowAll;
        global.flyToNode = flyToNode;
        global.check = check;
        global.checkAll = checkAll;
        global.changeColors = changeColors;
        global.faqDisappear = faqDisappear;
        global.faqAppear = faqAppear;

        global.SocialNetworkWidgetApi = {
          resize: function () {
            resizeGraph();
          },
          destroy: function () {
            stopPopupTracking();
            global.removeEventListener("resize", resizeGraph);
            if (Graph && typeof Graph.pauseAnimation === "function") {
              Graph.pauseAnimation();
            }
          }
        };
})(window);
