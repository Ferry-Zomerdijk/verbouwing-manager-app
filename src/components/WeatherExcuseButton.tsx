import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  Sun,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudLightning,
  Snowflake,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRandomExcuse } from "@/lib/builderJokes";

const getWeatherIcon = (code: number | null) => {
  if (code === null) return Cloud;
  if (code === 0) return Sun;
  if (code <= 3) return CloudSun;
  if (code <= 48) return CloudFog;
  if (code <= 55) return CloudDrizzle;
  if (code <= 67) return CloudRain;
  if (code <= 77) return Snowflake;
  if (code <= 82) return CloudRain;
  return CloudLightning;
};

const getWeatherAnimation = (code: number | null): string => {
  if (code === null) return "text-foreground";
  if (code === 0) return "animate-spin-slow text-foreground"; // Zon draait
  if (code <= 3) return "animate-weather-wiggle text-foreground"; // Wolken wiebelen
  if (code <= 48) return "animate-weather-pulse text-foreground"; // Mist pulseert
  if (code <= 55) return "animate-weather-bounce text-foreground"; // Motregen bounced
  if (code <= 67) return "animate-weather-bounce text-foreground"; // Regen bounced
  if (code <= 77) return "animate-weather-float text-foreground"; // Sneeuw zweeft
  if (code <= 82) return "animate-weather-bounce text-foreground"; // Buien bouncen
  return "animate-weather-pulse text-foreground"; // Onweer flitst
};

const WeatherExcuseButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [excuse, setExcuse] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const [weatherCode, setWeatherCode] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Limmen, Nederland coördinaten
        const response = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=52.5425&longitude=4.7025&current_weather=true"
        );
        const data = await response.json();
        setWeatherCode(data.current_weather.weathercode);
        setTemperature(Math.round(data.current_weather.temperature));
      } catch (error) {
        console.error("Weather fetch failed:", error);
      }
    };

    fetchWeather();
    // Ververs elk uur
    const interval = setInterval(fetchWeather, 3600000);
    return () => clearInterval(interval);
  }, []);

  const generateExcuse = () => {
    setExcuse(getRandomExcuse(weatherCode));
    setDialogOpen(true);
    setClickCount((prev) => prev + 1);
  };

  const WeatherIcon = getWeatherIcon(weatherCode);
  const weatherAnimation = getWeatherAnimation(weatherCode);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={generateExcuse}
        className="text-muted-foreground hover:text-foreground"
        title={
          temperature !== null
            ? `Weer in Limmen: ${temperature}°C - Klik voor excuus`
            : "Weer-excuus generator"
        }
      >
        <WeatherIcon className={`w-4 h-4 ${weatherAnimation}`} />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WeatherIcon className={`w-5 h-5 ${weatherAnimation}`} />
              Officieel Weer-Excuus™
              {temperature !== null && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({temperature}°C in Limmen)
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-6 text-center">
              <p className="text-xl font-medium">{excuse}</p>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Excuus #{clickCount} • Gebruik met mate 😉
            </p>
            <Button
              onClick={() => setExcuse(getRandomExcuse(weatherCode))}
              variant="outline"
              className="w-full"
            >
              Nieuw excuus genereren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WeatherExcuseButton;
