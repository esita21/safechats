import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import ChildLayout from '@/components/layouts/ChildLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getInitials } from '@/lib/utils';

type FormData = z.infer<typeof updateProfileSchema>;

const colorOptions = [
  '#FF6B6B', // Red
  '#48DBFB', // Blue
  '#1DD1A1', // Green
  '#FFC312', // Yellow
  '#9C88FF', // Purple
  '#FF9FF3', // Pink
  '#54A0FF', // Sky Blue
  '#FF9F43', // Orange
];

export default function ChildProfile() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Redirect if not logged in or not a child
  useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (user.isParent) {
      setLocation('/parent/dashboard');
    }
  }, [user, setLocation]);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: user?.name || '',
      status: user?.status || '',
      avatarColor: user?.avatarColor || '#3b82f6',
    }
  });
  
  const watchedColor = watch('avatarColor');
  
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      setError(null);
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
      
      const updatedUser = await response.json();
      
      // Update the user in context
      login({
        ...user,
        ...updatedUser
      });
      
      toast({
        title: "Profile updated!",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  if (!user || user.isParent) return null;
  
  return (
    <ChildLayout>
      <div className="p-4 md:p-6">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Edit Your Profile</h1>
            
            <Card>
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardHeader>
                  <CardTitle>Your Profile</CardTitle>
                  <CardDescription>
                    Customize how you appear to your friends
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="flex flex-col items-center gap-3">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback style={{ backgroundColor: watchedColor }}>
                        {getInitials(watch('name'))}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-full ${watchedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setValue('avatarColor', color)}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      {...register('name')}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status Message</Label>
                    <Textarea
                      id="status"
                      {...register('status')}
                      placeholder="What's on your mind?"
                      className="h-20"
                    />
                    {errors.status && (
                      <p className="text-sm text-red-500">{errors.status.message}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation('/child/dashboard')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </ChildLayout>
  );
}
