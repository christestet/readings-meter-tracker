
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import MeterCard from '@/components/MeterCard';
import MeterForm from '@/components/MeterForm';
import ReadingForm from '@/components/ReadingForm';
import ReadingsView from '@/components/ReadingsView';
import { Plus, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showReadingsView, setShowReadingsView] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | undefined>();
  const [editingReading, setEditingReading] = useState<MeterReading | undefined>();
  const [selectedMeter, setSelectedMeter] = useState<Meter | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    setMeters(storageUtils.getMeters());
  }, []);

  const handleSaveMeter = (meterData: Omit<Meter, 'id' | 'createdAt'>) => {
    if (editingMeter) {
      // Update existing meter
      const updatedMeters = meters.map(meter =>
        meter.id === editingMeter.id
          ? { ...meter, ...meterData }
          : meter
      );
      setMeters(updatedMeters);
      storageUtils.saveMeters(updatedMeters);
      toast({
        title: "Zähler aktualisiert",
        description: `${meterData.name} wurde erfolgreich aktualisiert.`,
      });
    } else {
      // Add new meter
      const newMeter: Meter = {
        id: crypto.randomUUID(),
        ...meterData,
        createdAt: new Date().toISOString()
      };
      const updatedMeters = [...meters, newMeter];
      setMeters(updatedMeters);
      storageUtils.saveMeters(updatedMeters);
      toast({
        title: "Zähler hinzugefügt",
        description: `${meterData.name} wurde erfolgreich hinzugefügt.`,
      });
    }
    setEditingMeter(undefined);
  };

  const handleDeleteMeter = (meterId: string) => {
    const meter = meters.find(m => m.id === meterId);
    if (!meter) return;

    const updatedMeters = meters.filter(m => m.id !== meterId);
    setMeters(updatedMeters);
    storageUtils.saveMeters(updatedMeters);

    // Also delete all readings for this meter
    const allReadings = storageUtils.getReadings();
    const filteredReadings = allReadings.filter(r => r.meterId !== meterId);
    storageUtils.saveReadings(filteredReadings);

    toast({
      title: "Zähler gelöscht",
      description: `${meter.name} und alle zugehörigen Ablesungen wurden gelöscht.`,
    });
  };

  const handleSaveReading = (readingData: Omit<MeterReading, 'id' | 'createdAt'>) => {
    const allReadings = storageUtils.getReadings();
    
    if (editingReading) {
      // Update existing reading
      const updatedReadings = allReadings.map(reading =>
        reading.id === editingReading.id
          ? { ...reading, ...readingData }
          : reading
      );
      storageUtils.saveReadings(updatedReadings);
      toast({
        title: "Ablesung aktualisiert",
        description: "Die Ablesung wurde erfolgreich aktualisiert.",
      });
    } else {
      // Add new reading
      const newReading: MeterReading = {
        id: crypto.randomUUID(),
        ...readingData,
        createdAt: new Date().toISOString()
      };
      storageUtils.saveReadings([...allReadings, newReading]);
      toast({
        title: "Ablesung gespeichert",
        description: "Die neue Ablesung wurde erfolgreich gespeichert.",
      });
    }
    setEditingReading(undefined);
    setSelectedMeter(undefined);
  };

  const handleDeleteReading = (readingId: string) => {
    const allReadings = storageUtils.getReadings();
    const filteredReadings = allReadings.filter(r => r.id !== readingId);
    storageUtils.saveReadings(filteredReadings);
    toast({
      title: "Ablesung gelöscht",
      description: "Die Ablesung wurde erfolgreich gelöscht.",
    });
  };

  const handleEditMeter = (meter: Meter) => {
    setEditingMeter(meter);
    setShowMeterForm(true);
  };

  const handleAddReading = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowReadingForm(true);
  };

  const handleViewReadings = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowReadingsView(true);
  };

  const handleEditReading = (reading: MeterReading) => {
    setEditingReading(reading);
    setSelectedMeter(meters.find(m => m.id === reading.meterId));
    setShowReadingForm(true);
    setShowReadingsView(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-800">Zählerstand App</h1>
          </div>
          <p className="text-slate-600">Verwalten Sie Ihre Gas-, Strom- und Wasserzähler</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{meters.length}</div>
                <div className="text-sm text-muted-foreground">Zähler</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {storageUtils.getReadings().length}
                </div>
                <div className="text-sm text-muted-foreground">Ablesungen</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {meters.filter(m => storageUtils.getLatestReading(m.id)).length}
                </div>
                <div className="text-sm text-muted-foreground">Aktive Zähler</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Meter Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowMeterForm(true)}
            className="w-full md:w-auto"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Neuen Zähler hinzufügen
          </Button>
        </div>

        {/* Meters Grid */}
        {meters.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Activity className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Noch keine Zähler</h3>
              <p className="text-muted-foreground mb-6">
                Fügen Sie Ihren ersten Zähler hinzu, um mit der Erfassung zu beginnen.
              </p>
              <Button onClick={() => setShowMeterForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Ersten Zähler hinzufügen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meters.map(meter => (
              <MeterCard
                key={meter.id}
                meter={meter}
                onEdit={handleEditMeter}
                onDelete={handleDeleteMeter}
                onAddReading={handleAddReading}
                onViewReadings={handleViewReadings}
              />
            ))}
          </div>
        )}

        {/* Forms and Dialogs */}
        <MeterForm
          open={showMeterForm}
          onClose={() => {
            setShowMeterForm(false);
            setEditingMeter(undefined);
          }}
          onSave={handleSaveMeter}
          meter={editingMeter}
        />

        {selectedMeter && (
          <ReadingForm
            open={showReadingForm}
            onClose={() => {
              setShowReadingForm(false);
              setSelectedMeter(undefined);
              setEditingReading(undefined);
            }}
            onSave={handleSaveReading}
            meter={selectedMeter}
            reading={editingReading}
          />
        )}

        {selectedMeter && (
          <ReadingsView
            open={showReadingsView}
            onClose={() => {
              setShowReadingsView(false);
              setSelectedMeter(undefined);
            }}
            meter={selectedMeter}
            onEditReading={handleEditReading}
            onDeleteReading={handleDeleteReading}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
