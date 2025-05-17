import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { MessageProvider } from "./lib/MessageContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Parent routes
import ParentDashboard from "@/pages/parent/ParentDashboard";
import ChildAccounts from "@/pages/parent/ChildAccounts";
import MessageReview from "@/pages/parent/MessageReview";
import FriendRequests from "@/pages/parent/FriendRequests";

// Child routes
import ChildDashboard from "@/pages/child/ChildDashboard";
import ChildChat from "@/pages/child/ChildChat";
import ChildProfile from "@/pages/child/ChildProfile";

function Router() {
  return (
    <Switch>
      {/* Auth routes */}
      <Route path="/" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Parent routes */}
      <Route path="/parent/dashboard" component={ParentDashboard} />
      <Route path="/parent/children" component={ChildAccounts} />
      <Route path="/parent/message-reviews" component={MessageReview} />
      <Route path="/parent/friend-requests" component={FriendRequests} />
      
      {/* Child routes */}
      <Route path="/child/dashboard" component={ChildDashboard} />
      <Route path="/child/chat" component={ChildChat} />
      <Route path="/child/profile" component={ChildProfile} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MessageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </MessageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
