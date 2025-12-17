import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from 'next-themes';
import { useEffect } from 'react';
import { Bell, Globe, Lock, Palette, Save, User } from "lucide-react";

const Settings = () => {
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "Joash@gmail.com",
    phone: "+639059336671",
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    truckAlerts: true,
    maintenanceReminders: true,
    scheduleUpdates: true,
  });

  const { theme: currentTheme, setTheme } = useTheme();

  const [appearance, setAppearance] = useState({
    theme: "system",
    language: "en",
    timezone: "Asia/Manila",
  });

  useEffect(() => {
    if (!currentTheme) return;
    setAppearance((prev) => ({ ...prev, theme: currentTheme }));
  }, [currentTheme]);

  const handleSaveProfile = () => {
    toast.success("Profile settings saved successfully");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleSaveAppearance = () => {
    toast.success("Appearance settings saved");
  };

  return (
    <div className="space-y-6 content-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Notification Channels</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-notif">Email Notifications</Label>
                    <Switch
                      id="email-notif"
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-notif">Push Notifications</Label>
                    <Switch
                      id="push-notif"
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sms-notif">SMS Notifications</Label>
                    <Switch
                      id="sms-notif"
                      checked={notifications.sms}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Alert Types</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="truck-alerts">Truck Status Alerts</Label>
                    <Switch
                      id="truck-alerts"
                      checked={notifications.truckAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, truckAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-alerts">Maintenance Reminders</Label>
                    <Switch
                      id="maintenance-alerts"
                      checked={notifications.maintenanceReminders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceReminders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="schedule-alerts">Schedule Updates</Label>
                    <Switch
                      id="schedule-alerts"
                      checked={notifications.scheduleUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, scheduleUpdates: checked })}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="gap-2">
                <Save className="h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={appearance.theme}
                    onValueChange={(value) => {
                      setAppearance({ ...appearance, theme: value });
                      try { setTheme(value as 'light' | 'dark' | 'system'); } catch (e) {}
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={appearance.language}
                    onValueChange={(value) => setAppearance({ ...appearance, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="English" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={appearance.timezone}
                    onValueChange={(value) => setAppearance({ ...appearance, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asia/Manila (GMT+8)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Manila">Asia/Manila (GMT+8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSaveAppearance} className="gap-2">
                <Save className="h-4 w-4" />
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your password and security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" placeholder="Enter current password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" placeholder="Enter new password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input id="confirm-password" type="password" placeholder="Confirm new password" />
                </div>
              </div>
              <Button onClick={() => toast.success("Password updated successfully")} className="gap-2">
                <Lock className="h-4 w-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
