#include "microbe_templates.h"

#include "ThriveGame.h"

#include <Common/StringOperations.h>
#include <FileSystem.h>

#include <json/json.h>
#include <boost/filesystem.hpp>

using namespace thrive;
// ------------------------------------ //
MicrobeTemplateData::MicrobeTemplateData(std::string name,
    std::string organelles,
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

    // Create the directory if it doesn't exist/found
    if(!fs->FileExists(MICROBE_TEMPLATE_DIRECTORY)) {
        if(!boost::filesystem::create_directory(MICROBE_TEMPLATE_DIRECTORY))
            LOG_ERROR("Failed to create microbe template directory!");
    }

    fs->GetFilesInDirectory(filesInDirectory, MICROBE_TEMPLATE_DIRECTORY);

    if(!m_templateFiles.empty())
        m_templateFiles.clear();

    for(auto& files : filesInDirectory) {
        std::string extension =
            Leviathan::StringOperations::GetExtension<std::string>(files);

        if(extension == TEMPLATE_FILE_EXTENSION) {
            m_templateFiles.push_back(files);
        }
    }

    LOG_INFO("Found " + Leviathan::Convert::ToString(m_templateFiles.size()) +
             " template files");

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
    std::string path =
        MICROBE_TEMPLATE_DIRECTORY + data.name + "." + TEMPLATE_FILE_EXTENSION;

    Json::Value chromosomes;

    chromosomes["name"] = data.name;
    chromosomes["organelles"] = data.organelles;
    chromosomes["membrane"] = data.membrane;
    chromosomes["rigidity"] = data.rigidity;

    chromosomes["colourR"] = data.colour.X;
    chromosomes["colourG"] = data.colour.Y;
    chromosomes["colourB"] = data.colour.Z;

    std::stringstream sstream;
    Json::StreamWriterBuilder builder;
    std::unique_ptr<Json::StreamWriter> writer(builder.newStreamWriter());

    writer->write(chromosomes, &sstream);

    if(Engine::Get()->GetFileSystem()->WriteToFile(sstream.str(), path)) {
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
    MicrobeTemplates::loadMicrobeTemplate(const std::string filepath)
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
        GenericEvent::MakeShared<GenericEvent>("MicrobeTemplateListAdded");

    auto vars = event->GetVariables();

    vars->Add(std::make_shared<NamedVariableList>(
        "templateName", new Leviathan::StringBlock(data->name)));

    Engine::Get()->GetEventHandler()->CallEvent(event);
}
// ------------------------------------ //
MicrobeTemplateData::pointer
    MicrobeTemplates::parseMicrobeTemplate(const std::string filepath)
{
    std::string extension =
        Leviathan::StringOperations::GetExtension<std::string>(filepath);

    if(extension != TEMPLATE_FILE_EXTENSION) {
        LOG_ERROR("Invalid file extension, aborting parse!");
        return nullptr;
    }

    std::ifstream file;
    file.open(filepath);

    LEVIATHAN_ASSERT(file.is_open(), "Failed to open template file!");

    Json::Value chromosomes;

    try {
        file >> chromosomes;
    } catch(const Json::RuntimeError& e) {
        LOG_ERROR(std::string("Syntax error in template file") +
                  ", description: " + std::string(e.what()));
        throw e;
    }

    Float4 colourData;
    colourData.X = chromosomes["colourR"].asFloat();
    colourData.Y = chromosomes["colourG"].asFloat();
    colourData.Z = chromosomes["colourB"].asFloat();

    return MicrobeTemplateData::MakeShared<MicrobeTemplateData>(
        chromosomes["name"].asString(), chromosomes["organelles"].asString(),
        chromosomes["membrane"].asInt(), chromosomes["rigidity"].asFloat(),
        colourData);
}
