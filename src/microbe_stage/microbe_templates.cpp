#include "microbe_templates.h"

#include "ThriveGame.h"

#include <Common/StringOperations.h>
#include <FileSystem.h>

#include <filesystem>

using namespace thrive;
// ------------------------------------ //
MicrobeTemplateData::MicrobeTemplateData(std::string& name,
    std::string& organelles,
    int membrane,
    float rigidity,
    Float4 colour) :
    name(name),
    organelles(organelles), membrane(membrane), colour(colour),
    rigidity(rigidity)
{}
// ------------------------------------ //
void
    MicrobeTemplates::Initialize()
{
    auto fs = Engine::Get()->GetFileSystem();

    std::vector<std::string> filesInDirectory;

    fs->GetFilesInDirectory(filesInDirectory, MICROBE_TEMPLATE_FOLDER);

	if(!m_templateFiles.empty())
        m_templateFiles.clear();

    for(auto& files : filesInDirectory) {
        std::string extension =
            Leviathan::StringOperations::GetExtension<std::string>(files);

        if(extension == "dna") {
            m_templateFiles.push_back(files);
        }
    }

	LOG_INFO("Found " + Leviathan::Convert::ToString(m_templateFiles.size()) +
             " DNA files");

    if(!m_templateData.empty())
        m_templateData.clear();

    for(auto& files : m_templateFiles) {
        loadMicrobeTemplate(files);
    }

	LOG_INFO("Loaded " + Leviathan::Convert::ToString(m_templateData.size()) +
             " microbe templates");
}
// ------------------------------------ //
MicrobeTemplateData*
    MicrobeTemplateData::factory(std::string& name,
        std::string& organelles,
        int membrane,
        float rigidity,
        Float4 colour)
{
    return new MicrobeTemplateData(
        name, organelles, membrane, rigidity, colour);
}
// ------------------------------------ //
void
    MicrobeTemplates::storeMicrobeTemplate(const MicrobeTemplateData& data)
{
    std::string stringData =
        data.name + ";" + data.organelles + ";" +
        std::to_string(data.membrane) + ";" + std::to_string(data.rigidity) +
        ";" + std::to_string(data.colour.X) + "," +
        std::to_string(data.colour.Y) + "," + std::to_string(data.colour.Z);

    auto fs = Engine::Get()->GetFileSystem();

	std::string path =
        std::filesystem::path(MICROBE_TEMPLATE_FOLDER + data.name + "." + "dna")
            .string();

    if(fs->WriteToFile(
           stringData, path)) {
        LOG_INFO("Saved player microbe");

		// Load the template right after saving so it will appear
        // on the template list, might need a better way to do this
        loadMicrobeTemplate(path);

    } else {
        LOG_ERROR("Failed to save template file!");
    }
}
// ------------------------------------ //
void
	MicrobeTemplates::loadMicrobeTemplate(const std::string& filepath)
{
    MicrobeTemplateData::pointer data = parseMicrobeTemplate(filepath);

	if(data == nullptr) {
        LOG_INFO("Failed to load template file");
        return;
	}

	// If the template is already loaded then remove it from the vector
    for(auto iter = m_templateData.begin(); iter != m_templateData.end();) {
        if(iter->get()->name == data->name) {
            m_templateData.erase(iter);
        } else {
            ++iter;
		}
    }

	m_templateData.push_back(data);

	// Send data to GUI
    auto event =
        GenericEvent::MakeShared<GenericEvent>("MicrobeTemplateListUpdated");

    auto vars = event->GetVariables();

    vars->Add(std::make_shared<NamedVariableList>(
        "templateName", new Leviathan::StringBlock(data->name)));

    Engine::Get()->GetEventHandler()->CallEvent(event);
}
// ------------------------------------ //
MicrobeTemplateData::pointer
    MicrobeTemplates::parseMicrobeTemplate(const std::string& filepath)
{
    auto fs = Engine::Get()->GetFileSystem();

    std::string stream;

    if(!fs->ReadFileEntirely(filepath, stream)) {
        LOG_ERROR("Failed to read template file!");
        return nullptr;
    }

    std::vector<std::string> genes;
    std::vector<std::string> colourGenes;

	Leviathan::StringOperations::CutString<std::string>(
        stream, std::string(";"), genes);
    Leviathan::StringOperations::CutString<std::string>(
        genes[4], std::string(","), colourGenes);

	if(genes.size() != 5) {
        LOG_ERROR("Invalid chromosome size, aborting parse!");
        return nullptr;
    }

	for(auto& chromosome : genes) {
        if(chromosome == "") {
            LOG_ERROR("Microbe has a missing chromosome, aborting parse!");
            return nullptr;
		}
	}

	Float4 colourData;
    colourData.X = Leviathan::Convert::StringTo<float>(colourGenes[0]);
    colourData.Y = Leviathan::Convert::StringTo<float>(colourGenes[1]);
    colourData.Z = Leviathan::Convert::StringTo<float>(colourGenes[2]);

	auto data = MicrobeTemplateData::MakeShared<MicrobeTemplateData>(genes[0],
        genes[1], Leviathan::Convert::StringTo<int>(genes[2]),
        Leviathan::Convert::StringTo<float>(genes[3]), colourData);

    return data;
}
