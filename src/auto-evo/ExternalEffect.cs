/// <summary>
///   Population effect external to the auto-evo simulation
/// </summary>
public class ExternalEffect
{
    public ExternalEffect(Species species, int constant, float coefficient, string eventType, int patchIndex)
    {
        Species = species;
        Constant = constant;
        Coefficient = coefficient;
        EventType = eventType;
        PatchIndex = patchIndex;
    }

    public Species Species { get; }
    public int Constant { get; set; }
    public float Coefficient { get; set; }
    public string EventType { get; set; }
    public int PatchIndex { get; set; }
}
