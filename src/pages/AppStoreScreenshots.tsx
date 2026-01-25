import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Smartphone, Tablet, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ScreenshotData {
  id: string;
  title: string;
  description: string;
  gradient: string;
  features: string[];
}

const screenshots: ScreenshotData[] = [
  {
    id: "dashboard",
    title: "Dashboard Overzicht",
    description: "Al je verbouwprojecten in één overzicht",
    gradient: "from-primary/20 via-primary/10 to-background",
    features: ["Projectoverzicht", "Voortgang tracking", "Budget inzicht"],
  },
  {
    id: "project",
    title: "Projectdetails",
    description: "Volledige controle over elk project",
    gradient: "from-blue-500/20 via-blue-400/10 to-background",
    features: ["Takenbeheer", "Kostenoverzicht", "Documenten"],
  },
  {
    id: "tasks",
    title: "Takenbeheer",
    description: "Houd elke taak bij met drag & drop",
    gradient: "from-green-500/20 via-green-400/10 to-background",
    features: ["Kanban bord", "Prioriteiten", "Deadlines"],
  },
  {
    id: "costs",
    title: "Kostenoverzicht",
    description: "Budget en uitgaven altijd up-to-date",
    gradient: "from-amber-500/20 via-amber-400/10 to-background",
    features: ["Facturen", "Categorieën", "Budget alerts"],
  },
  {
    id: "photos",
    title: "Foto Documentatie",
    description: "Leg de voortgang vast met foto's",
    gradient: "from-purple-500/20 via-purple-400/10 to-background",
    features: ["Voor/Na foto's", "Galerij", "Tijdlijn"],
  },
];

const DeviceMockup = ({ 
  type, 
  children, 
  className = "" 
}: { 
  type: "iphone" | "ipad" | "desktop"; 
  children: React.ReactNode;
  className?: string;
}) => {
  if (type === "iphone") {
    return (
      <div className={`relative mx-auto ${className}`} style={{ width: "280px" }}>
        {/* iPhone Frame */}
        <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
          {/* Dynamic Island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-foreground rounded-full z-10" />
          {/* Screen */}
          <div className="relative bg-background rounded-[2.5rem] overflow-hidden aspect-[9/19.5]">
            {children}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      </div>
    );
  }

  if (type === "ipad") {
    return (
      <div className={`relative mx-auto ${className}`} style={{ width: "500px" }}>
        {/* iPad Frame */}
        <div className="relative bg-foreground rounded-[2rem] p-3 shadow-2xl">
          {/* Camera */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3 h-3 bg-muted-foreground/50 rounded-full" />
          {/* Screen */}
          <div className="relative bg-background rounded-[1.5rem] overflow-hidden aspect-[4/3]">
            {children}
          </div>
          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-muted-foreground/30 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`relative mx-auto ${className}`} style={{ width: "600px" }}>
      {/* Desktop Frame */}
      <div className="relative bg-foreground rounded-xl p-2 shadow-2xl">
        {/* Screen */}
        <div className="relative bg-background rounded-lg overflow-hidden aspect-[16/10]">
          {children}
        </div>
        {/* Stand */}
        <div className="flex justify-center">
          <div className="w-24 h-4 bg-foreground" />
        </div>
        <div className="flex justify-center">
          <div className="w-40 h-2 bg-foreground rounded-b-lg" />
        </div>
      </div>
    </div>
  );
};

const ScreenContent = ({ screenshot }: { screenshot: ScreenshotData }) => {
  return (
    <div className={`h-full w-full bg-gradient-to-b ${screenshot.gradient} p-4 flex flex-col`}>
      {/* Mock Status Bar */}
      <div className="flex justify-between items-center text-xs text-muted-foreground mb-4 pt-8">
        <span>9:41</span>
        <div className="flex gap-1">
          <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
          <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
          <div className="w-6 h-2 bg-muted-foreground/50 rounded-sm" />
        </div>
      </div>

      {/* App Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">VB</span>
        </div>
        <span className="font-semibold text-foreground">VerbouwBuddy</span>
      </div>

      {/* Screen Title */}
      <h3 className="text-xl font-bold text-foreground mb-2">{screenshot.title}</h3>
      <p className="text-sm text-muted-foreground mb-6">{screenshot.description}</p>

      {/* Feature Cards */}
      <div className="space-y-3 flex-1">
        {screenshot.features.map((feature, index) => (
          <div
            key={feature}
            className="bg-card/80 backdrop-blur-sm rounded-xl p-4 border border-border/50 shadow-sm"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <div className="w-5 h-5 rounded bg-primary/50" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">{feature}</p>
                <div className="h-2 w-24 bg-muted rounded mt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mock Navigation */}
      <div className="flex justify-around pt-4 border-t border-border/30 mt-4">
        {["🏠", "📋", "📊", "⚙️"].map((icon, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-lg">{icon}</span>
            <div className="w-8 h-1 bg-muted-foreground/20 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

const AppStoreScreenshots = () => {
  const navigate = useNavigate();
  const [activeDevice, setActiveDevice] = useState<"iphone" | "ipad" | "desktop">("iphone");

  const deviceSizes = {
    iphone: {
      "6.7\"": "1290 × 2796 px",
      "6.5\"": "1284 × 2778 px",
      "5.5\"": "1242 × 2208 px",
    },
    ipad: {
      "12.9\"": "2048 × 2732 px",
      "11\"": "1668 × 2388 px",
    },
    desktop: {
      "Mac": "1280 × 800 px",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">App Store Screenshots</h1>
                <p className="text-sm text-muted-foreground">Preview en download schermen voor App Store</p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:flex">
              {screenshots.length} schermen
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Device Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Kies apparaat formaat</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeDevice} onValueChange={(v) => setActiveDevice(v as typeof activeDevice)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="iphone" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  iPhone
                </TabsTrigger>
                <TabsTrigger value="ipad" className="gap-2">
                  <Tablet className="h-4 w-4" />
                  iPad
                </TabsTrigger>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </TabsTrigger>
              </TabsList>

              <TabsContent value="iphone" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(deviceSizes.iphone).map(([size, resolution]) => (
                    <Badge key={size} variant="outline">
                      {size} - {resolution}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="ipad" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(deviceSizes.ipad).map(([size, resolution]) => (
                    <Badge key={size} variant="outline">
                      {size} - {resolution}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="desktop" className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {Object.entries(deviceSizes.desktop).map(([size, resolution]) => (
                    <Badge key={size} variant="outline">
                      {size} - {resolution}
                    </Badge>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Screenshots Gallery */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Screenshot Preview</h2>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download alle
            </Button>
          </div>

          <div className={`grid gap-8 ${
            activeDevice === "iphone" 
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
              : activeDevice === "ipad"
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1"
          }`}>
            {screenshots.map((screenshot) => (
              <div key={screenshot.id} className="flex flex-col items-center gap-4">
                <DeviceMockup type={activeDevice}>
                  <ScreenContent screenshot={screenshot} />
                </DeviceMockup>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">{screenshot.title}</h3>
                  <p className="text-sm text-muted-foreground">{screenshot.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export Instructions */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle>📱 App Store Richtlijnen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">iPhone Screenshots</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 6.7" display: 1290 × 2796 pixels</li>
                  <li>• 6.5" display: 1284 × 2778 pixels</li>
                  <li>• 5.5" display: 1242 × 2208 pixels</li>
                  <li>• Minimaal 3, maximaal 10 screenshots</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-foreground">iPad Screenshots</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 12.9" display: 2048 × 2732 pixels</li>
                  <li>• 11" display: 1668 × 2388 pixels</li>
                  <li>• Optioneel maar aanbevolen</li>
                  <li>• Toont iPad-specifieke features</li>
                </ul>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Tip:</strong> Gebruik tools zoals Figma, Sketch of online mockup generators 
                om de screenshots in de juiste resoluties te exporteren. Deze previews geven je een 
                goed beeld van hoe de schermen er in de App Store uit zullen zien.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AppStoreScreenshots;
