import * as common from "./gui_common.mjs";
import * as main_menu from "./main_menu.mjs";
import * as microbe_hud from "./microbe_hud.mjs";
import {doEnterMicrobeEditor} from "./microbe_editor.mjs";


// Where we are in patch Map
let activePanel = "";
let actualNode = "";
let newSelectedNode = "";
let links = "";
let actualPlayerPatchData = [];

// All panels whitin is possible to navigate
const panelButtons = ["report", "patch", "editor"];

let counter = 0;

//! Setup for reportPatch callbacks
export function setupMicrobePatch(){
    // Top navigation Buttons Clicked
    document.getElementById("report").addEventListener("click",
	    onPatchReportClicked, true);
    document.getElementById("patch").addEventListener("click",
	    onPatchReportClicked, true);
    document.getElementById("editor").addEventListener("click",
	    onPatchReportClicked, true);

    // Change patch button clicked
    document.getElementById("changePatch").addEventListener("click",
        onChangePatchClicked, true);

    // Next Button Clicked
    document.getElementById("next").addEventListener("click",
        onNextButtonClicked, true);

    // Condition buttons clicked
    const minusBtnObjects = document.getElementsByClassName("minusBtn");

    for (const element of minusBtnObjects) {
        element.addEventListener("click",
            onConditionClicked, true);
    }

    // Event for drawning patchMap
    Leviathan.OnGeneric("MicrobeEditorPatchEnter", doDrawPatchMap);
}

// Next Button clicked
function onNextButtonClicked() {
    if(counter == 2) {
        counter = 0;
    }
    counter = counter + 1;
    $( "#" + panelButtons[counter] ).click();
}


// Patch-Report function
function onPatchReportClicked() {

    // Fire event
    if(common.isInEngine()){
        // Call a function to tell the game to stop cell to move
        Thrive.patchButtonClicked();
    } else {
        // Swap GUI for previewing
        doEnterMicrobeEditor();
    }

    document.getElementById("changePatch").style.visibility = "hidden";

    // Avoid click to same panel 
    if( !$("#" + this.id).css("background-image").includes("Active")) {
        for(const [i, button] of panelButtons.entries()) {
            if(button == this.id && this.id != activePanel) {

                counter = i;
                activePanel = button;

                document.getElementById( this.id).style.backgroundImage =
                    "url(../../Textures/gui/bevel/topLeftButtonActive.png)";
                document.getElementById( this.id).style.color = "#112B36";
                document.getElementById( this.id + "Tab").style.visibility = "visible";

                if(this.id == "editor") {
                    document.getElementById("EditorPanelTop").style.display = "block";
                    document.getElementById("EditorPanelBottom").style.visibility = "visible";
                    document.getElementById("next").style.visibility = "hidden";
                    Thrive.editorButtonClicked();

                } else if(this.id == "patch") {

                    // Instead of this every time we enter here should be taken the 
                    // Actual patch id
                    actualNode = microbe_hud.getId();

                    // Where we are where we can go
                    $(".nodeMap").each(function() {
                        if($(this).attr("data-here") == "true") {
                            actualNode = $(this).attr("id");
                            $("#" + actualNode).addClass("hereNode");
                            links =  links + $(this).attr("data-link");
                        }
                    });

                    document.getElementById(actualNode).click();
                }
            } else {
                document.getElementById(button).style.backgroundImage =
                    "url(../../Textures/gui/bevel/topLeftButton.png)";
                document.getElementById(button).style.color = "#FAFCFD";
                document.getElementById( button + "Tab").style.visibility = "hidden";
                document.getElementById("EditorPanelTop").style.display = "none";
                document.getElementById("EditorPanelBottom").style.visibility = "hidden";
                document.getElementById("next").style.visibility = "visible";
            }
        }
    }
}


// Patch is changed by going to editor
function onChangePatchClicked() {

    document.getElementById("changePatch").style.visibility = "hidden";
    const newHereNode = $("#" + newSelectedNode);
    newHereNode.addClass("hereNode");
    newHereNode.data( "data-here", "true");
    actualNode = newHereNode.attr("id");

    links = $("#" + actualNode).attr("data-link");

    document.getElementById("microbeHUDPatchTemperatureSituation").style.backgroundImage =
        "none";
    document.getElementById("microbeHUDPatchLightSituation").style.backgroundImage =
        "none";

    // Reset selectedNode
    if(document.getElementsByClassName("selectedNode").length != 0) {
        $(".selectedNode").removeClass("selectedNode");
    }
}


// Patch node click event
$(".nodeMap").click(function() {
    // Selected node
    newSelectedNode = event.target.id;

    // Update right Panel data
    // Probably here need to invoke the function that give us all information about
    // the selecte patch map

    const type = $("#" + this.id).attr("data-type");
    document.getElementById("patchName").innerHTML = type;

    // Change border color to highlight the selected node
    if(newSelectedNode != actualNode) {
        if(document.getElementsByClassName("selectedNode").length != 0) {
            $(".selectedNode").removeClass("selectedNode");
        }
    } else {
        $(".selectedNode").removeClass("selectedNode");
    }

    $("#" + newSelectedNode).addClass("selectedNode");

    const arrayLinks = links.split("-");

    for(const link of arrayLinks ) {
        if(event.target.id == link) {
            document.getElementById("changePatch").style.visibility = "visible";
            break;
        } else {
            document.getElementById("changePatch").style.visibility = "hidden";
        }
    }
});

function takeSelectedPatchData(type) {
    $.getJSON("./../SimulationParameters/MicrobeStage/Biomes.json", function(biomeData) {

        type = type.toLowerCase();

	    // We change arrows of variation only if isn't the actual node
	    if($("#" + actualNode).attr("data-type") !=  biomeData[type].name) {

	        // Check change for each value
	        // Light

	        if(actualPlayerPatchData[1] > parseFloat(biomeData[type].lightPower)) {
	            document.getElementById("microbeHUDPatchLightSituation").style.backgroundImage =
	                "url(../../Textures/gui/bevel/decrease.png)";
	        } else if(actualPlayerPatchData[1] <  parseFloat(biomeData[type].lightPower)) {
	            document.getElementById("microbeHUDPatchLightSituation").style.backgroundImage =
	                "url(../../Textures/gui/bevel/increase.png)";
	        } else {
	            document.getElementById("microbeHUDPatchLightSituation").style.backgroundImage =
	                "none";
	        }
	        document.getElementById("microbeHUDPatchLight").innerHTML = biomeData[type].lightPower;

	        // Temperature
	        if(actualPlayerPatchData[2] > parseFloat(biomeData[type].averageTemperature)) {
	            document.getElementById("microbeHUDPatchTemperatureSituation").style.backgroundImage =
	                "url(../../Textures/gui/bevel/decrease.png)";
	        } else if(actualPlayerPatchData[2]  < parseFloat(biomeData[type].averageTemperature)) {
	            document.getElementById("microbeHUDPatchTemperatureSituation").style.backgroundImage =
	                "url(../../Textures/gui/bevel/increase.png)";
	        } else {
	            document.getElementById("microbeHUDPatchTemperatureSituation").style.backgroundImage =
	                "none";
	        } 
	    } else {
	        actualPlayerPatchData = [biomeData[type].name, biomeData[type].lightPower,  biomeData[type].averageTemperature];
	        document.getElementById("microbeHUDPatchTemperatureSituation").style.backgroundImage =
	            "none";
	        document.getElementById("microbeHUDPatchLightSituation").style.backgroundImage =
	            "none";
	    }

        document.getElementById("microbeHUDPatchTemperature").innerText  = biomeData[type].averageTemperature;  
        document.getElementById("microbeHUDPatchLight").innerText = biomeData[type].lightPower; 
    });
}

function doDrawPatchMap() {
	// Draw map scripts here.
}

// Patch Map close button
function onConditionClicked() {
    const tab = $(this).attr("data-cond");

    $("#" + tab).animate({"height": "toggle"});
    $(this).toggleClass("minus");
    $(this).toggleClass("plus");
}
