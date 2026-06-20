import type { WeatherData } from '../types/recovery.types';

// WMO Weather interpretation codes
const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Quang đãng';
  if (code === 1 || code === 2 || code === 3) return 'Nhiều mây';
  if (code === 45 || code === 48) return 'Sương mù';
  if (code === 51 || code === 53 || code === 55) return 'Mưa phùn';
  if (code >= 61 && code <= 65) return 'Mưa';
  if (code >= 71 && code <= 75) return 'Tuyết';
  if (code === 95 || code === 96 || code === 99) return 'Bão sấm sét';
  return 'Không xác định';
};

export const fetchCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    
    return {
      temp: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      condition: getWeatherCondition(data.current.weather_code),
      source: 'auto'
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
};
