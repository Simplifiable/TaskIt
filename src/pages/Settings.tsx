import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, verifyBeforeUpdateEmail, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const profileSchema = z.object({
  displayName: z.string()
    .min(3, "Display name must be at least 3 characters")
    .max(20, "Display name must be 20 characters or less"),
  email: z.string().email("Invalid email address"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showReauth, setShowReauth] = useState(false);
  const [password, setPassword] = useState("");
  
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      email: user?.email || "",
    },
  });

  const handleReauthenticate = async () => {
    if (!user?.email) return;
    
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setShowReauth(false);
      setPassword("");
      toast({
        title: "Success",
        description: "Successfully reauthenticated",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to reauthenticate. Please check your password.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateProfile = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      // Update display name
      await updateProfile(user, {
        displayName: data.displayName,
      });

      // Handle email update
      if (data.email !== user.email) {
        await verifyBeforeUpdateEmail(user, data.email);
        toast({
          title: "Verification Email Sent",
          description: "Please check your email to verify the new address before the change takes effect.",
        });
      } else {
        toast({
          title: "Profile updated",
          description: "Your display name has been updated successfully"
        });
      }
    } catch (error: any) {
      if (error.code === "auth/requires-recent-login") {
        setShowReauth(true);
        toast({
          title: "Authentication Required",
          description: "Please re-enter your password to continue",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
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
        <CardContent>
          {showReauth ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Please enter your password to continue</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleReauthenticate}>
                Confirm
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(handleUpdateProfile)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  {...register("displayName")}
                />
                {errors.displayName && (
                  <p className="text-sm text-destructive">{errors.displayName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <Button type="submit">
                Update Profile
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}