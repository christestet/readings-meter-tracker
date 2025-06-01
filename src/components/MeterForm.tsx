
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Meter } from '@/types/meter';

interface MeterFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (meter: Omit<Meter, 'id' | 'createdAt'>) => void;
  meter?: Meter;
}

const MeterForm = ({ open, onClose, onSave, meter }: MeterFormProps) => {
  const [formData, setFormData] = useState({
    name: meter?.name || '',
    type: meter?.type || 'strom' as const,
    serialNumber: meter?.serialNumber || '',
    unit: meter?.unit || 'kWh'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({ name: '', type: 'strom', serialNumber: '', unit: 'kWh' });
  };

  const handleTypeChange = (type: 'gas' | 'strom' | 'wasser') => {
    let defaultUnit = 'kWh';
    switch (type) {
      case 'gas':
        defaultUnit = 'm³';
        break;
      case 'wasser':
        defaultUnit = 'm³';
        break;
      case 'strom':
        defaultUnit = 'kWh';
        break;
    }
    
    setFormData(prev => ({ ...prev, type, unit: defaultUnit }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {meter ? 'Zähler bearbeiten' : 'Neuen Zähler hinzufügen'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Hauptzähler Erdgeschoss"
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Zählertyp</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strom">Strom</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
                <SelectItem value="wasser">Wasser</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="serialNumber">Seriennummer</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="Seriennummer des Zählers"
              required
            />
          </div>

          <div>
            <Label htmlFor="unit">Einheit</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              placeholder="z.B. kWh, m³"
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Abbrechen
            </Button>
            <Button type="submit" className="flex-1">
              {meter ? 'Aktualisieren' : 'Hinzufügen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MeterForm;
