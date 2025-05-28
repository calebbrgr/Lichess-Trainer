// ==UserScript==
// @name         Lichess Trainer v0.1.0
// @namespace   Violentmonkey Scripts
// @match        https://lichess.org/*
// @grant       none
// @require   https://cdn.socket.io/4.0.0/socket.io.min.js
// @version     0.1.0
// @author      -
// @description 5/27/2025
// ==/UserScript==



(function () {
  	//GLOBAL VARS
    let playerName = "lichessusername"
    let svgType = "dot"
  	let playerSpyEnabled = true
  	let evalBarEnabled = false
 
    console.log("script loaded")
    'use strict';
    var games = []

    function newGame() {
        var session = {};
        function getMatchData() {
            function getL4x() {
                // Locate the element with the class "l4x"
                const targetNode = document.querySelector('l4x');
                if (!targetNode) {
                    console.error("The <l4x> element was not found.");
                    return;
                }
                // Check if the element exists, if so, return its innerHTML
                if (targetNode) {
                    return targetNode.innerHTML;
                } else {
                    // If the element is not found, return a message or null
                    return null;
                }
            }
            const matchData = {};

            // Get white and black player names
            const whitePlayer = document.querySelector('.player.color-icon.is.white.text a.user-link');
            const blackPlayer = document.querySelector('.player.color-icon.is.black.text a.user-link');

            // Get time control (e.g., "3+0")
            const timeControl = document.querySelector('.setup').textContent.match(/\d\+\d/)[0];

            // Get the UTC time from the time element
            //const utcTime = document.querySelector('time.timeago.set').getAttribute('datetime');

            // Get L4x
            const l4xElement = getL4x();

            // Add values to the matchData object
            matchData.white = whitePlayer ? whitePlayer.textContent.split(' ')[0] : null;
            matchData.black = blackPlayer ? blackPlayer.textContent.split(' ')[0] : null;
            matchData.tc = timeControl || null;
            //matchData.utc = utcTime || null;
            matchData.l4x = l4xElement || null;
            return matchData;
        }
        if (!session.currentGame) {
            session.gameId = getWindow();
            session.matchData = getMatchData();
            session.moveStack = [];
            return session

        } else {
            return false
        }
    }
    function endGame(session) {
        if (session) {
            games.push(session.currentGame);
            session = {};
            return true
        } else {
            return false
        }
    }
    function getWindow() {
        const url = window.location.href;
        console.log(url)
        const regex = /^https:\/\/lichess\.org\/([a-zA-Z0-9]{12})$/;
        const match = url.match(regex);
        console.log(match)

        if (match) {
            // Extracted ID
            const gameId = match[1];
            console.log(gameId)
            return gameId
        } else {
            return false
        }
    }
    function waitElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
    function gameState() {
        function aliveCheck(gameId, session) {
            if (gameId == session.currentGame) {
                return true
            } else {
                return false
            }
        }
        function existsCheck(gameId, session) {
            if (games.includes(session.gameId)) {
                return true
            } else {
                return false
            }
        }
    }
    function setSession(gameId, session) {
        session.currentGame = gameId;
    }
    function flashInfo() { } // if server returns error flash

    function renderEval() {
        // Create the evaluation bar
        const evalBar = document.createElement("div");
        evalBar.id = "eval-bar";
        evalBar.style.position = "fixed";
        evalBar.style.bottom = "0";
        evalBar.style.left = "0";
        evalBar.style.width = "100%";
        evalBar.style.height = "20px";
        evalBar.style.background = "black";
        evalBar.style.transition = "width 1s ease-in-out"; // Initial transition
        document.body.appendChild(evalBar);
    }

    let lastPercentage = 0;

    function updateEval(eval) {
        const evalBar = document.getElementById("eval-bar");
        if (!evalBar) return;

        // Normalize eval value within -1000 to 1000
        let normalizedEval = Math.max(-1500, Math.min(1500, eval));
        let percentage = (normalizedEval + 1500) / 3000; // Convert to 0-1 scale

        // Calculate the change in percentage
        const percentageChange = Math.abs(percentage - lastPercentage);

        // Adjust transition duration based on the percentage change
        const transitionDuration = Math.max(0.1, 1 - percentageChange); // Duration decreases as change increases

        // Set the transition duration dynamically
        evalBar.style.transition = `width ${transitionDuration}s ease-in-out`;

        // Update gradient based on eval
        evalBar.style.background = `linear-gradient(to right, black ${percentage * 100}%, white ${percentage * 100}%)`;

        lastPercentage = percentage;
    }

    function displaySvgFromMoveData(moveData) {
        // Coordinates for the squares
        const squareCoords = {
            "a1": { "x": -3.5, "y": 3.5 },
            "b1": { "x": -2.5, "y": 3.5 },
            "c1": { "x": -1.5, "y": 3.5 },
            "d1": { "x": -0.5, "y": 3.5 },
            "e1": { "x": 0.5, "y": 3.5 },
            "f1": { "x": 1.5, "y": 3.5 },
            "g1": { "x": 2.5, "y": 3.5 },
            "h1": { "x": 3.5, "y": 3.5 },

            "a2": { "x": -3.5, "y": 2.5 },
            "b2": { "x": -2.5, "y": 2.5 },
            "c2": { "x": -1.5, "y": 2.5 },
            "d2": { "x": -0.5, "y": 2.5 },
            "e2": { "x": 0.5, "y": 2.5 },
            "f2": { "x": 1.5, "y": 2.5 },
            "g2": { "x": 2.5, "y": 2.5 },
            "h2": { "x": 3.5, "y": 2.5 },

            "a3": { "x": -3.5, "y": 1.5 },
            "b3": { "x": -2.5, "y": 1.5 },
            "c3": { "x": -1.5, "y": 1.5 },
            "d3": { "x": -0.5, "y": 1.5 },
            "e3": { "x": 0.5, "y": 1.5 },
            "f3": { "x": 1.5, "y": 1.5 },
            "g3": { "x": 2.5, "y": 1.5 },
            "h3": { "x": 3.5, "y": 1.5 },

            "a4": { "x": -3.5, "y": 0.5 },
            "b4": { "x": -2.5, "y": 0.5 },
            "c4": { "x": -1.5, "y": 0.5 },
            "d4": { "x": -0.5, "y": 0.5 },
            "e4": { "x": 0.5, "y": 0.5 },
            "f4": { "x": 1.5, "y": 0.5 },
            "g4": { "x": 2.5, "y": 0.5 },
            "h4": { "x": 3.5, "y": 0.5 },

            "a5": { "x": -3.5, "y": -0.5 },
            "b5": { "x": -2.5, "y": -0.5 },
            "c5": { "x": -1.5, "y": -0.5 },
            "d5": { "x": -0.5, "y": -0.5 },
            "e5": { "x": 0.5, "y": -0.5 },
            "f5": { "x": 1.5, "y": -0.5 },
            "g5": { "x": 2.5, "y": -0.5 },
            "h5": { "x": 3.5, "y": -0.5 },

            "a6": { "x": -3.5, "y": -1.5 },
            "b6": { "x": -2.5, "y": -1.5 },
            "c6": { "x": -1.5, "y": -1.5 },
            "d6": { "x": -0.5, "y": -1.5 },
            "e6": { "x": 0.5, "y": -1.5 },
            "f6": { "x": 1.5, "y": -1.5 },
            "g6": { "x": 2.5, "y": -1.5 },
            "h6": { "x": 3.5, "y": -1.5 },

            "a7": { "x": -3.5, "y": -2.5 },
            "b7": { "x": -2.5, "y": -2.5 },
            "c7": { "x": -1.5, "y": -2.5 },
            "d7": { "x": -0.5, "y": -2.5 },
            "e7": { "x": 0.5, "y": -2.5 },
            "f7": { "x": 1.5, "y": -2.5 },
            "g7": { "x": 2.5, "y": -2.5 },
            "h7": { "x": 3.5, "y": -2.5 },

            "a8": { "x": -3.5, "y": -3.5 },
            "b8": { "x": -2.5, "y": -3.5 },
            "c8": { "x": -1.5, "y": -3.5 },
            "d8": { "x": -0.5, "y": -3.5 },
            "e8": { "x": 0.5, "y": -3.5 },
            "f8": { "x": 1.5, "y": -3.5 },
            "g8": { "x": 2.5, "y": -3.5 },
            "h8": { "x": 3.5, "y": -3.5 }
        };

        // Helper function to determine the color based on centipawn deviation
        function getColorBasedOnDeviation(avgCentipawn, centipawn, turn) {
            // Normalize scores: higher is always better for the current player
            let normalized = turn === 'white' ? centipawn : -centipawn;
            let avgNormalized = turn === 'white' ? avgCentipawn : -avgCentipawn;
						
            let deviation = normalized - avgNormalized;
						console.log(deviation);
            // Assign colors based on deviation from average (in centipawns)
          	if (deviation <= -300) return '#D12335';        // worst moves
          	if (deviation <= -200) return '#DE3F4F';        // bad moves
            if (deviation <= -100) return '#E4626F';        // slightly worse
            if (deviation <= -50) return '#F3B9BF';		    // - avg
            if (deviation <= 0) return '#cccccc';           // avg
            if (deviation <= 50) return '#B0F9FD';          // + avg
            if (deviation <= 100) return '#74F4FB';         // slightly better
          	if (deviation <= 200) return	'#39EFF9';      // good moves
          	if (deviation <= 300) return	'#12ECF8';      // best moves
            return '#15781B';                         // top move (not mate)
        }




        // Create the tooltip element once
        const tooltip = document.createElement("div");
        tooltip.style.position = "absolute";
        tooltip.style.background = "white";
        tooltip.style.color = "black";
        tooltip.style.border = "1px solid gray";
        tooltip.style.padding = "5px";
        tooltip.style.borderRadius = "5px";
        tooltip.style.fontSize = "14px";
        tooltip.style.visibility = "hidden"; // Initially hidden
        tooltip.style.pointerEvents = "none"; // Avoid blocking interactions
        tooltip.style.boxShadow = "2px 2px 5px rgba(0, 0, 0, 0.2)";
        document.body.appendChild(tooltip);
        function showTooltip(event, message) {
            tooltip.textContent = message;
            tooltip.style.left = `${event.pageX + 10}px`; // Position near cursor
            tooltip.style.top = `${event.pageY + 10}px`;
            tooltip.style.visibility = "visible";
        }

        function hideTooltip() {
            tooltip.style.visibility = "hidden";
        }
      
        function displaySvg(type, fromSquare, toSquare, color, currentColor, tooltipText) {
          	console.log("display svg from:", type, fromSquare, toSquare, color, currentColor);
            const svg = document.querySelector("svg.cg-shapes");

            if (!svg) {
                console.error("SVG container not found.");
                return;
            }

            const targetGroup = document.querySelector(".cg-shapes g");
            if (!targetGroup) {
                console.error("Target group not found.");
                return;
            }

            const svgNS = "http://www.w3.org/2000/svg";

            const fromCoords = squareCoords[fromSquare];
            const toCoords = squareCoords[toSquare];

            if (!fromCoords || !toCoords) {
                console.error("Invalid square name");
                return;
            }

            const x1 = currentColor === 'black' ? -fromCoords.x : fromCoords.x;
            const y1 = currentColor === 'black' ? -fromCoords.y : fromCoords.y;
            const x2 = currentColor === 'black' ? -toCoords.x : toCoords.x;
            const y2 = currentColor === 'black' ? -toCoords.y : toCoords.y;

          	if (type === 'arrow') {
              let defs = svg.querySelector("defs");
              if (!defs) {
                  defs = document.createElementNS(svgNS, "defs");
                  svg.prepend(defs);
              }

              // Create a unique marker ID based on color
              const markerId = `arrowhead-${color.replace("#", "")}`;

              if (!document.getElementById(markerId)) {
                  let marker = document.createElementNS(svgNS, "marker");
                  marker.setAttribute("id", markerId);
                  marker.setAttribute("viewBox", "0 0 10 10");
                  marker.setAttribute("refX", "9");
                  marker.setAttribute("refY", "5");
                  marker.setAttribute("markerWidth", "6");
                  marker.setAttribute("markerHeight", "6");
                  marker.setAttribute("orient", "auto");

                  let path = document.createElementNS(svgNS, "path");
                  path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z"); // Triangle shape
                  path.setAttribute("fill", color);
                  path.setAttribute("stroke", color);

                  // Attach event listeners for tooltip
                  path.addEventListener("mouseenter", (event) => showTooltip(event, tooltipText));
                  path.addEventListener("mouseleave", hideTooltip);

                  marker.appendChild(path);
                  defs.appendChild(marker);
              }

              const arrow = document.createElementNS(svgNS, "line");
              arrow.setAttribute("x1", x1);
              arrow.setAttribute("y1", y1);
              arrow.setAttribute("x2", x2);
              arrow.setAttribute("y2", y2);
              arrow.setAttribute("stroke", color);
              arrow.setAttribute("stroke-width", "0.04");
              arrow.setAttribute("stroke-linecap", "round");
              arrow.setAttribute("marker-end", `url(#${markerId})`);
              arrow.setAttribute("opacity", "0.8");

              const gElement = document.createElementNS(svgNS, "g");
              gElement.setAttribute("cgHash", `512,512,${fromSquare},${toSquare},${color}`);
              gElement.appendChild(arrow);

              targetGroup.appendChild(gElement);
              }
              if (type === 'dot') {
                const dot = document.createElementNS(svgNS, "circle");
                dot.setAttribute("cx", x1);
                dot.setAttribute("cy", y1);
                dot.setAttribute("r", "0.04"); // Adjust radius as needed
                dot.setAttribute("fill", color);
                dot.setAttribute("stroke", color);
                dot.setAttribute("opacity", "0.8");

                // Optional: attach tooltip events
                dot.addEventListener("mouseenter", (event) => showTooltip(event, tooltipText));
                dot.addEventListener("mouseleave", hideTooltip);

                const gElement = document.createElementNS(svgNS, "g");
                gElement.setAttribute("cgHash", `dot,${x1},${y1},${color}`);
                gElement.appendChild(dot);

                targetGroup.appendChild(gElement);
              }
        }

        const moves = moveData.top_moves;
        const turn = moveData.current_turn;
        const currentColor = moveData.current_color;
        // Calculate the average centipawn value
        let totalCentipawn = 0;
        let validMovesCount = 0;

        moves.forEach(move => {
            if (move.Centipawn !== null) {
                totalCentipawn += move.Centipawn;
                validMovesCount++;
            }
        });

        const avgCentipawn = validMovesCount > 0 ? totalCentipawn / validMovesCount : 0;
 

        moves.forEach(move => {
            const fromSquare = move.Move.slice(0, 2);
            const toSquare = move.Move.slice(2, 4);
            const centipawn = move.Centipawn;
            const type = svgType;
            if (move.Mate !== null) {
                displaySvg(type, fromSquare, toSquare, "#bf00ff", currentColor); // Magenta for mates
            } else {
                let absCentipawn = Math.abs(centipawn);
                let absAvg = Math.abs(avgCentipawn);
              	console.log(centipawn, avgCentipawn, fromSquare, toSquare, currentColor);
                const color = getColorBasedOnDeviation(avgCentipawn, centipawn, turn);
                displaySvg(type, fromSquare, toSquare, color, currentColor);
            }
        });
    }
    function clearSvg() {
        // Select the target group where arrows are appended
        const targetGroup = document.querySelector(".cg-shapes g");

        // Check if the target group exists
        if (targetGroup) {
            // Remove all child elements (arrows) from the target group
            while (targetGroup.firstChild) {
                targetGroup.removeChild(targetGroup.firstChild);
            }
            console.log('Svgs cleared.');
        } else {
            console.error("Target group not found.");
        }
    }
    function renderAveragesUI(data) {
        // Check if the UI box already exists
        let existingBox = document.getElementById("averages-box");
        if (!existingBox) {
            // Create the floating UI box
            const box = document.createElement("div");
            box.id = "averages-box";
            box.style.position = "fixed";
            box.style.top = "10px";
            box.style.right = "10px";
            box.style.padding = "10px";
            box.style.background = "rgba(0, 0, 0, 0.8)";
            box.style.color = "white";
            box.style.fontFamily = "Arial, sans-serif";
            box.style.borderRadius = "8px";
            box.style.boxShadow = "0px 0px 10px rgba(255, 255, 255, 0.2)";
            box.style.zIndex = "9999";
            box.style.minWidth = "200px";
            box.style.maxWidth = "300px";
            box.style.overflow = "hidden";

            document.body.appendChild(box);
        } else {
            existingBox.innerHTML = ""; // Clear previous content
        }

        let box = document.getElementById("averages-box");

        // Create title
        const title = document.createElement("div");
        title.innerText = "Game Averages";
        title.style.fontWeight = "bold";
        title.style.textAlign = "center";
        title.style.marginBottom = "5px";
        box.appendChild(title);

        // Create table
        const table = document.createElement("table");
        table.style.width = "100%";
        table.style.borderCollapse = "collapse";

        // Create header row
        const headerRow = document.createElement("tr");
        headerRow.innerHTML = `
                  <th style="text-align: left; padding: 4px;">Game</th>
                  <th style="padding: 4px;">6m</th>
                  <th style="padding: 4px;">1m</th>
                  <th style="padding: 4px;">1wk</th>
              `;
        table.appendChild(headerRow);
        // Populate rows with game averages
        for (let game in data) {
            let { avg_6_months, avg_1_month, avg_1_week } = data[game];

            const row = document.createElement("tr");
            row.innerHTML = `
                      <td style="padding: 4px; border-top: 1px solid rgba(255,255,255,0.2);">${game}</td>
                      <td style="padding: 4px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">${avg_6_months ? avg_6_months.toFixed(1) : "-"}</td>
                      <td style="padding: 4px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">${avg_1_month ? avg_1_month.toFixed(1) : "-"}</td>
                      <td style="padding: 4px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2);">${avg_1_week ? avg_1_week.toFixed(1) : "-"}</td>
                  `;
            table.appendChild(row);
        }

        box.appendChild(table);
    }

    async function playerSpy() {
        // Get white and black player names
        let whitePlayer = document.querySelector('.player.color-icon.is.white.text a.user-link');
        let blackPlayer = document.querySelector('.player.color-icon.is.black.text a.user-link');
        let p1 = whitePlayer ? whitePlayer.textContent.split(' ')[0] : null;
        let p2 = blackPlayer ? blackPlayer.textContent.split(' ')[0] : null;
        let data = { averages: {} };

        if (p1 && p1 !== playerName) {
            let playerData = await getPlayerData(p1);
            if (playerData && playerData.averages) {
                data = playerData.averages;
            }
        }

        if (p2 && p2 !== playerName) {
            let playerData = await getPlayerData(p2);
            if (playerData && playerData.averages) {
                data = playerData.averages;
            }
        }
        // Render only after all data is received
        console.log('data avg:', data);
        renderAveragesUI(data);
    }


    //MOD

    function observeL4xMutations(session) {
        // Select the target node (element with the tag name "l4x")
        const targetNode = document.querySelector('l4x');

        if (!targetNode) {
            console.error("The <l4x> element was not found.");
            return;
        }

        // Observer configuration: observe changes to the child elements and attributes
        let moveNumber = 0;
        // Callback function when mutation
        const callback = function (mutationsList) {
            mutationsList.forEach((mutation) => {
                // Check if the mutation type is 'childList'
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) { //maybe remove after &&
                    mutation.addedNodes.forEach((node) => {
                        let nodeText = node.textContent.trim();
                        console.log("l4x:", nodeText);
                        if (!isNaN(nodeText)) {
                            let moveNumber = nodeText;
                        } else {
                            let move = nodeText;
                            session.moveStack.unshift(move);
                            if (move) {
                                postMove(session, move);
                            }
                            else {
                                endGame(session)
                            }

                        }
                    });
                }
            });
        };
        // Create a MutationObserver instance
        const observer = new MutationObserver(callback);

        // Start observing the target node with the specified configuration
        const config = {
            childList: true,
            subtree: true,
        };
        observer.observe(targetNode, config);
    }

    async function postMove(session, move) {
        const url = `http://localhost:5000/game/${session.gameId}/move`;

        try {
            // Step 1: Send Move Request
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    game_id: session.gameId,
                    move: move,
                    callback_url: 'http://localhost:5000/webhook' // Your endpoint for receiving webhooks
                })
            });

            if (!response.ok) throw new Error('Failed to post move');

            const data = await response.json();
            console.log('Move added to queue:', data);

        } catch (error) {
            console.error('Error posting move:', error);
        }
    }

    const socket = io.connect('http://localhost:5000');  // Flask WebSocket server
    // Listen for 'socket' events sent by Flask
    socket.on('socket', function (data) {
        console.log('Received socket data:', data);

        if (data.status === 1) {
            console.log("socket data:", data);
            //session.moveStack.pop();
            clearSvg();
            displaySvgFromMoveData(data);
            updateEval(data.evaluation.value);
        }
    });

    // Retry function to attempt calling postMove when isPostingMove is false
    function postNewGame(session) {
        const url = `http://localhost:5000/new-game/${session.gameId}`;
        let matchData = session.matchData;
        console.log("SESSION DATA POSTING:", session.gameId, matchData.l4x, matchData.tc, matchData.white, matchData.black)
        // Create the request object
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                game_id: session.gameId,
                l4x: matchData.l4x,
                utc: matchData.utc,
                tc: matchData.tc,
                black: matchData.black,
                white: matchData.white
            }),
        })
            .then(response => response.json())
            .then(data => console.log('./new-game: ', data))
            .catch((error) => console.error('./new-game:', error));
    }

    function getPlayerData(player) {
        const url = `http://localhost:5000/player/${player}`;

        return fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                console.log(`Fetched data for ${player}:`, data);
                return data;
            })
            .catch(error => {
                console.error("Fetch error:", error);
                return { averages: {} };
            });
    }
    //MOD

    if (getWindow()) {
        console.log("window true");
        waitElm('l4x').then((elm) => {
            console.log("l4x true");
          	if (playerSpyEnabled) { playerSpy(); };
            
            waitElm('.rclock.running').then((elm) => {
                console.log("clock started");
                const session = newGame();
                postNewGame(session);
                if (evalBarEnabled) { renderEval(); };
                observeL4xMutations(session);
            })
        })
    } else {
        return false
    }
})();