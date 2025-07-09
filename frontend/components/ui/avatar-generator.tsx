import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw,
  User,
  Palette
} from "lucide-react";

interface AvatarGeneratorProps {
  seed?: string;
  onAvatarSelect: (avatarUrl: string) => void;
  className?: string;
}

// Simple color schemes for initials avatars
const COLOR_SCHEMES = [
  { bg: '#FF6B6B', text: '#FFFFFF', name: 'Red' },
  { bg: '#4ECDC4', text: '#FFFFFF', name: 'Teal' },
  { bg: '#45B7D1', text: '#FFFFFF', name: 'Blue' },
  { bg: '#96CEB4', text: '#FFFFFF', name: 'Green' },
  { bg: '#FFEAA7', text: '#2D3436', name: 'Yellow' },
  { bg: '#DDA0DD', text: '#FFFFFF', name: 'Purple' },
  { bg: '#98D8C8', text: '#FFFFFF', name: 'Mint' },
  { bg: '#F7DC6F', text: '#2D3436', name: 'Gold' },
  { bg: '#BB8FCE', text: '#FFFFFF', name: 'Lavender' },
  { bg: '#85C1E9', text: '#FFFFFF', name: 'Sky' },
  { bg: '#F8C471', text: '#2D3436', name: 'Orange' },
  { bg: '#82E0AA', text: '#FFFFFF', name: 'Emerald' }
];

const PREDEFINED_SEEDS = [
  "Somnath", "Khadfga", "SK", "User", "Profile", "Avatar",
  "Alpha", "Beta", "Gamma", "Delta", "Sigma", "Omega"
];

export function AvatarGenerator({ 
  seed = "Somnath Khadfga", 
  onAvatarSelect,
  className 
}: AvatarGeneratorProps) {
  const [currentSeed, setCurrentSeed] = useState(seed);

  // Generate initials from seed
  const getInitials = (text: string): string => {
    const words = text.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    if (words[0] && words[0].length >= 2) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words[0]?.[0]?.toUpperCase() || 'U';
  };

  // Generate SVG avatar
  const generateInitialsAvatar = (seedValue: string, colorScheme: any): string => {
    const initials = getInitials(seedValue);
    
    const svg = `
      <svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="32" fill="${colorScheme.bg}"/>
        <text x="32" y="40" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
              font-size="18" font-weight="600" text-anchor="middle" fill="${colorScheme.text}">${initials}</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  // Generate avatars for current seed
  const generatedAvatars = useMemo(() => {
    return PREDEFINED_SEEDS.map((seedValue, index) => {
      const colorScheme = COLOR_SCHEMES[index % COLOR_SCHEMES.length];
      const avatarUrl = generateInitialsAvatar(seedValue, colorScheme);
      
      return {
        seed: seedValue,
        url: avatarUrl,
        colorScheme,
        initials: getInitials(seedValue),
        isDefault: seedValue === seed || seedValue === "SK" || seedValue === "Somnath" || seedValue === "Khadfga"
      };
    });
  }, [seed]);

  const generateRandomSeed = () => {
    const randomSeed = Math.random().toString(36).substring(2, 15);
    setCurrentSeed(randomSeed);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Palette className="h-5 w-5" />
          <span>Choose Avatar</span>
          <Badge variant="secondary">Clean</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Select from colorful initials-based avatars
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Initials Avatars</h3>
              <p className="text-sm text-muted-foreground">Clean, professional avatars with your initials</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateRandomSeed}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Random</span>
            </Button>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {generatedAvatars.map((avatar, index) => (
              <button
                key={`${avatar.seed}-${index}`}
                onClick={() => onAvatarSelect(avatar.url)}
                className="relative group"
                title={`${avatar.seed} (${avatar.initials})`}
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-all duration-200 group-hover:shadow-lg">
                  <img
                    src={avatar.url}
                    alt={`${avatar.seed} avatar`}
                    className="w-full h-full object-cover"
                    style={{ backgroundColor: avatar.colorScheme.bg }}
                  />
                </div>
                {avatar.isDefault && (
                  <div className="absolute -top-1 -right-1">
                    <Badge variant="default" className="text-xs px-1 py-0">
                      SK
                    </Badge>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-lg transition-colors" />
                <div className="mt-1 text-xs text-center text-muted-foreground truncate">
                  {avatar.initials}
                </div>
              </button>
            ))}
          </div>

          {/* Custom Seed Input */}
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={currentSeed}
                onChange={(e) => setCurrentSeed(e.target.value)}
                placeholder="Enter name or text"
                className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentSeed.trim()) {
                    const randomColor = COLOR_SCHEMES[Math.floor(Math.random() * COLOR_SCHEMES.length)];
                    const customAvatar = generateInitialsAvatar(currentSeed, randomColor);
                    onAvatarSelect(customAvatar);
                  }
                }}
                disabled={!currentSeed.trim()}
              >
                Create
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Enter any name or text to create a custom avatar
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 