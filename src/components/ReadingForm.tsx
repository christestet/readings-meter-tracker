import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Meter, MeterReading } from '@/types/meter';
import { Camera } from 'lucide-react';

interface ReadingFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (reading: Omit<MeterReading, 'id' | 'createdAt'>) => Promise<boolean>; // Geändert zu Promise<boolean>
  meter: Meter;
  reading?: MeterReading;
  error?: string;
}

const ReadingForm = ({ open, onClose, onSave, meter, reading, error }: ReadingFormProps) => {
  const [formData, setFormData] = useState({
    value: reading?.value?.toString() || '',
    date: reading?.date || new Date().toISOString().split('T')[0],
    notes: reading?.notes || '',
    photo: reading?.photo || ''
  });

  // Fehleranzeige für lokale Validierung
  const [localError, setLocalError] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prüfe, ob Wert eingegeben und gültig ist
    if (!formData.value || isNaN(Number(formData.value))) {
      setLocalError('Bitte einen gültigen Zählerstand eingeben.');
      return;
    }
    
    setLocalError(undefined);
    setIsSubmitting(true);
    
    try {
      const success = await onSave({
        meterId: meter.id,
        value: parseFloat(formData.value),
        date: formData.date,
        notes: formData.notes,
        photo: formData.photo
      });
      
      // Nur schließen und zurücksetzen, wenn erfolgreich gespeichert
      if (success) {
        onClose();
        if (!reading) {
          setFormData({ value: '', date: new Date().toISOString().split('T')[0], notes: '', photo: '' });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({ ...prev, photo: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {reading ? 'Ablesung bearbeiten' : `Neue Ablesung für ${meter.name}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || localError) && (
            <div className="text-sm text-destructive bg-destructive/10 rounded p-2 mb-2">
              {error || localError}
            </div>
          )}

          <div>
            <Label htmlFor="value">Zählerstand</Label>
            <div className="flex gap-2">
              <Input
                id="value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="0.00"
                required
                className="flex-1"
                disabled={isSubmitting}
              />
              <span className="flex items-center px-3 text-sm text-muted-foreground bg-muted rounded-md">
                {meter.unit}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="date">Datum</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="photo">Foto (optional)</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo')?.click()}
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {formData.photo ? 'Foto ändern' : 'Foto aufnehmen'}
                </Button>
              </div>
              {formData.photo && (
                <div className="mt-2">
                  <img
                    src={formData.photo}
                    alt="Zählerstand"
                    className="w-full h-32 object-cover rounded-md border"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notizen (optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Zusätzliche Bemerkungen..."
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Speichere...' : (reading ? 'Aktualisieren' : 'Speichern')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingForm;