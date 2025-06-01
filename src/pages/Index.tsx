import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import MeterCard from '@/components/MeterCard';
import MeterForm from '@/components/MeterForm';
import ReadingForm from '@/components/ReadingForm';
import ReadingsView from '@/components/ReadingsView';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { Plus, Activity, Zap, Droplets, Flame, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

const Index = () => {
  const [meters, setMeters] = useState<Meter[]>([]);
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [showReadingForm, setShowReadingForm] = useState(false);
  const [showReadingsView, setShowReadingsView] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Meter | undefined>();
  const [editingReading, setEditingReading] = useState<MeterReading | undefined>();
  const [selectedMeter, setSelectedMeter] = useState<Meter | undefined>();
  const { toast } = useToast();

  // State für Bestätigungsdialog
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({ open: false, title: '', description: '', onConfirm: () => {} });

  // Fehlerstatus für ReadingForm
  const [readingFormError, setReadingFormError] = useState<string | undefined>();

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
    setConfirmDialog({
      open: true,
      title: 'Zähler löschen',
      description: `Möchten Sie den Zähler "${meter.name}" und alle zugehörigen Ablesungen wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`,
      onConfirm: () => {
        const updatedMeters = meters.filter(m => m.id !== meterId);
        setMeters(updatedMeters);
        storageUtils.saveMeters(updatedMeters);
        // Auch alle Ablesungen löschen
        const allReadings = storageUtils.getReadings();
        const filteredReadings = allReadings.filter(r => r.meterId !== meterId);
        storageUtils.saveReadings(filteredReadings);
        toast({
          title: 'Zähler gelöscht',
          description: `${meter.name} und alle zugehörigen Ablesungen wurden gelöscht.`,
        });
      },
    });
  };

  const handleSaveReading = (readingData: Omit<MeterReading, 'id' | 'createdAt'>) => {
    const allReadings = storageUtils.getReadings();

    // Hole alle Ablesungen für diesen Zähler
    const readingsForMeter = allReadings.filter(r => r.meterId === readingData.meterId);
    const newDate = new Date(readingData.date);
    const newValue = readingData.value;

    // Sortiere die Ablesungen nach Datum (ohne die aktuell bearbeitete Ablesung)
    const sortedReadings = readingsForMeter
      .filter(r => r.id !== editingReading?.id)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Prüfe auf Duplikate am gleichen Tag (außer beim Bearbeiten)
    const sameDate = sortedReadings.find(r => 
      new Date(r.date).toISOString().split('T')[0] === newDate.toISOString().split('T')[0]
    );

    // Finde die letzte vorherige Ablesung
    const previousReading = [...sortedReadings]
      .reverse()
      .find(r => new Date(r.date) <= newDate);

    // Finde die nächste Ablesung
    const nextReading = sortedReadings
      .find(r => new Date(r.date) > newDate);

    // Validierungen mit entsprechenden Fehlermeldungen
    if (sameDate) {
      setReadingFormError('Es existiert bereits eine Ablesung für dieses Datum. Bitte wählen Sie ein anderes Datum oder bearbeiten Sie die vorhandene Ablesung.');
      return;
    }

    if (previousReading && previousReading.value >= newValue) {
      setReadingFormError(
        `Der neue Zählerstand (${newValue} ${selectedMeter?.unit}) muss größer sein als der vorherige vom ${new Date(previousReading.date).toLocaleDateString('de-DE')} (${previousReading.value} ${selectedMeter?.unit}).`
      );
      return;
    }

    if (nextReading && nextReading.value <= newValue) {
      setReadingFormError(
        `Der neue Zählerstand (${newValue} ${selectedMeter?.unit}) muss kleiner sein als der nachfolgende vom ${new Date(nextReading.date).toLocaleDateString('de-DE')} (${nextReading.value} ${selectedMeter?.unit}).`
      );
      return;
    }

    // Wenn wir hier ankommen, gab es keine Validierungsfehler
    setReadingFormError(undefined);

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
    
    setShowReadingForm(false);
    setEditingReading(undefined);
    setSelectedMeter(undefined);
  };

  const handleDeleteReading = (readingId: string) => {
    const allReadings = storageUtils.getReadings();
    const reading = allReadings.find(r => r.id === readingId);
    if (!reading) return;
    setConfirmDialog({
      open: true,
      title: 'Ablesung löschen',
      description: 'Möchten Sie diese Ablesung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!',
      onConfirm: () => {
        const filteredReadings = allReadings.filter(r => r.id !== readingId);
        storageUtils.saveReadings(filteredReadings);
        toast({
          title: 'Ablesung gelöscht',
          description: 'Die Ablesung wurde erfolgreich gelöscht.',
        });
      },
    });
  };

  // Optional: Bestätigung für Bearbeiten (kann entfernt werden, falls nicht gewünscht)
  const handleEditMeter = (meter: Meter) => {
    setConfirmDialog({
      open: true,
      title: 'Zähler bearbeiten',
      description: `Möchten Sie den Zähler "${meter.name}" bearbeiten?`,
      onConfirm: () => {
        setEditingMeter(meter);
        setShowMeterForm(true);
      },
    });
  };

  const handleEditReading = (reading: MeterReading) => {
    setConfirmDialog({
      open: true,
      title: 'Ablesung bearbeiten',
      description: 'Möchten Sie diese Ablesung bearbeiten?',
      onConfirm: () => {
        setEditingReading(reading);
        setSelectedMeter(meters.find(m => m.id === reading.meterId));
        setShowReadingForm(true);
        setShowReadingsView(false);
      },
    });
  };

  const getMetersCountByType = () => {
    return {
      strom: meters.filter(m => m.type === 'strom').length,
      gas: meters.filter(m => m.type === 'gas').length,
      wasser: meters.filter(m => m.type === 'wasser').length,
    };
  };

  const metersByType = getMetersCountByType();

  // Funktion zum Hinzufügen einer Ablesung für einen bestimmten Zähler
  const handleAddReading = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowReadingForm(true);
  };

  // Funktion zum Anzeigen der Ablesungen eines bestimmten Zählers
  const handleViewReadings = (meter: Meter) => {
    setSelectedMeter(meter);
    setShowReadingsView(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                <Activity className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Zählerstand App</h1>
                <p className="text-muted-foreground">Verwalten Sie Ihre Zählerstände einfach und übersichtlich</p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {/* Enhanced Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{meters.length}</div>
                  <div className="text-sm text-muted-foreground">Zähler</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 bg-gradient-to-br from-yellow-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Zap className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metersByType.strom}</div>
                  <div className="text-sm text-muted-foreground">Strom</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-orange-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Flame className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metersByType.gas}</div>
                  <div className="text-sm text-muted-foreground">Gas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-blue-500/10 to-transparent">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Droplets className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-foreground">{metersByType.wasser}</div>
                  <div className="text-sm text-muted-foreground">Wasser</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Meter Button */}
        {meters.length > 0 && (
          <div className="mb-8">
            <Button
              onClick={() => setShowMeterForm(true)}
              className="w-full md:w-auto h-12 px-6"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Neuen Zähler hinzufügen
            </Button>
          </div>
        )}

        {/* Meters Grid */}
        {meters.length === 0 ? (
          <Card className="border-0 bg-gradient-to-br from-background to-muted/30">
            <CardContent className="text-center py-16">
              <div className="p-4 rounded-full bg-muted/50 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Activity className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Noch keine Zähler vorhanden</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Beginnen Sie mit der Erfassung Ihrer Zählerstände, indem Sie Ihren ersten Zähler hinzufügen.
              </p>
              <Button onClick={() => setShowMeterForm(true)} size="lg" className="h-12 px-8">
                <Plus className="h-5 w-5 mr-2" />
                Ersten Zähler hinzufügen
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
              setReadingFormError(undefined);
            }}
            onSave={handleSaveReading}
            meter={selectedMeter}
            reading={editingReading}
            error={readingFormError} // Fehlerstatus hier übergeben
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

        {/* Bestätigungsdialog */}
        <AlertDialog open={confirmDialog.open} onOpenChange={open => setConfirmDialog(v => ({ ...v, open }))}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
              <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(v => ({ ...v, open: false }));
                }}
              >
                Bestätigen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Index;
