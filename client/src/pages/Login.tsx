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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary mb-2">KidChat</h1>
          <p className="text-gray-600">Safe messaging for kids</p>
        </div>
        
        <Tabs defaultValue="parent" onValueChange={(value) => setIsParentLogin(value === 'parent')}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="parent">I'm a Parent</TabsTrigger>
            <TabsTrigger value="child">I'm a Kid</TabsTrigger>
          </TabsList>
          
          <TabsContent value="parent">
            <Card>
              <CardHeader>
                <CardTitle>Parent Login</CardTitle>
                <CardDescription>
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
                    <Label htmlFor="parent-username">Username</Label>
                    <Input
                      id="parent-username"
                      {...register('username')}
                      placeholder="Enter your username"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="parent-password">Password</Label>
                    <Input
                      id="parent-password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter your password"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-col space-y-2">
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation('/register')}
                  >
                    Create Parent Account
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="child">
            <Card>
              <CardHeader>
                <CardTitle>Kid Login</CardTitle>
                <CardDescription>
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
                    <Label htmlFor="child-username">Username</Label>
                    <Input
                      id="child-username"
                      {...register('username')}
                      placeholder="Enter your username"
                    />
                    {errors.username && (
                      <p className="text-sm text-red-500">{errors.username.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="child-password">Password</Label>
                    <Input
                      id="child-password"
                      type="password"
                      {...register('password')}
                      placeholder="Enter your password"
                    />
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
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
