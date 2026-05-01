// Socorro live weather — proxies OpenWeatherMap so the API key stays server-side.
// Set OPENWEATHER_API_KEY in .env.local to enable live sync.
// Returns { isLive: false } gracefully when no key is configured.

export const dynamic = "force-dynamic";

const LAT = 9.621;
const LON = 125.967;

function codeToPreset(code: number): string {
  if (code >= 200 && code < 300) return "storm";
  if (code >= 300 && code < 400) return "rain";
  if (code >= 500 && code < 510) return "rain";
  if (code >= 510 && code < 600) return "storm";
  if (code >= 700 && code < 800) return "overcast";
  if (code === 800 || code === 801) return "sunny";
  if (code === 802) return "cloudy";
  return "overcast"; // 803, 804 and any unrecognised
}

export async function GET() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    return Response.json({ isLive: false, reason: "no-key" });
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${key}&units=metric`,
      { next: { revalidate: 600 } },  // cache for 10 minutes at the edge
    );

    if (!res.ok) {
      return Response.json({ isLive: false, reason: `api-${res.status}` });
    }

    const data = await res.json();
    const code        = (data.weather?.[0]?.id   as number) ?? 800;
    const description = (data.weather?.[0]?.description as string) ?? "clear sky";
    const tempC       = Math.round((data.main?.temp as number) ?? 28);
    const humidity    = (data.main?.humidity as number) ?? 75;

    return Response.json({
      isLive:      true,
      preset:      codeToPreset(code),
      description,
      tempC,
      humidity,
      updatedAt:   new Date().toISOString(),
    });
  } catch {
    return Response.json({ isLive: false, reason: "fetch-error" });
  }
}
