class GameSetup{
    GameSetup(Planet@ planetIn){
        @eventListener = EventListener(null, OnGenericEventCallback(this.onGeneric));
		eventListener.RegisterForEvent("GameSetupGenerationTypeSelected");
		eventListener.RegisterForEvent("GameSetupStarMassInput");
		eventListener.RegisterForEvent("GameSetupStarSetSol");
		eventListener.RegisterForEvent("GameSetupPlanetMassInput");
		eventListener.RegisterForEvent("GameSetupPlanetSetEarth");
		@planet = planetIn;
    }

	void init()
	{
		// Reset to random if nothing is selected
        if(generationType == ""){
            LOG_INFO("Selecting generator type 'random'");

            GenericEvent@ event = GenericEvent("GameSetupGenerationTypeSelected");
            NamedVars@ vars = event.GetNamedVars();

            vars.AddValue(ScriptSafeVariableBlock("generationType", "random"));

            GetEngine().GetEventHandler().CallEvent(event);
        }

		updateGui();
	}

	void updateGui()
	{
		LOG_INFO("Sending event to update game setup GUI");
		GenericEvent@ event = GenericEvent("GameSetupPlanetModified");
        NamedVars@ vars = event.GetNamedVars();
        vars.AddValue(ScriptSafeVariableBlock("data", planet.toJSONString()));
        GetEngine().GetEventHandler().CallEvent(event);
	}

	int onGeneric(GenericEvent@ event)
    {
		auto type = event.GetType();
		LOG_INFO("Game setup got event of type " + type);

		if(type == "GameSetupGenerationTypeSelected")
		{
			NamedVars@ vars = event.GetNamedVars();
			generationType = string(vars.GetSingleValueByName("generationType"));

			if(generationType == "random")
			{
				planet.randomize();
			}

            updateGui();
			return 1;
		} else if(type == "GameSetupStarMassInput"){
			NamedVars@ vars = event.GetNamedVars();
			planet.orbitingBody.setMass(double(vars.GetSingleValueByName("mass")));
			updateGui();
			return 1;
		} else if(type == "GameSetupStarSetSol"){
			planet.orbitingBody.setSol();
			updateGui();
			return 1;
		} else if(type == "GameSetupPlanetMassInput"){
			NamedVars@ vars = event.GetNamedVars();
			planet.setPlanetMass(double(vars.GetSingleValueByName("mass")));
			updateGui();
			return 1;
		} else if(type == "GameSetupPlanetSetEarth"){
			planet.setEarth();
			updateGui();
			return 1;
		}

		LOG_ERROR("Game setup got unknown event: " + type);
        return -1;
	}

	private Planet@ planet;
	private string generationType;
	private EventListener@ eventListener;
}
