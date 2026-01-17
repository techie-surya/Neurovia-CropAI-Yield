/**
 * Weather API Integration
 * Using OpenWeatherMap API (free tier)
 * Get your API key from: https://openweathermap.org/api
 */

const WEATHER_API_KEY = 'babf0f4e684e15176c2fc62d0a394fac'; // OpenWeatherMap API Key
const WEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

/* -------------------------------------------------------------------------- */
/*                                 Interfaces                                 */
/* -------------------------------------------------------------------------- */

export interface WeatherData {
  location: string;
  country: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  precipitation: number;
  description: string;
  icon: string;
  sunrise: number;
  sunset: number;
  cloudiness: number;
}

export interface WeatherForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  description: string;
  icon: string;
  humidity: number;
}

/* -------------------------------------------------------------------------- */
/*                          Current Weather (by City)                          */
/* -------------------------------------------------------------------------- */

export async function getCurrentWeather(
  city: string = "Mumbai"
): Promise<WeatherData | null> {
  if (!isWeatherAPIConfigured()) return null;

  try {
    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error("Failed to fetch weather data");

    const data = await response.json();

    const weather: WeatherData = {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6), // m/s → km/h
      precipitation: data?.rain?.["1h"] ?? 0,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      cloudiness: data.clouds.all,
    };

    return weather;
  } catch (err) {
    console.error("Weather API Error:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                        Current Weather (by GPS coords)                     */
/* -------------------------------------------------------------------------- */

export async function getWeatherByCoordinates(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  if (!isWeatherAPIConfigured()) return null;

  try {
    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error("Failed to fetch weather data");

    const data = await response.json();

    const weather: WeatherData = {
      location: data.name,
      country: data.sys.country,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: Math.round(data.wind.speed * 3.6),
      precipitation: data?.rain?.["1h"] ?? 0,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      cloudiness: data.clouds.all,
    };

    return weather;
  } catch (err) {
    console.error("Weather API Error:", err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                                 Forecast (5d)                               */
/* -------------------------------------------------------------------------- */

export async function getWeatherForecast(
  city: string = "Mumbai"
): Promise<WeatherForecast[]> {
  if (!isWeatherAPIConfigured()) return [];

  try {
    const response = await fetch(
      `${WEATHER_BASE_URL}/forecast?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
    );

    if (!response.ok) throw new Error("Failed to fetch forecast data");

    const data = await response.json();

    const daily: { [key: string]: any } = {};

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!daily[date]) daily[date] = item;
    });

    return Object.values(daily)
      .slice(0, 5)
      .map((item: any) => ({
        date: new Date(item.dt * 1000).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        tempMax: Math.round(item.main.temp_max),
        tempMin: Math.round(item.main.temp_min),
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
      }));
  } catch (err) {
    console.error("Forecast API Error:", err);
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*                              Helper Functions                              */
/* -------------------------------------------------------------------------- */

export function getWeatherIconUrl(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function getWeatherEmoji(description: string): string {
  if (!description) return "🌤️";
  const lower = description.toLowerCase();

  if (lower.includes("clear")) return "☀️";
  if (lower.includes("cloud")) return "☁️";
  if (lower.includes("rain")) return "🌧️";
  if (lower.includes("thunder")) return "⛈️";
  if (lower.includes("snow")) return "❄️";
  if (lower.includes("mist") || lower.includes("fog")) return "🌫️";
  if (lower.includes("drizzle")) return "🌦️";

  return "🌤️";
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* -------------------------------------------------------------------------- */
/*                             Farming Recommendations                         */
/* -------------------------------------------------------------------------- */

export function getFarmingAdvice(weather: WeatherData): string {
  const { temperature, humidity, precipitation, windSpeed } = weather;

  if (temperature > 35) return "High temperature alert! Increase irrigation.";
  if (temperature < 10) return "Cold warning! Protect crops from frost.";
  if (precipitation > 10) return "Heavy rain! Ensure proper drainage.";
  if (humidity < 40) return "Low humidity. Increase watering.";
  if (humidity > 80 && temperature > 25)
    return "High humidity → fungal disease risk.";
  if (windSpeed > 40) return "Strong winds! Secure plants.";

  if (temperature >= 20 && temperature <= 30 && humidity >= 50 && humidity <= 70)
    return "Excellent conditions for farming today!";

  return "Monitor weather and adjust farming activities.";
}

/* -------------------------------------------------------------------------- */
/*                                Mock Weather                                */
/* -------------------------------------------------------------------------- */

export function getMockWeatherData(): WeatherData {
  return {
    location: "Mumbai",
    country: "IN",
    temperature: 28,
    feelsLike: 30,
    humidity: 65,
    pressure: 1013,
    windSpeed: 15,
    precipitation: 0,
    description: "partly cloudy",
    icon: "02d",
    sunrise: Date.now() / 1000 - 7200,
    sunset: Date.now() / 1000 + 7200,
    cloudiness: 40,
  };
}

/* -------------------------------------------------------------------------- */
/*                         API Config Check (Fixed)                           */
/* -------------------------------------------------------------------------- */

export function isWeatherAPIConfigured(): boolean {
  return WEATHER_API_KEY.trim().length > 0;
}
