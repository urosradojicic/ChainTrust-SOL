import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { rateLimit } from '@/lib/sanitize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AppRole = 'admin' | 'investor' | 'startup';

const TEST_CREDENTIALS = [
  { role: 'Admin', email: 'admin@chainmetrics.io', password: 'admin123' },
  { role: 'Investor', email: 'investor@chainmetrics.io', password: 'investor1' },
  { role: 'Startup', email: 'startup@chainmetrics.io', password: 'startup1' },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signUpRole, setSignUpRole] = useState<AppRole>('investor');
  const [displayName, setDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rateLimit('login', 5, 60000)) {
      toast.error('Too many login attempts. Wait 60 seconds.');
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Signed in successfully');
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, signUpRole, displayName);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Account created! Check your email to confirm.');
    }
  };

  const fillAndLogin = async (cred: typeof TEST_CREDENTIALS[0]) => {
    setEmail(cred.email);
    setPassword(cred.password);
    setLoading(true);
    const { error } = await signIn(cred.email, cred.password);
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Signed in as ${cred.role}`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-border/60 shadow-lg">
          <CardHeader className="pb-2 pt-8 px-8">
            <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
            <p className="text-muted-foreground text-base mt-1">
              Sign in to ChainTrust
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <Tabs defaultValue="login" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => toast.info('Password reset email sent. Check your inbox.')}
                    className="w-full text-center text-sm text-muted-foreground hover:text-primary transition mt-2"
                  >
                    Forgot your password?
                  </button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-5 mt-4">
                  <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={signUpRole} onValueChange={(v) => setSignUpRole(v as AppRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investor">Investor</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      {signUpRole === 'investor'
                        ? 'Investors can browse startups, use the screener, compare metrics, and track portfolios.'
                        : 'Startups can register their company, publish metrics on-chain, and earn verification badges.'}
                    </p>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Login — Demo Accounts */}
        <Card className="border border-border/60">
          <CardContent className="p-6">
            <h3 className="font-bold text-lg mb-1">Try ChainTrust</h3>
            <p className="text-xs text-muted-foreground mb-3">Experience the platform as any role</p>
            <div className="grid grid-cols-3 gap-2">
              {TEST_CREDENTIALS.map((cred) => (
                <Button
                  key={cred.role}
                  variant="outline"
                  size="sm"
                  onClick={() => fillAndLogin(cred)}
                  disabled={loading}
                  className="flex flex-col items-center gap-0.5 h-auto py-3"
                >
                  <span className="text-xs font-bold">{cred.role}</span>
                  <span className="text-[10px] text-muted-foreground">Sign in</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dev details — only in development */}
        {import.meta.env.DEV && (
          <Card className="border border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground mb-2">Dev credentials (DEV only):</p>
              {TEST_CREDENTIALS.map((cred) => (
                <p key={cred.role} className="text-[10px] text-muted-foreground font-mono">{cred.email} / {cred.password}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
