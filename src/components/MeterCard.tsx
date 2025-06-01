
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import { Zap, Droplets, Flame, Edit, Trash2, Plus, TrendingUp, Calendar } from 'lucide-react';
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
  const allReadings = storageUtils.getReadingsForMeter(meter.id);
  
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
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400';
      case 'wasser':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400';
      case 'gas':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400';
    }
  };

  const getGradient = () => {
    switch (meter.type) {
      case 'strom':
        return 'from-yellow-500/20 to-transparent';
      case 'wasser':
        return 'from-blue-500/20 to-transparent';
      case 'gas':
        return 'from-orange-500/20 to-transparent';
    }
  };

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30 overflow-hidden relative">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-50`} />
      
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-background/80 backdrop-blur-sm shadow-sm">
              {getIcon()}
            </div>
            <div>
              <CardTitle className="text-lg leading-tight">{meter.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Nr. {meter.serialNumber}
              </p>
            </div>
          </div>
          <Badge className={`${getTypeColor()} font-medium`}>
            {meter.type.charAt(0).toUpperCase() + meter.type.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 relative z-10">
        {latestReading ? (
          <div className="p-4 bg-background/60 backdrop-blur-sm rounded-xl border border-border/50">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Aktueller Stand
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-foreground">
                  {latestReading.value.toLocaleString('de-DE')}
                </div>
                <div className="text-sm text-muted-foreground">{meter.unit}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {format(new Date(latestReading.date), 'dd. MMM yyyy', { locale: de })}
              {allReadings.length > 1 && (
                <span className="ml-auto bg-muted px-2 py-1 rounded-full">
                  {allReadings.length} Ablesungen
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-muted/50 rounded-xl text-center border border-dashed border-border">
            <p className="text-sm text-muted-foreground mb-2">Noch keine Ablesung</p>
            <Button
              onClick={() => onAddReading(meter)}
              size="sm"
              className="h-8"
            >
              <Plus className="h-3 w-3 mr-1" />
              Erste Ablesung
            </Button>
          </div>
        )}

        {latestReading && (
          <div className="flex gap-2">
            <Button
              onClick={() => onAddReading(meter)}
              className="flex-1 h-9"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Neue Ablesung
            </Button>
            <Button
              onClick={() => onViewReadings(meter)}
              variant="outline"
              size="sm"
              className="h-9"
            >
              Verlauf
            </Button>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            onClick={() => onEdit(meter)}
            variant="ghost"
            size="sm"
            className="flex-1 h-8 text-muted-foreground hover:text-foreground"
          >
            <Edit className="h-3 w-3 mr-1" />
            Bearbeiten
          </Button>
          <Button
            onClick={() => onDelete(meter.id)}
            variant="ghost"
            size="sm"
            className="h-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeterCard;
