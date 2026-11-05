# Liveline

Liveline is a real-time line chart control for Uno Platform, drawn with SkiaSharp. This sample shows one chart on a
live feed: a short loading state, then a volatile random walk with a new value every 150 ms.

![The chart on desktop](.studiolive/screenshots/chart-desktop.png)

## What it shows

- **The chart:** a smooth line with a gradient fill, a grid with value and time labels, a badge with the latest value,
  and a live dot at the line's end.
- **Easing:** the line, the value range and the badge ease toward each new value (`LerpSpeed`).
- **Idle when settled:** the control draws on `CompositionTarget.Rendering` only while the line moves, and lets go of
  it once the line settles.
- **One colour:** `LivelineTheme` sets the whole palette from one colour, in dark or light.

The data is simulated on the page; nothing leaves the device.

## Built with

- Uno Platform single project, with Uno.Sdk pinned in `global.json`: desktop and WebAssembly.
- SkiaSharp on `SKCanvasElement` (the `Skia` feature), Material and Toolkit.
- The control is the `Liveline/` folder of the project; the page in `MainPage.xaml` hosts it.

## Try it

You need the .NET 10 SDK; the Uno.Sdk version comes from `global.json`.

```bash
# Desktop
dotnet run --project Liveline.Demo/Liveline.Demo.csproj -f net10.0-desktop

# WebAssembly
dotnet publish Liveline.Demo/Liveline.Demo.csproj -f net10.0-browserwasm -c Release -o publish
# then serve publish/wwwroot with any static file server
```

In Visual Studio, Rider or VS Code, open `Liveline.sln`.

## Use the control

```xml
<liveline:LivelineChart x:Name="Chart" ShowGrid="True" ShowBadge="True" ShowFill="True"
                        Momentum="True" LerpSpeed="0.04" />
```

```csharp
Chart.Theme = new LivelineTheme { Color = "#4CAF50", IsDark = true };
Chart.Data = points;   // IList<LivelinePoint>: time and value
Chart.Value = latest;  // the value the badge and the live dot show
```

## Layout

| Path | What is there |
|---|---|
| `Liveline.Demo/MainPage.xaml(.cs)` | the page and its simulated feed |
| `Liveline.Demo/Liveline/` | the control: `LivelineChart`, its `SKCanvasElement` canvas, the renderers, the easing engine, the models |
| `.studiolive/`, `uno-sample.json` | the Studio info files, icon and screenshots |
