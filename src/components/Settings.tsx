import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, Droplets, Flame, Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface CostSettings {
  strom: number;
  gas: number;
  wasser: number;
}

const COST_SETTINGS_KEY = 'meter_app_cost_settings';

const DEFAULT_COSTS: CostSettings = {
  strom: 0.35,
  gas: 0.12,
  wasser: 4.50
};

interface SettingsProps {
  onCostSettingsChange?: (settings: CostSettings) => void;
}

const Settings = ({ onCostSettingsChange }: SettingsProps) => {
  const [costSettings, setCostSettings] = useState<CostSettings>(DEFAULT_COSTS);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Lade gespeicherte Einstellungen
    const stored = localStorage.getItem(COST_SETTINGS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCostSettings(parsed);
      } catch (error) {
        console.error('Fehler beim Laden der Kostensätze:', error);
      }
    }
  }, []);

  const handleCostChange = (type: keyof CostSettings, value: string) => {
    const numValue = parseFloat(value) || 0;
    setCostSettings(prev => ({
      ...prev,
      [type]: numValue
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    localStorage.setItem(COST_SETTINGS_KEY, JSON.stringify(costSettings));
    setHasChanges(false);
    
    if (onCostSettingsChange) {
      onCostSettingsChange(costSettings);
    }

    toast({
      title: "Einstellungen gespeichert",
      description: "Die Kostensätze wurden erfolgreich aktualisiert.",
    });
  };

  const handleReset = () => {
    setCostSettings(DEFAULT_COSTS);
    setHasChanges(true);
    toast({
      title: "Zurückgesetzt",
      description: "Die Kostensätze wurden auf die Standardwerte zurückgesetzt.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Einstellungen</h2>
        <p className="text-muted-foreground">
          Verwalten Sie hier Ihre Kostensätze für die Verbrauchsberechnung
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kostensätze</CardTitle>
          <CardDescription>
            Geben Sie die aktuellen Preise pro Einheit für Ihre Zähler ein.
            Diese Werte werden für die Kostenberechnung in den Statistiken verwendet.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Strom */}
          <div className="space-y-2">
            <Label htmlFor="strom" className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-500" />
              Strompreis (€/kWh)
            </Label>
            <div className="flex gap-2">
              <Input
                id="strom"
                type="number"
                step="0.001"
                value={costSettings.strom}
                onChange={(e) => handleCostChange('strom', e.target.value)}
                placeholder="0.35"
              />
              <div className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md min-w-[100px]">
                {formatCurrency(costSettings.strom)}/kWh
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnittlicher Strompreis in Deutschland: ~0,35 €/kWh
            </p>
          </div>

          {/* Gas */}
          <div className="space-y-2">
            <Label htmlFor="gas" className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Gaspreis (€/kWh)
            </Label>
            <div className="flex gap-2">
              <Input
                id="gas"
                type="number"
                step="0.001"
                value={costSettings.gas}
                onChange={(e) => handleCostChange('gas', e.target.value)}
                placeholder="0.12"
              />
              <div className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md min-w-[100px]">
                {formatCurrency(costSettings.gas)}/kWh
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnittlicher Gaspreis in Deutschland: ~0,12 €/kWh
            </p>
          </div>

          {/* Wasser */}
          <div className="space-y-2">
            <Label htmlFor="wasser" className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              Wasserpreis (€/m³)
            </Label>
            <div className="flex gap-2">
              <Input
                id="wasser"
                type="number"
                step="0.01"
                value={costSettings.wasser}
                onChange={(e) => handleCostChange('wasser', e.target.value)}
                placeholder="4.50"
              />
              <div className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md min-w-[100px]">
                {formatCurrency(costSettings.wasser)}/m³
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Durchschnittlicher Wasserpreis in Deutschland: ~4,50 €/m³
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Speichern
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Beispielrechnung</CardTitle>
          <CardDescription>
            So werden Ihre Kosten mit den aktuellen Sätzen berechnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-yellow-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Strom</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">100 kWh Verbrauch</p>
              <p className="text-lg font-semibold">{formatCurrency(100 * costSettings.strom)}</p>
            </div>

            <div className="p-4 bg-orange-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="font-medium">Gas</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">500 kWh Verbrauch</p>
              <p className="text-lg font-semibold">{formatCurrency(500 * costSettings.gas)}</p>
            </div>

            <div className="p-4 bg-blue-500/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Wasser</span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">10 m³ Verbrauch</p>
              <p className="text-lg font-semibold">{formatCurrency(10 * costSettings.wasser)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datenexport & Import</CardTitle>
          <CardDescription>
            Sichern Sie Ihre Daten oder importieren Sie bestehende Datensätze
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                const meters = localStorage.getItem('meter_app_meters');
                const readings = localStorage.getItem('meter_app_readings');
                const data = {
                  meters: meters ? JSON.parse(meters) : [],
                  readings: readings ? JSON.parse(readings) : [],
                  costSettings: costSettings,
                  exportDate: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `meter-app-backup-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                
                toast({
                  title: "Export erfolgreich",
                  description: "Ihre Daten wurden erfolgreich exportiert.",
                });
              }}
              className="flex-1"
            >
              Daten exportieren
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (!file) return;
                  
                  try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    
                    if (!data || typeof data !== 'object') {
                      throw new Error('Invalid file format: JSON object expected');
                    }
                    
                    if (data.meters) {
                      localStorage.setItem('meter_app_meters', JSON.stringify(data.meters));
                    }
                    if (data.readings) {
                      localStorage.setItem('meter_app_readings', JSON.stringify(data.readings));
                    }
                    if (data.costSettings) {
                      setCostSettings(data.costSettings);
                      localStorage.setItem(COST_SETTINGS_KEY, JSON.stringify(data.costSettings));
                    }
                    
                    toast({
                      title: "Import erfolgreich",
                      description: "Ihre Daten wurden erfolgreich importiert. Bitte laden Sie die Seite neu.",
                    });
                    
                    setTimeout(() => window.location.reload(), 2000);
                  } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
                    toast({
                      title: "Import fehlgeschlagen",
                      description: `Die Datei konnte nicht importiert werden: ${errorMessage}`,
                      variant: "destructive"
                    });
                  }
                };
                input.click();
              }}
              className="flex-1"
            >
              Daten importieren
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Exportieren Sie regelmäßig Ihre Daten als Backup. Die Datei enthält alle Zähler, Ablesungen und Einstellungen.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;

// Export utility function to get cost settings
export const getCostSettings = (): CostSettings => {
  const stored = localStorage.getItem(COST_SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Fehler beim Laden der Kostensätze:', error);
    }
  }
  return DEFAULT_COSTS;
};