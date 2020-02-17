#include "script_initializer.h"

#include "microbe_stage/microbe_templates.h"

#include <Script/Bindings/BindHelpers.h>
#include <Script/ScriptConversionHelpers.h>
#include <Script/ScriptExecutor.h>

using namespace thrive;

static asITypeInfo* WrapperTypeInfo = nullptr;

CScriptArray*
    microbeTemplateGetTemplatesWrapper(const MicrobeTemplates& self)
{
    const auto& templates = self.getTemplates();

    LEVIATHAN_ASSERT(
        WrapperTypeInfo, "map wrapper type info is not retrieved");

    CScriptArray* array = CScriptArray::Create(WrapperTypeInfo);

    if(!array)
        return nullptr;

    array->Reserve(static_cast<asUINT>(templates.size()));

    for(auto iter = templates.begin(); iter != templates.end(); ++iter) {
        MicrobeTemplateData* tmp = iter->get();
        array->InsertLast(&tmp);
    }

    return array;
}

bool
    thrive::registerMicrobeTemplates(asIScriptEngine* engine)
{
    // ----------------------------------- //
    // Microbe Templates
    ANGELSCRIPT_REGISTER_REF_TYPE("MicrobeTemplateData", MicrobeTemplateData);

    if(engine->RegisterObjectBehaviour("MicrobeTemplateData", asBEHAVE_FACTORY,
           "MicrobeTemplateData@ f(string &in name, string &in organelles, "
           "int membrane, float rigidity, Float4 colour) ",
           asFUNCTION(MicrobeTemplateData::factory), asCALL_CDECL) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectProperty("MicrobeTemplateData", "string name",
           asOFFSET(MicrobeTemplateData, name)) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectProperty("MicrobeTemplateData",
           "string organelles",
           asOFFSET(MicrobeTemplateData, organelles)) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectProperty("MicrobeTemplateData", "int membrane",
           asOFFSET(MicrobeTemplateData, membrane)) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectProperty("MicrobeTemplateData", "Float4 colour",
           asOFFSET(MicrobeTemplateData, colour)) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectProperty("MicrobeTemplateData", "float rigidity",
           asOFFSET(MicrobeTemplateData, rigidity)) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectType(
           "MicrobeTemplates", 0, asOBJ_REF | asOBJ_NOCOUNT) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectMethod("MicrobeTemplates",
           "void storeMicrobeTemplate(const MicrobeTemplateData &in data)",
           asMETHOD(MicrobeTemplates, storeMicrobeTemplate),
           asCALL_THISCALL) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectMethod("MicrobeTemplates",
           "void loadMicrobeTemplate(const string &in "
           "filepath)",
           asMETHOD(MicrobeTemplates, loadMicrobeTemplate),
           asCALL_THISCALL) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectMethod("MicrobeTemplates",
           "MicrobeTemplateData@ parseMicrobeTemplate(const string &in "
           "filepath)",
           asMETHOD(MicrobeTemplates, parseMicrobeTemplate),
           asCALL_THISCALL) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    WrapperTypeInfo =
        Leviathan::ScriptExecutor::Get()->GetASEngine()->GetTypeInfoByDecl(
            "array<const MicrobeTemplateData@>");

    if(!WrapperTypeInfo) {
        LOG_ERROR("could not get type info for wrapper");
        return false;
    }

    if(engine->RegisterObjectMethod("MicrobeTemplates",
           "array<const MicrobeTemplateData@>@ getTemplates() const",
           asFUNCTION(microbeTemplateGetTemplatesWrapper),
           asCALL_CDECL_OBJFIRST) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    if(engine->RegisterObjectMethod("MicrobeTemplates",
           "array<MicrobeTemplateData@>@ getTemplates()",
           asFUNCTION(microbeTemplateGetTemplatesWrapper),
           asCALL_CDECL_OBJFIRST) < 0) {
        ANGELSCRIPT_REGISTERFAIL;
    }

    return true;
}
