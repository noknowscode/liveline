namespace Liveline.Models;

public enum MomentumDirection
{
    Off,
    Up,
    Down,
    Flat
}

public static class MomentumHelper
{
    /// <summary>
    /// Resolves the <c>Momentum</c> property value into a concrete direction.
    /// <c>false</c>, <c>"false"</c> or <c>"off"</c> → <see cref="MomentumDirection.Off"/>;
    /// <c>"up"</c>/<c>"down"</c>/<c>"flat"</c> → forced direction;
    /// <c>true</c>, <c>"true"</c> or <c>"auto"</c> → auto-detect from delta.
    /// XAML passes <c>Momentum="True"</c> as text (the property is typed <c>object</c>), so text is read case-insensitively.
    /// </summary>
    public static MomentumDirection Resolve(object? value, double currentValue, double previousValue)
    {
        if (value is false)
            return MomentumDirection.Off;

        if (value is string s)
        {
            switch (s.Trim().ToLowerInvariant())
            {
                case "up": return MomentumDirection.Up;
                case "down": return MomentumDirection.Down;
                case "flat": return MomentumDirection.Flat;
                case "true":
                case "auto":
                    break; // auto-detect below
                default:
                    return MomentumDirection.Off; // "false", "off" and anything unknown
            }
        }

        if (value is null)
            return MomentumDirection.Off;

        double delta = currentValue - previousValue;
        double threshold = Math.Max(Math.Abs(currentValue) * 0.001, 0.001);

        if (delta > threshold) return MomentumDirection.Up;
        if (delta < -threshold) return MomentumDirection.Down;
        return MomentumDirection.Flat;
    }
}
