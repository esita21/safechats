import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createChildSchema, User } from '@shared/schema';
import { useAuth } from '@/lib/auth';
import ParentLayout from '@/components/layouts/ParentLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, PlusCircle, User as UserIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, isEmpty } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type FormData = z.infer<typeof createChildSchema>;

export default function ChildAccounts() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not logged in or not a parent
  useEffect(() => {
    if (!user) {
      setLocation('/');
    } else if (!user.isParent) {
      setLocation('/child/dashboard');
    }
  }, [user, setLocation]);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(createChildSchema),
    defaultValues: {
      username: '',
      password: '',
      name: '',
      status: '',
      avatarColor: '#3b82f6',
    }
  });
  
  const { data: children, isLoading: loadingChildren } = useQuery<User[]>({
    queryKey: [`/api/parent/${user?.id}/children`],
    enabled: !!user,
  });
  
  const onSubmit = async (data: FormData) => {
    if (!user) return;
    
    try {
      setError(null);
      console.log('Creating child account with data:',  JSON.stringify({
          ...data,
          parentId: user.id
        }));
      const response = await fetch('/api/children', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          parentId: Number(user.id)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create child account');
      }
      
      // Reset form and close dialog
      reset();
      setIsDialogOpen(false);
      
      // Invalidate the cache to refresh the children list
      queryClient.invalidateQueries({ queryKey: [`/api/parent/${user.id}/children`] });
      
      toast({
        title: "Success!",
        description: `Child account for ${data.name} has been created.`,
      });
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  if (!user || !user.isParent) return null;
  
  return (
    <ParentLayout>
      <div className="p-4 md:p-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Child Accounts</h1>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Child Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <DialogHeader>
                    <DialogTitle>Create Child Account</DialogTitle>
                    <DialogDescription>
                      Create a new account for your child to use KidChat.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">Child's Name</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Enter your child's name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500">{errors.name.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        {...register('username')}
                        placeholder="Choose a username for your child"
                      />
                      {errors.username && (
                        <p className="text-sm text-red-500">{errors.username.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register('password')}
                        placeholder="Create a password"
                      />
                      {errors.password && (
                        <p className="text-sm text-red-500">{errors.password.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Account'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Children</CardTitle>
              <CardDescription>
                Manage accounts for your children
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingChildren ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : isEmpty(children) ? (
                <div className="text-center py-8">
                  <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No children accounts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new account for your child.
                  </p>
                  <div className="mt-6">
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Child Account
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {children?.map((child) => (
                    <div 
                      key={child.id}
                      className="flex items-center p-4 rounded-lg border"
                    >
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarFallback style={{ backgroundColor: child.avatarColor }}>
                          {getInitials(child.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{child.name}</h3>
                        <p className="text-sm text-gray-500">@{child.username}</p>
                        {child.status && (
                          <p className="text-sm">{child.status}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/parent/message-reviews?childId=${child.id}`)}
                      >
                        View Messages
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <Separator />
            <CardFooter className="pt-6">
              <p className="text-sm text-gray-500">
                Children can use these accounts to log in to KidChat. Their activity will be monitored, 
                and you'll be notified of any friend requests or inappropriate messages.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ParentLayout>
  );
}
