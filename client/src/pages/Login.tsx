import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type FormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [isParentLogin, setIsParentLogin] = useState(true);
  const { login } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: ''
    }
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }
      
      const user = await response.json();
      console.log('Logged in user:', user);
      // Check if they're trying to log in with the correct account type
      if (isParentLogin && !user.isParent) {
        throw new Error('This is a parent login. Please log in as a child on the child tab.');
      }
      
      if (!isParentLogin && user.isParent) {
        throw new Error('This is a child login. Parents should use the parent tab.');
      }
      
      // Store the user in auth context
      login(user);
      
      // Redirect based on user type
      if (user.isParent) {
        setLocation('/parent/dashboard');
      } else {
        setLocation('/child/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  return (
    <div className="cute-auth-container">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 bounce-in">
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-md">KidChat</h1>
          <p className="text-white/90 font-medium">Safe messaging for kids</p>
        </div>
        
        <Tabs defaultValue="parent" onValueChange={(value) => setIsParentLogin(value === 'parent')}>
          <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full cute-button">
            <TabsTrigger value="parent" className="rounded-full">I'm a Parent</TabsTrigger>
            <TabsTrigger value="child" className="rounded-full">I'm a Kid</TabsTrigger>
          </TabsList>
          
          <TabsContent value="parent" className="slide-in">
            <Card className="cute-auth-card border-none">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-primary">Parent Login</CardTitle>
                <CardDescription className="text-center">
                  Sign in to monitor your child's chats and approve friend requests.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent-username" className="font-medium">Username</Label>
                    <Input
                      id="parent-username"
                      {...register('username')}
                      placeholder="Enter your username"
                      className="cute-input"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent-password" className="font-medium">Password</Label>
                    <Input
                      id="parent-password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter your password"
                      className="cute-input"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-3">
                  <Button type="submit" className="w-full rounded-full cute-button shadow-md" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full cute-button shadow-sm"
                    onClick={() => setLocation('/register')}
                  >
                    Create Parent Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="child" className="slide-in">
            <Card className="cute-auth-card border-none">
              <CardHeader>
                <CardTitle className="text-2xl text-center text-primary">Kid Login</CardTitle>
                <CardDescription className="text-center">
                  Sign in to chat with your friends!
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="child-username" className="font-medium">Username</Label>
                    <Input
                      id="child-username"
                      {...register('username')}
                      placeholder="Enter your username"
                      className="cute-input"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="child-password" className="font-medium">Password</Label>
                    <Input
                      id="child-password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter your password"
                      className="cute-input"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full rounded-full cute-button shadow-md" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
