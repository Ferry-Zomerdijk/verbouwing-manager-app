import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { parseExcelFile, generateExcelTemplate, type ParseResult } from "@/lib/excelImport";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImportTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const ImportTasksDialog = ({ open, onOpenChange, projectId }: ImportTasksDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [skipErrors, setSkipErrors] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.oasis.opendocument.spreadsheet'
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Ongeldig bestandstype",
        description: "Alleen .xlsx en .xls bestanden zijn toegestaan",
        variant: "destructive"
      });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      toast({
        title: "Bestand te groot",
        description: "Bestand mag maximaal 5MB zijn",
        variant: "destructive"
      });
      return;
    }

    setFile(selectedFile);
    parseFile(selectedFile);
  }, [toast]);

  const parseFile = async (fileToRarse: File) => {
    setIsParsing(true);
    setParseResult(null);
    
    try {
      const result = await parseExcelFile(fileToRarse, projectId);
      setParseResult(result);
      
      if (result.errors.length > 0) {
        toast({
          title: "Validatie waarschuwingen",
          description: `${result.errors.length} rij(en) met fouten gevonden`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Parse fout",
        description: error instanceof Error ? error.message : "Kon bestand niet lezen",
        variant: "destructive"
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleImport = async () => {
    if (!parseResult || parseResult.validTasks.length === 0) {
      toast({
        title: "Geen taken om te importeren",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const tasksToImport = parseResult.validTasks;
      const batchSize = 50;
      const totalBatches = Math.ceil(tasksToImport.length / batchSize);
      
      let importedCount = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = tasksToImport.slice(i * batchSize, (i + 1) * batchSize);
        
        const { error } = await supabase
          .from('tasks')
          .insert(batch);

        if (error) {
          throw error;
        }

        importedCount += batch.length;
        setProgress(Math.round((importedCount / tasksToImport.length) * 100));
      }

      await queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });

      toast({
        title: "Import succesvol!",
        description: `${importedCount} ${importedCount === 1 ? 'taak' : 'taken'} geïmporteerd`,
      });

      setFile(null);
      setParseResult(null);
      setProgress(0);
      onOpenChange(false);

    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import fout",
        description: error instanceof Error ? error.message : "Kon taken niet importeren",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate();
    toast({
      title: "Template gedownload",
      description: "Het Excel template is gedownload"
    });
  };

  const resetDialog = () => {
    setFile(null);
    setParseResult(null);
    setProgress(0);
    setIsDragging(false);
  };

  const content = (
    <div className="space-y-4">
      {/* Download Template */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm">Geen Excel bestand? Download het template</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Upload Zone */}
      {!file && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
        >
          <Upload className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Sleep een Excel bestand hierheen of
          </p>
          <Button
            variant="outline"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.xlsx,.xls';
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement;
                if (target.files?.[0]) {
                  handleFileSelect(target.files[0]);
                }
              };
              input.click();
            }}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Selecteer Bestand
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Alleen .xlsx en .xls bestanden (max 5MB)
          </p>
        </div>
      )}

      {/* Parsing Indicator */}
      {isParsing && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Excel bestand wordt verwerkt...</AlertDescription>
        </Alert>
      )}

      {/* Parse Results */}
      {parseResult && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                <span className="text-xs sm:text-sm font-medium">Geldig</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600">{parseResult.validTasks.length}</p>
            </div>
            
            <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-600" />
                <span className="text-xs sm:text-sm font-medium">Waarsch.</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{parseResult.warnings.length}</p>
            </div>
            
            <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                <span className="text-xs sm:text-sm font-medium">Fouten</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{parseResult.errors.length}</p>
            </div>
          </div>

          {/* Preview Table */}
          {parseResult.validTasks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Preview (eerste 5 rijen)</h4>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Activiteit</TableHead>
                      <TableHead className="min-w-[100px]">Deel</TableHead>
                      <TableHead className="min-w-[80px]">Wie</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parseResult.validTasks.slice(0, 5).map((task, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{task.titel}</TableCell>
                        <TableCell>{task.deel_van_huis || '-'}</TableCell>
                        <TableCell>{task.verantwoordelijke || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{task.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Errors & Warnings */}
          {(parseResult.errors.length > 0 || parseResult.warnings.length > 0) && (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {parseResult.errors.map((error, idx) => (
                <Alert key={`error-${idx}`} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Rij {error.row}, {error.field}:</strong> {error.message}
                  </AlertDescription>
                </Alert>
              ))}
              {parseResult.warnings.map((warning, idx) => (
                <Alert key={`warning-${idx}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Rij {warning.row}, {warning.field}:</strong> {warning.message}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Import Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-errors"
              checked={skipErrors}
              onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
            />
            <Label htmlFor="skip-errors" className="text-sm">
              Alleen geldige rijen importeren (fouten overslaan)
            </Label>
          </div>

          {/* Progress Bar */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                {progress}% geïmporteerd
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const footerButtons = (
    <>
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting} className={isMobile ? "flex-1" : ""}>
        Annuleren
      </Button>
      {file && (
        <Button
          variant="outline"
          onClick={() => {
            setFile(null);
            setParseResult(null);
          }}
          disabled={isImporting}
          className={isMobile ? "flex-1" : ""}
        >
          Ander Bestand
        </Button>
      )}
      <Button
        onClick={handleImport}
        disabled={!parseResult || parseResult.validTasks.length === 0 || isImporting}
        className={isMobile ? "flex-1" : ""}
      >
        {isImporting ? 'Importeren...' : `${parseResult?.validTasks.length || 0} Importeren`}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(newOpen) => {
        if (!newOpen) resetDialog();
        onOpenChange(newOpen);
      }}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Taken Importeren</DrawerTitle>
            <DrawerDescription>
              Upload een Excel bestand om taken toe te voegen
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-y-auto flex-1">
            {content}
          </div>
          <div className="sticky bottom-0 p-4 bg-background border-t flex gap-2">
            {footerButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetDialog();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Taken Importeren uit Excel</DialogTitle>
          <DialogDescription>
            Upload een Excel bestand om meerdere taken tegelijk toe te voegen
          </DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportTasksDialog;
