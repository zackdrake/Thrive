#include "game_setup.as"

// Need global variable so script won't die. There is probably a better way to do this but...
GameSetup@ gameSetup;

// Called from ThriveGame when the game setup ui has been entered and it should be setup
void onGameSetupEntry(Planet@ planet)
{
    LOG_INFO("Running game setup script setup");
    @gameSetup = GameSetup(planet);
    gameSetup.init();
}
