import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile } from "firebase/auth";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";

export default function Settings() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      let photoURL = user.photoURL;

      if (file) {
        const imageRef = ref(storage, `profile-pictures/${user.uid}`);
        const snapshot = await uploadBytes(imageRef, file);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      await updateProfile(user, {
        displayName,
        photoURL
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.size <= 400 * 1024) { // 400KB max
      setFile(selectedFile);
    } else {
      toast({
        title: "Error",
        description: "File size must be less than 400KB",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="picture">Profile Picture</Label>
            <Input
              id="picture"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <p className="text-sm text-muted-foreground">
              Maximum file size: 400KB
            </p>
          </div>
          <Button onClick={handleUpdateProfile}>
            Update Profile
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Theme Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
            >
              Light Mode
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
            >
              Dark Mode
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}