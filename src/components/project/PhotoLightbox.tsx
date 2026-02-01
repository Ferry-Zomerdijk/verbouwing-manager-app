import { useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSwipeable } from "react-swipeable";

type PhotoPhase = "Voor" | "Tijdens" | "Na";

interface PhotoLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPhoto: any;
  photos: any[];
  getPhotoUrl: (path: string) => string;
  onPhotoChange: (photo: any) => void;
  readOnly?: boolean;
  updatingPhotoId: string | null;
  faseColors: Record<string, string>;
  handleUpdateFase: (photoId: string, newFase: PhotoPhase) => Promise<void>;
  getLocationColor: (location: string) => string;
  availableDelenVanHuis: string[];
  handleUpdateDeelVanHuis: (photoId: string, newDeelVanHuis: string) => Promise<void>;
}

export const PhotoLightbox = ({
  open,
  onOpenChange,
  selectedPhoto,
  photos,
  getPhotoUrl,
  onPhotoChange,
  readOnly = false,
  updatingPhotoId,
  faseColors,
  handleUpdateFase,
  getLocationColor,
  availableDelenVanHuis,
  handleUpdateDeelVanHuis,
}: PhotoLightboxProps) => {
  const currentIndex = selectedPhoto ? photos.findIndex((p) => p.id === selectedPhoto.id) : -1;
  const hasMultiplePhotos = photos.length > 1;

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      onPhotoChange(photos[currentIndex - 1]);
    } else if (currentIndex === 0 && hasMultiplePhotos) {
      // Wrap around to last photo
      onPhotoChange(photos[photos.length - 1]);
    }
  }, [currentIndex, photos, onPhotoChange, hasMultiplePhotos]);

  const goToNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onPhotoChange(photos[currentIndex + 1]);
    } else if (currentIndex === photos.length - 1 && hasMultiplePhotos) {
      // Wrap around to first photo
      onPhotoChange(photos[0]);
    }
  }, [currentIndex, photos, onPhotoChange, hasMultiplePhotos]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNext,
    onSwipedRight: goToPrevious,
    preventScrollOnSwipe: true,
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  if (!selectedPhoto) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative" {...swipeHandlers}>
          {/* Navigation buttons - hidden on mobile, visible on desktop */}
          {hasMultiplePhotos && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 hidden sm:flex"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm hover:bg-background/90 hidden sm:flex"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Photo counter */}
          {hasMultiplePhotos && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}

          {/* Swipe hint for mobile */}
          {hasMultiplePhotos && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground sm:hidden">
              ← Swipe om te navigeren →
            </div>
          )}

          <img
            src={getPhotoUrl(selectedPhoto.afbeelding_url)}
            alt={selectedPhoto.notitie || "Project foto"}
            className="w-full rounded-t-lg select-none"
            draggable={false}
          />
        </div>

        <div className="p-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            {!readOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge
                    className={`${faseColors[selectedPhoto.fase]} text-white cursor-pointer hover:opacity-90 transition-opacity`}
                  >
                    {updatingPhotoId === selectedPhoto.id ? "..." : selectedPhoto.fase}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {(["Voor", "Tijdens", "Na"] as PhotoPhase[]).map((fase) => (
                    <DropdownMenuItem
                      key={fase}
                      onClick={() => {
                        if (fase !== selectedPhoto.fase) {
                          handleUpdateFase(selectedPhoto.id, fase);
                          onPhotoChange({ ...selectedPhoto, fase });
                        }
                      }}
                      className={fase === selectedPhoto.fase ? "bg-accent" : ""}
                    >
                      <span className={`w-3 h-3 rounded-full mr-2 ${faseColors[fase]}`} />
                      {fase}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge className={`${faseColors[selectedPhoto.fase]} text-white`}>
                {selectedPhoto.fase}
              </Badge>
            )}
            {!readOnly ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge
                    className={`cursor-pointer hover:opacity-90 transition-opacity border-0 ${
                      selectedPhoto.deel_van_huis && selectedPhoto.deel_van_huis !== "Nog invullen"
                        ? getLocationColor(selectedPhoto.deel_van_huis)
                        : "bg-gray-500 text-white"
                    }`}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    {updatingPhotoId === selectedPhoto.id
                      ? "..."
                      : selectedPhoto.deel_van_huis || "Locatie"}
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
                  {availableDelenVanHuis.map((deel) => (
                    <DropdownMenuItem
                      key={deel}
                      onClick={() => {
                        if (deel !== selectedPhoto.deel_van_huis) {
                          handleUpdateDeelVanHuis(selectedPhoto.id, deel);
                          onPhotoChange({ ...selectedPhoto, deel_van_huis: deel });
                        }
                      }}
                      className={deel === selectedPhoto.deel_van_huis ? "bg-accent" : ""}
                    >
                      <span
                        className={`w-3 h-3 rounded-full mr-2 ${getLocationColor(deel).split(" ")[0]}`}
                      />
                      {deel}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              selectedPhoto.deel_van_huis &&
              selectedPhoto.deel_van_huis !== "Nog invullen" && (
                <Badge className={`border-0 ${getLocationColor(selectedPhoto.deel_van_huis)}`}>
                  <MapPin className="w-3 h-3 mr-1" />
                  {selectedPhoto.deel_van_huis}
                </Badge>
              )
            )}
          </div>
          {selectedPhoto.notitie && (
            <p className="text-muted-foreground">{selectedPhoto.notitie}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
