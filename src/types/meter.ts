
export interface Meter {
  id: string;
  name: string;
  type: 'gas' | 'strom' | 'wasser';
  serialNumber: string;
  unit: string;
  createdAt: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  value: number;
  date: string;
  photo?: string;
  notes?: string;
  createdAt: string;
}
