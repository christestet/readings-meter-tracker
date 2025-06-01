
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import { Edit, Trash2, Camera, Download } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import ExportReadings from './ExportReadings';

interface ReadingsViewProps {
  open: boolean;
  onClose: () => void;
  meter: Meter;
  onEditReading: (reading: MeterReading) => void;
  onDeleteReading: (readingId: string) => void;
}

const ReadingsView = ({ open, onClose, meter, onEditReading, onDeleteReading }: ReadingsViewProps) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const readings = storageUtils.getReadingsForMeter(meter.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Ablesungen für {meter.name}</DialogTitle>
              {readings.length > 0 && (
                <Button
                  onClick={() => setShowExport(true)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </DialogHeader>
          
          <div className="space-y-3">
            {readings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Noch keine Ablesungen vorhanden</p>
              </div>
            ) : (
              readings.map((reading, index) => {
                const previousReading = readings[index + 1];
                const consumption = previousReading ? reading.value - previousReading.value : null;
                
                return (
                  <Card key={reading.id}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg font-semibold">
                              {reading.value} {meter.unit}
                            </span>
                            {consumption !== null && (
                              <Badge variant="outline" className="text-xs">
                                {consumption > 0 ? '+' : ''}{consumption.toFixed(2)} {meter.unit}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {format(new Date(reading.date), 'dd. MMMM yyyy', { locale: de })}
                          </p>
                          
                          {reading.notes && (
                            <p className="text-sm bg-muted/50 p-2 rounded">
                              {reading.notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 ml-4">
                          {reading.photo && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPhoto(reading.photo!)}
                            >
                              <Camera className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditReading(reading)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeleteReading(reading.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Photo viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Zählerstand Foto</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Zählerstand"
              className="w-full h-auto max-h-[70vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Export dialog */}
      <ExportReadings
        open={showExport}
        onClose={() => setShowExport(false)}
        meter={meter}
      />
    </>
  );
};

export default ReadingsView;
