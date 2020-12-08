using System;
using Godot;
using System.Timers;

public class ToxinCloud : Particles
{
    int timeToDissapear = 150000;

    public override void _Ready()
    {
    System.Timers.Timer aTimer = new System.Timers.Timer();
    aTimer.Elapsed += new ElapsedEventHandler(OnTimedEvent);
    aTimer.Interval = timeToDissapear;
    aTimer.Enabled = true;
    }

private void OnTimedEvent(object source, ElapsedEventArgs e)
{
    GD.Print("3");
    GetTree().QueueDelete(this);
}
   
}
