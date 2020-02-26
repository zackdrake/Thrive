#pragma once

#include <Common/Types.h>
#include <Common/ReferenceCounted.h>

#include <string>
#include <vector>
#include <map>

class CScriptArray;

namespace thrive {

constexpr auto MICROBE_TEMPLATE_DIRECTORY = "Data/MicrobeTemplates/";
constexpr auto TEMPLATE_FILE_EXTENSION = "dna";

class MicrobeTemplateData : public Leviathan::ReferenceCounted {
protected:
    friend ReferenceCounted;
    MicrobeTemplateData(std::string name,
        std::string organelles,
        int membrane,
        float rigidity,
        Float4 colour);

public:
    ~MicrobeTemplateData() = default;

    std::string name;
    // TODO: Replace with OrganelleTemplatePlaced
    std::string organelles;
    int membrane;
    float rigidity;
    Float4 colour;

    //! Factory for scripts
    static MicrobeTemplateData*
        factory(std::string& name,
            std::string& organelles,
            int membrane,
            float rigidity,
            Float4 colour);

    REFERENCE_COUNTED_PTR_TYPE(MicrobeTemplateData);
};

class MicrobeTemplates {
public:
    void
        Initialize();

	// Write the microbe template data into a file
    void
        storeMicrobeTemplate(const MicrobeTemplateData& data);

    void
        loadMicrobeTemplate(const std::string filepath);

    MicrobeTemplateData::pointer
        parseMicrobeTemplate(const std::string filepath);

    auto&
        getTemplates()
    {
        return m_templateData;
    }

    const auto&
        getTemplates() const
    {
        return m_templateData;
    }

    CScriptArray*
        getTemplatesWrapper();

private:
    std::vector<std::string> m_templateFiles;
    std::vector<MicrobeTemplateData::pointer> m_templateData;
};

} // namespace thrive