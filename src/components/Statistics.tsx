import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Meter } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { TrendingUp, Calendar, Euro, Zap, Droplets, Flame, FileText, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getCostSettings, CostSettings as CostSettingsType } from '@/components/Settings';

interface StatisticsProps {
  meters: Meter[];
}

interface ConsumptionData {
  date: string;
  value: number;
  consumption: number;
  cost?: number;
}

const Statistics = ({ meters }: StatisticsProps) => {
  const [selectedMeter, setSelectedMeter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '6months' | '1year'>('30days');
  const [showCosts, setShowCosts] = useState(false);
  const { toast } = useToast();

  // Kostensätze aus den Einstellungen laden
  const costSettings = getCostSettings();

  const getFilteredReadings = useMemo(() => {
    const allReadings = storageUtils.getReadings();
    
    // Zeitfilter anwenden
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '7days':
        startDate = subDays(now, 7);
        break;
      case '30days':
        startDate = subDays(now, 30);
        break;
      case '6months':
        startDate = subMonths(now, 6);
        break;
      case '1year':
        startDate = subMonths(now, 12);
        break;
    }

    return allReadings.filter(reading => {
      const readingDate = new Date(reading.date);
      const meterMatch = selectedMeter === 'all' || reading.meterId === selectedMeter;
      const dateMatch = readingDate >= startDate && readingDate <= now;
      return meterMatch && dateMatch;
    });
  }, [selectedMeter, timeRange]);

  const getConsumptionData = (meterId: string): ConsumptionData[] => {
    const readings = getFilteredReadings
      .filter(r => r.meterId === meterId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (readings.length < 2) return [];

    const meter = meters.find(m => m.id === meterId);
    const costRate = meter ? costSettings[meter.type] : 0;

    return readings.map((reading, index) => {
      const consumption = index > 0 ? reading.value - readings[index - 1].value : 0;
      const cost = consumption * costRate;
      
      return {
        date: format(new Date(reading.date), 'dd.MM.yy'),
        value: reading.value,
        consumption: Number(consumption.toFixed(2)),
        cost: Number(cost.toFixed(2))
      };
    }).filter((_, index) => index > 0); // Ersten Eintrag entfernen (hat keinen Verbrauch)
  };

  const getAggregatedData = () => {
    if (selectedMeter === 'all') {
      // Aggregierte Daten für alle Zähler
      const dataByType: Record<string, ConsumptionData[]> = {
        strom: [],
        gas: [],
        wasser: []
      };

      meters.forEach(meter => {
        const data = getConsumptionData(meter.id);
        if (data.length > 0) {
          dataByType[meter.type].push(...data);
        }
      });

      return dataByType;
    } else {
      const data = getConsumptionData(selectedMeter);
      return { single: data };
    }
  };

  const getMonthlyConsumption = (meterId: string) => {
    const readings = storageUtils.getReadingsForMeter(meterId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (readings.length < 2) return [];

    const meter = meters.find(m => m.id === meterId);
    const costRate = meter ? costSettings[meter.type] : 0;

    // Gruppiere nach Monaten
    const monthlyData = new Map<string, { consumption: number, cost: number, readings: number }>();
    
    for (let i = 1; i < readings.length; i++) {
      const monthKey = format(new Date(readings[i].date), 'yyyy-MM');
      const consumption = readings[i].value - readings[i - 1].value;
      const cost = consumption * costRate;
      
      const existing = monthlyData.get(monthKey) || { consumption: 0, cost: 0, readings: 0 };
      monthlyData.set(monthKey, {
        consumption: existing.consumption + consumption,
        cost: existing.cost + cost,
        readings: existing.readings + 1
      });
    }

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month: format(new Date(month + '-01'), 'MMM yy', { locale: de }),
        consumption: Number(data.consumption.toFixed(2)),
        cost: Number(data.cost.toFixed(2)),
        readings: data.readings
      }))
      .slice(-12); // Letzte 12 Monate
  };

  const getStatsSummary = () => {
    const filteredMeters = selectedMeter === 'all' 
      ? meters 
      : meters.filter(m => m.id === selectedMeter);

    let totalConsumption = 0;
    let totalCost = 0;
    let totalReadings = 0;

    filteredMeters.forEach(meter => {
      const data = getConsumptionData(meter.id);
      totalConsumption += data.reduce((sum, d) => sum + d.consumption, 0);
      totalCost += data.reduce((sum, d) => sum + (d.cost || 0), 0);
      totalReadings += data.length;
    });

    // Durchschnittlicher Verbrauch pro Tag
    const days = timeRange === '7days' ? 7 : 
                 timeRange === '30days' ? 30 :
                 timeRange === '6months' ? 180 : 365;
    
    const avgDailyConsumption = totalConsumption / days;
    const avgDailyCost = totalCost / days;

    return {
      totalConsumption: totalConsumption.toFixed(2),
      totalCost: totalCost.toFixed(2),
      avgDailyConsumption: avgDailyConsumption.toFixed(2),
      avgDailyCost: avgDailyCost.toFixed(2),
      totalReadings
    };
  };

  const getPieChartData = () => {
    const dataByType = {
      strom: 0,
      gas: 0,
      wasser: 0
    };

    meters.forEach(meter => {
      const data = getConsumptionData(meter.id);
      const totalCost = data.reduce((sum, d) => sum + (d.cost || 0), 0);
      dataByType[meter.type] += totalCost;
    });

    const colors = {
      strom: '#eab308',
      gas: '#f97316',
      wasser: '#3b82f6'
    };

    return Object.entries(dataByType)
      .filter(([_, cost]) => cost > 0)
      .map(([type, cost]) => ({
        name: type.charAt(0).toUpperCase() + type.slice(1),
        value: Number(cost.toFixed(2)),
        color: colors[type as keyof typeof colors]
      }));
  };

  const stats = getStatsSummary();
  const aggregatedData = getAggregatedData();

  const getIcon = (type: string) => {
    switch (type) {
      case 'strom': return <Zap className="h-4 w-4" />;
      case 'gas': return <Flame className="h-4 w-4" />;
      case 'wasser': return <Droplets className="h-4 w-4" />;
      default: return null;
    }
  };

  const exportToCSV = () => {
    const data = selectedMeter === 'all' 
      ? meters.flatMap(meter => getConsumptionData(meter.id).map(d => ({
          Zähler: meter.name,
          Typ: meter.type,
          Datum: d.date,
          Stand: d.value,
          Verbrauch: d.consumption,
          Kosten: d.cost
        })))
      : getConsumptionData(selectedMeter).map(d => ({
          Datum: d.date,
          Stand: d.value,
          Verbrauch: d.consumption,
          Kosten: d.cost
        }));

    if (data.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Keine Daten zum Exportieren vorhanden.",
        variant: "destructive"
      });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Verbrauchsstatistik_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();

    toast({
      title: "Export erfolgreich",
      description: "Die Statistiken wurden als CSV exportiert."
    });
  };

  return (
    <div className="space-y-6">
      {/* Header mit Filtern */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <h2 className="text-2xl font-bold">Verbrauchsstatistiken</h2>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={selectedMeter} onValueChange={setSelectedMeter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Zähler wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Zähler</SelectItem>
              {meters.map(meter => (
                <SelectItem key={meter.id} value={meter.id}>
                  <div className="flex items-center gap-2">
                    {getIcon(meter.type)}
                    {meter.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value: '7days' | '30days' | '6months' | '1year') => setTimeRange(value)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Tage</SelectItem>
              <SelectItem value="30days">30 Tage</SelectItem>
              <SelectItem value="6months">6 Monate</SelectItem>
              <SelectItem value="1year">1 Jahr</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCosts(!showCosts)}
          >
            <Euro className="h-4 w-4 mr-2" />
            {showCosts ? 'Kosten aus' : 'Kosten an'}
          </Button>

          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <FileText className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Zusammenfassungs-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamtverbrauch</p>
                <p className="text-2xl font-bold">{stats.totalConsumption}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedMeter !== 'all' && meters.find(m => m.id === selectedMeter)?.unit}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        {showCosts && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Gesamtkosten</p>
                  <p className="text-2xl font-bold">{stats.totalCost} €</p>
                  <p className="text-xs text-muted-foreground">im Zeitraum</p>
                </div>
                <Euro className="h-8 w-8 text-muted-foreground opacity-20" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ø Verbrauch/Tag</p>
                <p className="text-2xl font-bold">{stats.avgDailyConsumption}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedMeter !== 'all' && meters.find(m => m.id === selectedMeter)?.unit}
                </p>
              </div>
              <Calculator className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ablesungen</p>
                <p className="text-2xl font-bold">{stats.totalReadings}</p>
                <p className="text-xs text-muted-foreground">im Zeitraum</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hauptdiagramme */}
      <Tabs defaultValue="consumption" className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">Verbrauch</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          {showCosts && <TabsTrigger value="costs">Kosten</TabsTrigger>}
          <TabsTrigger value="monthly">Monatsübersicht</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verbrauchsverlauf</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMeter === 'all' ? (
                <div className="space-y-6">
                  {Object.entries(aggregatedData as Record<string, ConsumptionData[]>).map(([type, data]) => 
                    data.length > 0 && (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-4">
                          {getIcon(type)}
                          <h3 className="font-semibold capitalize">{type}</h3>
                          <Badge variant="outline">{data.length} Messungen</Badge>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                          <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Area 
                              type="monotone" 
                              dataKey="consumption" 
                              stroke={type === 'strom' ? '#eab308' : type === 'gas' ? '#f97316' : '#3b82f6'}
                              fill={type === 'strom' ? '#eab308' : type === 'gas' ? '#f97316' : '#3b82f6'}
                              fillOpacity={0.6}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={aggregatedData.single || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="consumption" 
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zählerstand-Entwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMeter !== 'all' ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={aggregatedData.single || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Bitte wählen Sie einen einzelnen Zähler für die Trendansicht
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showCosts && (
          <TabsContent value="costs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kostenverteilung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}€`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Kostensätze</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>Strom</span>
                        </div>
                        <span className="font-mono">{costSettings.strom} €/kWh</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Flame className="h-4 w-4 text-orange-500" />
                          <span>Gas</span>
                        </div>
                        <span className="font-mono">{costSettings.gas} €/kWh</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                        <div className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          <span>Wasser</span>
                        </div>
                        <span className="font-mono">{costSettings.wasser} €/m³</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monatsverbrauch (letzte 12 Monate)</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMeter !== 'all' ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={getMonthlyConsumption(selectedMeter)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    {showCosts && <YAxis yAxisId="right" orientation="right" />}
                    <Tooltip />
                    <Legend />
                    <Bar 
                      yAxisId="left"
                      dataKey="consumption" 
                      fill="#8884d8"
                      name="Verbrauch"
                    />
                    {showCosts && (
                      <Bar 
                        yAxisId="right"
                        dataKey="cost" 
                        fill="#82ca9d"
                        name="Kosten (€)"
                      />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Bitte wählen Sie einen einzelnen Zähler für die Monatsübersicht
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Statistics;