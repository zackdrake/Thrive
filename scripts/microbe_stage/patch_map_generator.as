// The patch map generator is defined in this script file to make modifying it easier
PatchMap@ generatePatchMap(Planet@ planet)
{
    return PatchMapGenerator::runGeneration(planet);
}

// Private hidden functions
namespace PatchMapGenerator{

int height = 650;
int level1 = 15;
int level2 = 500;

double interpolate(double maxi, double mini, double value)
{
    return ((value - mini) / (maxi - mini));
}

int getDepth(int y, int oceanDepth, double landPercentage)
{
    double waterPercentage = 1 - landPercentage;
    double percentage = y / float(height);

    if(percentage < landPercentage)
    {
        return int(-(height * landPercentage - y) * 15 / (height * landPercentage));
    } else if(percentage < (landPercentage + 0.30 * waterPercentage)){
        return int(level1 * interpolate(landPercentage + 0.30 * waterPercentage, landPercentage, percentage));
    } else if(percentage < (landPercentage + 0.70 * waterPercentage)){
        return int(level1 + height * interpolate(landPercentage + 0.70 * waterPercentage, landPercentage + 0.30 * waterPercentage, percentage));
    }

    return int(level2 + (oceanDepth - level2) * interpolate(1, landPercentage + 0.70 * waterPercentage, percentage));
}

string getType(int oceanDepth, int patchDepth)
{
    if(patchDepth < 0)
    {
        return GetEngine().GetRandom().GetNumber(0, 3) == 0 ? "ice_shelf" : (GetEngine().GetRandom().GetNumber(0, 1) == 0 ? "tidepool" : "estuary");
    } else if(patchDepth < level1){
        return GetEngine().GetRandom().GetNumber(0, 1) == 0 ? "epipelagic" : "coastal";
    } else if(patchDepth < level2){
        return GetEngine().GetRandom().GetNumber(0, 7) == 0 ? "underwater_cave" : "mesopelagic";
    } else if (patchDepth >= level2 && patchDepth < 0.8 * oceanDepth){
        return GetEngine().GetRandom().GetNumber(0, 7) == 0 ? "underwater_cave" : "bathypelagic";
    }

    switch (GetEngine().GetRandom().GetNumber(0, 3))
    {
    case 0:
    case 1:
        return "seafloor";
    case 2:
        return "volcanic_vent";
    case 3:
        return "abyssopelagic";
    }
    
    return "invalid";
}

PatchMap@ runGeneration(Planet@ planet)
{
    PatchMap@ map = PatchMap();
    map.setPlanet(planet);
    int id = 0;
    array<Patch@> patches;

    while(true){
        bool madePatch = false;
        Float2 pos = Float2(0, 0);
        int depth = 0;
        string type = "invalid";

        for(uint tries = 0; tries < 1000 && !madePatch; tries++){
            pos = Float2(GetEngine().GetRandom().GetNumber(50, 800), GetEngine().GetRandom().GetNumber(30, height));
            depth = getDepth(int(pos.Y), int(planet.oceanDepth), planet.landPercentage);
            type = getType(int(planet.oceanDepth), depth);
            madePatch = true;

            for(uint i = 0; i < patches.length(); ++i){
                Float2 otherPos = patches[i].getScreenCoordinates();

                if((otherPos.X - pos.X)**2 + (otherPos.Y - pos.Y)**2 < 5625)
                {
                    madePatch = false;
                    break;
                }
            }
        }

        if(!madePatch)
        {
            LOG_INFO("A patch failed to generate, ceasing patch generation");
            break;
        }
        
        const Biome@ biome = getBiomeTemplate(type);
        Patch@ patch = Patch("Pangonian " + biome.name, id, biome);
        patch.setScreenCoordinates(pos);
        patches.insertLast(patch);
        LOG_INFO("Added patch " + patch.getId() + " " + patch.getName());
        id++;
    }

    int bestDist = 500;
    Patch@ bestPatch;

    for(uint i = 0; i < patches.length(); ++i){
        Patch@ patch = patches[i];
        int dist = int(abs((50 + 800) / 2 - patch.getScreenCoordinates().X));

        if(patch.getBiome().internalName == "volcanic_vent" && dist < bestDist)
        {
            bestDist = dist;
            @bestPatch = patch;
        }
    }

    if(bestPatch is null)
    {
        int lowestHeight = 0;
        int lowestPatchIdx = 0;

        for(uint i = 0; i < patches.length(); ++i){
            Patch@ patch = patches[i];
            
            if(patch.getScreenCoordinates().Y > lowestHeight)
            {
                lowestHeight = int(patch.getScreenCoordinates().Y);
                lowestPatchIdx = i;
            }
        }

        Patch@ lowestPatch = patches[lowestPatchIdx];
        Float2 oldScreenCoordinates = lowestPatch.getScreenCoordinates();
        const Biome@ biome = getBiomeTemplate("volcanic_vent");
        @patches[lowestPatchIdx] = Patch("Pangonian " + biome.name, lowestPatch.getId(), biome);
        patches[lowestPatchIdx].setScreenCoordinates(oldScreenCoordinates);
        @bestPatch = patches[lowestPatchIdx];
    }

    LOG_INFO("Selected starter patch: " + bestPatch.getId() + " " + bestPatch.getName());

    auto defaultSpecies = Species::createDefaultSpecies();
    for(uint i = 0; i < defaultSpecies.length(); ++i){
        bestPatch.addSpecies(defaultSpecies[i]);
    }

    // Add neighbor patches
    for(uint i = 0; i < patches.length(); ++i){
        Patch@ patch = patches[i];
        Float2 pos = patch.getScreenCoordinates();
        int depth = getDepth(int(pos.Y), int(planet.oceanDepth), planet.landPercentage);
        bool wasNeighborAdded = false;

        for(uint j = 0; j < patches.length(); ++j){
            Patch@ otherPatch = patches[j];
            Float2 otherPos = otherPatch.getScreenCoordinates();
            int otherDepth = getDepth(int(otherPos.Y), int(planet.oceanDepth), planet.landPercentage);

            if(abs(pos.X - otherPos.X) < 100 && abs(pos.Y - otherPos.Y) < 120 && otherPatch !is patch)
            {
                if(depth < level1 && otherDepth < level1)
                {
                    patch.addNeighbour(otherPatch.getId());
                    wasNeighborAdded = true;
                } else if(depth > 0 && otherDepth > 0 && depth < level2 && otherDepth < level2){
                    patch.addNeighbour(otherPatch.getId());
                    wasNeighborAdded = true;
                } else if(depth > level1 && otherDepth > level1){
                    patch.addNeighbour(otherPatch.getId());
                    wasNeighborAdded = true;
                }
            }
        }

        // Wasn't close enough to any other patches to get a neighbor, so just add the nearest
        if(!wasNeighborAdded)
        {
            LOG_WARNING("Patch " + patch.getId() + " " + patch.getName() + " was not connected by normal connection process, so adding closest patch as neighbor");
            double closestDist = 1000000000;
            Patch@ closestPatch;

            for(uint j = 0; j < patches.length(); ++j){
                Patch@ otherPatch = patches[j];
                Float2 otherPos = otherPatch.getScreenCoordinates();
                double dist = (otherPos.X - pos.X)**2 + (otherPos.Y - pos.Y)**2;

                if(dist < closestDist && otherPatch !is patch)
                {
                    closestDist = dist;
                    @closestPatch = otherPatch;
                }
            }

            patch.addNeighbour(closestPatch.getId());
            closestPatch.addNeighbour(patch.getId());
        }
    }

    // Actually add them to the map
    for(uint i = 0; i < patches.length(); ++i){
        map.addPatch(patches[i]);
    }

    map.setCurrentPatch(bestPatch.getId());
    LOG_INFO("Completed patch generation");

    return map;
}

const Biome@ getBiomeTemplate(const string &in name)
{
    const auto id = SimulationParameters::biomeRegistry().getTypeId(name);
    return SimulationParameters::biomeRegistry().getTypeData(id);
}

}

