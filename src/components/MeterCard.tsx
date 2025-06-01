
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import { Zap, Droplets, Flame, Edit, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface MeterCardProps {
  meter: Meter;
  onEdit: (meter: Meter) => void;
  onDelete: (meterId: string) => void;
  onAddReading: (meter: Meter) => void;
  onViewReadings: (meter: Meter) => void;
}

const MeterCard = ({ meter, onEdit, onDelete, onAddReading, onViewReadings }: MeterCardProps) => {
  const latestReading = storageUtils.getLatestReading(meter.id);
  
  const getIcon = () => {
    switch (meter.type) {
      case 'strom':
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case 'wasser':
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case 'gas':
        return <Flame className="h-5 w-5 text-orange-500" />;
    }
  };

  const getTypeColor = () => {
    switch (meter.type) {
      case 'strom':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'wasser':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      case 'gas':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIcon()}
            <CardTitle className="text-lg">{meter.name}</CardTitle>
          </div>
          <Badge className={getTypeColor()}>
            {meter.type.charAt(0).toUpperCase() + meter.type.slice(1)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Seriennummer: {meter.serialNumber}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {latestReading ? (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Letzter Stand</span>
              <span className="text-lg font-semibold">
                {latestReading.value} {meter.unit}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(latestReading.date), 'dd. MMM yyyy', { locale: de })}
            </p>
          </div>
        ) : (
          <div className="p-3 bg-muted/30 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Noch keine Ablesung</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => onAddReading(meter)}
            className="flex-1"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Ablesung
          </Button>
          <Button
            onClick={() => onViewReadings(meter)}
            variant="outline"
            size="sm"
          >
            Verlauf
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => onEdit(meter)}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Edit className="h-4 w-4 mr-1" />
            Bearbeiten
          </Button>
          <Button
            onClick={() => onDelete(meter.id)}
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeterCard;
