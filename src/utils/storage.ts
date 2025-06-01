
import { Meter, MeterReading } from '@/types/meter';

const METERS_KEY = 'meter_app_meters';
const READINGS_KEY = 'meter_app_readings';

export const storageUtils = {
  // Meters
  getMeters: (): Meter[] => {
    const stored = localStorage.getItem(METERS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveMeters: (meters: Meter[]) => {
    localStorage.setItem(METERS_KEY, JSON.stringify(meters));
  },

  // Readings
  getReadings: (): MeterReading[] => {
    const stored = localStorage.getItem(READINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  },

  saveReadings: (readings: MeterReading[]) => {
    localStorage.setItem(READINGS_KEY, JSON.stringify(readings));
  },

  // Get readings for specific meter
  getReadingsForMeter: (meterId: string): MeterReading[] => {
    const allReadings = storageUtils.getReadings();
    return allReadings.filter(reading => reading.meterId === meterId);
  },

  // Get latest reading for meter
  getLatestReading: (meterId: string): MeterReading | null => {
    const readings = storageUtils.getReadingsForMeter(meterId);
    if (readings.length === 0) return null;
    return readings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
};
