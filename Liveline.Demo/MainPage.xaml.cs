using Liveline.Models;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace Liveline.Demo;

/// <summary>
/// One Liveline chart on a live feed: a short loading state, then a volatile random walk with a new value
/// every 150 ms. The chart lerps toward each value and idles once it settles; its colours follow the app theme.
/// </summary>
public sealed partial class MainPage : Page
{
    private const int MaxPoints = 60;

    private readonly DispatcherTimer _timer;
    private readonly DispatcherTimer _loadingTimer;
    private readonly Queue<LivelinePoint> _data = new(MaxPoints);
    private readonly Random _rng = new();
    private double _currentValue = 100.0;

    public MainPage()
    {
        this.InitializeComponent();

        Chart.IsLoading = true;

        _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(150) };
        _timer.Tick += OnTimerTick;

        _loadingTimer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(3) };
        _loadingTimer.Tick += OnLoadingComplete;
        _loadingTimer.Start();
    }

    private void OnLoadingComplete(object? sender, object e)
    {
        _loadingTimer.Stop();

        var now = DateTimeOffset.Now;
        for (int i = MaxPoints; i > 0; i--)
        {
            _currentValue += (_rng.NextDouble() - 0.5) * 4;
            _data.Enqueue(new LivelinePoint(now.AddMilliseconds(-i * 100), _currentValue));
        }

        Chart.IsLoading = false;
        PushData();
        _timer.Start();
    }

    private void OnTimerTick(object? sender, object e)
    {
        // Volatile random walk: occasional large spikes and dips.
        double step = (_rng.NextDouble() - 0.5) * 8;
        if (_rng.NextDouble() < 0.08)
        {
            step *= 6;
        }
        _currentValue += step;

        _data.Enqueue(new LivelinePoint(DateTimeOffset.Now, _currentValue));
        while (_data.Count > MaxPoints)
        {
            _data.Dequeue();
        }

        PushData();
    }

    private void PushData()
    {
        Chart.Data = _data.ToArray();
        Chart.Value = _currentValue;
    }
}
