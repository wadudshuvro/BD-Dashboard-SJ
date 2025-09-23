import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Mail, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent, role: 'manager' | 'team') => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Login successful!",
        description: `Welcome to MarketingIQ Dashboard as ${role}.`,
      });
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 shadow-xl">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">MarketingIQ</h1>
          <p className="text-white/80">Intelligence Dashboard + AI Task Hub</p>
        </div>

        <Card className="backdrop-blur-sm bg-white/95 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="manager" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manager">Manager</TabsTrigger>
                <TabsTrigger value="team">Team Member</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manager" className="space-y-4">
                <form onSubmit={(e) => handleLogin(e, 'manager')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="manager-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="manager-email"
                        type="email"
                        placeholder="manager@company.com"
                        className="pl-10"
                        defaultValue="john.doe@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="manager-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="manager-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        defaultValue="demo123"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in as Manager"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <form onSubmit={(e) => handleLogin(e, 'team')} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="team-email"
                        type="email"
                        placeholder="team@company.com"
                        className="pl-10"
                        defaultValue="sarah.smith@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="team-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="team-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        defaultValue="demo123"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team-role">Role</Label>
                    <Select defaultValue="content-creator">
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content-creator">Content Creator</SelectItem>
                        <SelectItem value="social-media">Social Media Specialist</SelectItem>
                        <SelectItem value="seo-specialist">SEO Specialist</SelectItem>
                        <SelectItem value="campaign-manager">Campaign Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-glow"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign in as Team Member"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>Demo credentials are pre-filled</p>
              <p className="mt-1">
                Manager: john.doe@company.com | Team: sarah.smith@company.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}