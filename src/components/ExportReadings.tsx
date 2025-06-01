
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Meter, MeterReading } from '@/types/meter';
import { storageUtils } from '@/utils/storage';
import { Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ExportReadingsProps {
  open: boolean;
  onClose: () => void;
  meter: Meter;
}

const ExportReadings = ({ open, onClose, meter }: ExportReadingsProps) => {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { toast } = useToast();

  const getFilteredReadings = () => {
    const allReadings = storageUtils.getReadingsForMeter(meter.id);
    return allReadings.filter(reading => {
      const readingDate = new Date(reading.date);
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return readingDate >= start && readingDate <= end;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const exportToCSV = () => {
    const readings = getFilteredReadings();
    if (readings.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Keine Ablesungen im ausgewählten Zeitraum gefunden.",
        variant: "destructive"
      });
      return;
    }

    const headers = ['Datum', 'Zählerstand', 'Einheit', 'Verbrauch', 'Notizen'];
    const csvData = readings.map((reading, index) => {
      const previousReading = index > 0 ? readings[index - 1] : null;
      const consumption = previousReading ? reading.value - previousReading.value : 0;
      
      return [
        format(new Date(reading.date), 'dd.MM.yyyy', { locale: de }),
        reading.value.toString(),
        meter.unit,
        consumption.toFixed(2),
        reading.notes || ''
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${meter.name}_Ablesungen_${dateRange.startDate}_${dateRange.endDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "CSV exportiert",
      description: `${readings.length} Ablesungen wurden erfolgreich exportiert.`
    });
  };

  const exportToPDF = () => {
    const readings = getFilteredReadings();
    if (readings.length === 0) {
      toast({
        title: "Keine Daten",
        description: "Keine Ablesungen im ausgewählten Zeitraum gefunden.",
        variant: "destructive"
      });
      return;
    }

    // Create a simple HTML table for PDF generation
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Zählerablesungen - ${meter.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; margin-bottom: 10px; }
          .info { margin-bottom: 20px; color: #666; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .summary { margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Zählerablesungen: ${meter.name}</h1>
        <div class="info">
          <p><strong>Zählertyp:</strong> ${meter.type.charAt(0).toUpperCase() + meter.type.slice(1)}</p>
          <p><strong>Seriennummer:</strong> ${meter.serialNumber}</p>
          <p><strong>Zeitraum:</strong> ${format(new Date(dateRange.startDate), 'dd.MM.yyyy', { locale: de })} - ${format(new Date(dateRange.endDate), 'dd.MM.yyyy', { locale: de })}</p>
          <p><strong>Anzahl Ablesungen:</strong> ${readings.length}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Zählerstand</th>
              <th>Verbrauch</th>
              <th>Notizen</th>
            </tr>
          </thead>
          <tbody>
            ${readings.map((reading, index) => {
              const previousReading = index > 0 ? readings[index - 1] : null;
              const consumption = previousReading ? reading.value - previousReading.value : 0;
              
              return `
                <tr>
                  <td>${format(new Date(reading.date), 'dd.MM.yyyy', { locale: de })}</td>
                  <td>${reading.value.toLocaleString('de-DE')} ${meter.unit}</td>
                  <td>${consumption.toFixed(2)} ${meter.unit}</td>
                  <td>${reading.notes || '-'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        <div class="summary">
          <h3>Zusammenfassung</h3>
          <p><strong>Gesamtverbrauch:</strong> ${readings.length > 0 ? (readings[readings.length - 1].value - readings[0].value).toFixed(2) : 0} ${meter.unit}</p>
          <p><strong>Durchschnittsverbrauch pro Ablesung:</strong> ${readings.length > 1 ? ((readings[readings.length - 1].value - readings[0].value) / (readings.length - 1)).toFixed(2) : 0} ${meter.unit}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);

      toast({
        title: "PDF wird erstellt",
        description: `${readings.length} Ablesungen werden zum Drucken vorbereitet.`
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ablesungen exportieren - {meter.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="startDate">Von Datum</Label>
            <Input
              id="startDate"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="endDate">Bis Datum</Label>
            <Input
              id="endDate"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              Gefundene Ablesungen: <span className="font-semibold">{getFilteredReadings().length}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Zeitraum: {format(new Date(dateRange.startDate), 'dd.MM.yyyy', { locale: de })} - {format(new Date(dateRange.endDate), 'dd.MM.yyyy', { locale: de })}
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={exportToCSV}
              className="flex-1"
              disabled={getFilteredReadings().length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Als CSV
            </Button>
            <Button
              onClick={exportToPDF}
              variant="outline"
              className="flex-1"
              disabled={getFilteredReadings().length === 0}
            >
              <FileText className="h-4 w-4 mr-2" />
              Als PDF
            </Button>
          </div>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Schließen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReadings;
