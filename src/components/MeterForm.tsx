
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Meter } from '@/types/meter';
import { Zap, Droplets, Flame } from 'lucide-react';

interface MeterFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (meter: Omit<Meter, 'id' | 'createdAt'>) => void;
  meter?: Meter;
}

const MeterForm = ({ open, onClose, onSave, meter }: MeterFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'strom' as const,
    serialNumber: '',
    unit: 'kWh'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (meter) {
      setFormData({
        name: meter.name,
        type: meter.type,
        serialNumber: meter.serialNumber,
        unit: meter.unit
      });
    } else {
      setFormData({ name: '', type: 'strom', serialNumber: '', unit: 'kWh' });
    }
    setErrors({});
  }, [meter, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name ist erforderlich';
    }
    if (!formData.serialNumber.trim()) {
      newErrors.serialNumber = 'Seriennummer ist erforderlich';
    }
    if (!formData.unit.trim()) {
      newErrors.unit = 'Einheit ist erforderlich';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    onSave(formData);
    onClose();
    setFormData({ name: '', type: 'strom', serialNumber: '', unit: 'kWh' });
    setErrors({});
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strom':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'wasser':
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case 'gas':
        return <Flame className="h-4 w-4 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(formData.type)}
            {meter ? 'Zähler bearbeiten' : 'Neuen Zähler hinzufügen'}
          </DialogTitle>
          <DialogDescription>
            {meter 
              ? 'Ändern Sie die Zählerdaten nach Bedarf.'
              : 'Fügen Sie einen neuen Zähler für Gas, Strom oder Wasser hinzu.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="z.B. Hauptzähler Erdgeschoss"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Zählertyp *</Label>
            <Select
              value={formData.type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg">
                <SelectItem value="strom" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Strom
                  </div>
                </SelectItem>
                <SelectItem value="gas" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Gas
                  </div>
                </SelectItem>
                <SelectItem value="wasser" className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    Wasser
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNumber">Seriennummer *</Label>
            <Input
              id="serialNumber"
              value={formData.serialNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, serialNumber: e.target.value }))}
              placeholder="Seriennummer des Zählers"
              className={errors.serialNumber ? 'border-destructive' : ''}
            />
            {errors.serialNumber && <p className="text-sm text-destructive">{errors.serialNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Einheit *</Label>
            <Input
              id="unit"
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              placeholder="z.B. kWh, m³"
              className={errors.unit ? 'border-destructive' : ''}
            />
            {errors.unit && <p className="text-sm text-destructive">{errors.unit}</p>}
          </div>

          <div className="flex gap-3 pt-4">
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
