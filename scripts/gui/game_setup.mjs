// Planet editor GUI scripts
import * as common from "./gui_common.mjs";

// Import * as main_menu from "./main_menu.mjs";

let freebuild = false;

//! These are all the organelle selection buttons
const generationTypeSelectionElements = [
    {
        element: document.getElementById("gameSetupRandom"),
        generationType: "random"
    },
    {
        element: document.getElementById("gameSetupRandomizedPreset"),
        generationType: "randomizedPreset"
    },
    {
        element: document.getElementById("gameSetupPreset"),
        generationType: "preset"
    },
    {
        element: document.getElementById("gameSetupScriptedPreset"),
        generationType: "scriptedPreset"
    }
];

function updatePlanetValues(data) {
    document.getElementById("starMassSlider").value = data.orbitingBody.mass;
    drawGraph(document.getElementById("stellarSpectrumGraph"),
        data.orbitingBody.stellarSpectrum);
    document.getElementById("planetMassSlider").value = data.mass;
    const oxygenPercentage = parseInt(100 * data.atmosphereOxygen / data.atmosphereMass);
    const carbonDioxidePercentage =
        parseInt(100 * data.atmosphereCarbonDioxide / data.atmosphereMass);
    document.getElementById("planetAtmosphereOxygenSlider").value = oxygenPercentage;
    document.getElementById("planetAtmosphereCarbonDioxideSlider").value =
        carbonDioxidePercentage;
    drawGraph(document.getElementById("habitabilityGraph"),
        data.orbitingBody.habitabilityScore);
    drawPointOnGraph(document.getElementById("habitabilityGraph"),
        data.orbitalRadiusGraphFraction);
    document.getElementById("planetOrbitalRadiusSlider").value = data.orbit.radius;
    drawGraph(document.getElementById("atmosphericFilterGraph"), data.atmosphericFilter);
    drawGraph(document.getElementById("terrestrialSpectrumGraph"), data.terrestrialSpectrum);
}

export function setupGameSetup(fromFreebuild) {
    if(common.isInEngine()){
        // Event for detecting the active generation type
        Leviathan.OnGeneric("GameSetupGenerationTypeSelected", (event, vars) => {
            updateSelectedGenerationType(vars.generationType);
        });

        // Event for detecting changed planet data
        Leviathan.OnGeneric("GameSetupPlanetModified", (event, vars) => {
            const data = JSON.parse(vars.data);
            updatePlanetValues(data);
        });
    }

    generationTypeSelected("random");

    document.getElementById("gameSetupBack").addEventListener("click",
        Thrive.exitToMenuClicked, true);

    document.getElementById("gameSetupConfigure").addEventListener("click",
        showAdvanced, true);

    document.getElementById("gameSetupStartGame").addEventListener("click",
        startGame, true);

    // All of the generation type selection buttons
    for(const element of generationTypeSelectionElements){
        element.element.addEventListener("click", (event) => {
            event.stopPropagation();
            if(!element.element.classList.contains("DisabledButton")) {
                generationTypeSelected(element.generationType);
            }
        }, true);
    }

    document.getElementById("starMassSlider").addEventListener("input",
        onStarMassInput, true);

    document.getElementById("starMassSetSolButton").addEventListener("click",
        onStarSetSolInput, true);

    document.getElementById("planetMassSlider").addEventListener("input",
        onPlanetMassInput, true);

    document.getElementById("planetMassSetEarthButton").addEventListener("click",
        onPlanetSetEarthInput, true);

    document.getElementById("planetAtmosphereOxygenSlider").addEventListener("input",
        onPlanetSetOxygenInput, true);

    document.getElementById("planetAtmosphereCarbonDioxideSlider").addEventListener("input",
        onPlanetSetCarbonDioxideInput, true);

    document.getElementById("planetOrbitalRadiusSlider").addEventListener("input",
        onPlanetOrbitalRadiusInput, true);

    document.getElementById("advancedSetupBack").addEventListener("click",
        showMain, true);

    document.addEventListener("keydown", (event) => {
        if(event.key === "Escape"){

            event.stopPropagation();
            onEscapePressed();
        }
    }, true);

    freebuild = fromFreebuild;
}

function onStarMassInput(event){
    if (common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupStarMassInput",
            {mass: parseFloat(event.target.value)});
}

function onStarSetSolInput(event){
    if(common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupStarSetSol", {});
}

function onPlanetMassInput(event){
    if (common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupPlanetMassInput",
            {mass: parseFloat(event.target.value)});
}

function onPlanetSetOxygenInput(event){
    if (common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupPlanetOxygenInput",
            {oxygenPercentage: 0.01 * parseFloat(event.target.value)});
}

function onPlanetSetCarbonDioxideInput(event){
    if (common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupPlanetCarbonDioxideInput",
            {carbonDioxidePercentage: 0.01 * parseFloat(event.target.value)});
}

function onPlanetSetEarthInput(event){
    if(common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupPlanetSetEarth", {});
}

function onPlanetOrbitalRadiusInput(event){
    if (common.isInEngine())
        Leviathan.CallGenericEvent("GameSetupPlanetOrbitalRadiusInput",
            {orbitalRadius: parseFloat(event.target.value)});
}

function generationTypeSelected(newGenerationType){
    common.playButtonPressSound();

    if(common.isInEngine()){
        Leviathan.CallGenericEvent("GameSetupGenerationTypeSelected",
            {generationType: newGenerationType});
    } else {
        updateSelectedGenerationType(newGenerationType);
    }
}

//! Updates the GUI buttons based on selected generation type
function updateSelectedGenerationType(generationType){
    // Make all buttons unselected except the one that is now selected
    for(const element of generationTypeSelectionElements){
        if(element.generationType === generationType){
            element.element.classList.add("Selected");
        } else {
            element.element.classList.remove("Selected");
        }
    }

    if(generationType === "random"){
        document.getElementById("gameSetupPresetDropdown").style.display = "none";
    } else {
        document.getElementById("gameSetupPresetDropdown").style.display = "inline-block";
    }
}

function showAdvanced(){
    document.getElementById("mainSetup").style.display = "none";
    document.getElementById("advancedSetup").style.display = "block";
}

function showMain(){
    document.getElementById("mainSetup").style.display = "block";
    document.getElementById("advancedSetup").style.display = "none";
}

function startGame(){
    if(common.isInEngine()){
        if(freebuild){
            onMicrobeIntroEnded();
        } else {
            Leviathan.PlayCutscene("Data/Videos/MicrobeIntro.mkv", onMicrobeIntroEnded,
                onMicrobeIntroEnded);
        }
        Leviathan.CallGenericEvent("UpdateLoadingScreen",
            {show: true, status: "Loading Microbe Stage", message: ""});
    } else {
        onMicrobeIntroEnded();
    }
}

//! Handles pressing Escape in the GUI (this will unpause the game,
//! pausing is initiated from c++ key listener)
function onEscapePressed() {
    // TODO: move this to the cutscene player
    Leviathan.CancelCutscene();
}

function onMicrobeIntroEnded(error){

    if(error)
        console.error("failed to play microbe intro video: " + error);

    // MenuAlreadySkipped = true;

    if(common.isInEngine()){

        Leviathan.CallGenericEvent("UpdateLoadingScreen", {show: false});

        // Make sure no video is playing in case we did an immediate start
        Leviathan.CancelCutscene();
        Thrive.start();

        if(freebuild){
            Thrive.freebuildEditorButtonClicked();
        }

    } else {

        // Show the microbe GUI anyway for testing purposes
    }

    switchToMicrobeHUD();
}

function switchToMicrobeHUD(){
    // Hide planet editor
    // If this is ever restored this needs to be set to "flex"
    document.getElementById("topLevelGameSetup").style.display = "none";

    // And show microbe gui
    document.getElementById("topLevelMicrobeStage").style.display = "block";
}

// Functions for graph drawing
// draw a line in the graph box
function drawLine(graph, x1, y1, x2, y2, stroke, strokeWidth) {
    graph.innerHTML += "<line x1=\"" + x1 + "\" y1=\"" + y1 + "\" x2=\"" + x2 + "\" y2=\"" +
        y2 + "\" style=\"stroke:" + stroke + ";stroke-width:" + strokeWidth + "\" />";
}

// Draw circle in the graph HelpBox
function drawCircle(graph, x, y, r, stroke, strokeWidth, fill) {
    graph.innerHTML += "<circle cx=\"" + x + "\" cy=\"" + y + "\" r=\"" + r + "\" stroke=\"" +
        stroke + "\" stroke-width=\"" + strokeWidth + "\" fill=\"" + fill + "\" />";
}

// Padding for the x and y axis which is used by drawGraph and drawPoint
const offset = 10;


// Draw the graph
function drawGraph(graph, data) {
    // Check if there is good data
    if (data === undefined || data.length == 0) {
        return;
    }
    graph.innerHTML = "";

    // Get the size of the container
    const positionInfo = graph.getBoundingClientRect();
    const height = positionInfo.height;
    const width = positionInfo.width;

    // Work out the bounds of the data
    const xRange = data.length;
    const yMax = Math.max(...data);
    const yMin = Math.min(...data);
    const yRange = Math.max(1, yMax - yMin);

    // Draw the axes
    const offset = 10; // Padding for the x and y axis
    drawLine(graph, offset, offset, offset, height - offset, "rgb(0,0,200)", "3");
    drawLine(graph, offset, height - offset, width - offset, height - offset,
        "rgb(0,0,200)", "3");

    // Draw the points of the graph
    let newX = 0;
    let newY = 0;
    let oldX = offset;
    let oldY = height - offset;
    const xStep = (width - 2 * offset) / xRange;
    const yStep = (height - 2 * offset) / yRange;

    for (const i in data) {
        newX = oldX + xStep;
        newY = (height - offset) - yStep * data[i];
        drawLine(graph, oldX, oldY, newX, newY, "rgb(200,10,50)", "3");
        oldX = newX;
        oldY = newY;
    }
}

function drawPointOnGraph(graph, point) {
    // Get the size of the container
    const positionInfo = graph.getBoundingClientRect();
    const height = positionInfo.height;
    const width = positionInfo.width;
    const x = offset + (width - 2 * offset) * point;
    const y = height - offset;
    const r = 10;
    drawCircle(graph, x, y, r, "green", 3, "green");
}

function scienceNumber(a) {
    const rounded = parseFloat(a.toPrecision(3));

    return rounded.toExponential();
}
