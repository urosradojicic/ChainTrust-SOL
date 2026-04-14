import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Shield, TrendingUp, Building2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type AppRole = 'admin' | 'investor' | 'startup';

const DEMO_ROLES = [
  { role: 'Admin' as const, email: 'admin@chainmetrics.io', password: 'admin123', icon: Shield, desc: 'Full platform access', color: 'border-primary/30 bg-primary/5 hover:bg-primary/10' },
  { role: 'Investor' as const, email: 'investor@chainmetrics.io', password: 'investor1', icon: TrendingUp, desc: 'Screener, analytics, portfolio', color: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' },
  { role: 'Startup' as const, email: 'startup@chainmetrics.io', password: 'startup1', icon: Building2, desc: 'Register, publish, earn badges', color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10' },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [signingInAs, setSigningInAs] = useState<string | null>(null);
  const [signUpRole, setSignUpRole] = useState<AppRole>('investor');
  const [displayName, setDisplayName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      toast.success('Account created! You can now sign in.');
    }
  };

  const quickLogin = async (cred: typeof DEMO_ROLES[0]) => {
    setSigningInAs(cred.role);
    setEmail(cred.email);
    setPassword(cred.password);
    const { error } = await signIn(cred.email, cred.password);
    setSigningInAs(null);
    if (error) {
      toast.error(`Failed: ${error.message}`);
    } else {
      toast.success(`Signed in as ${cred.role}`);
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Quick Login Buttons — most prominent element */}
        <Card className="border border-border shadow-lg">
          <CardHeader className="pb-2 pt-6 px-6">
            <h1 className="text-2xl font-bold tracking-tight">Welcome to ChainTrust</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a role to explore the platform
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-3 mt-2">
              {DEMO_ROLES.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => quickLogin(cred)}
                  disabled={signingInAs !== null}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${cred.color} disabled:opacity-50`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 shrink-0">
                    {signingInAs === cred.role ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <cred.icon className="h-5 w-5 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground">
                      {signingInAs === cred.role ? `Signing in as ${cred.role}...` : `Continue as ${cred.role}`}
                    </div>
                    <div className="text-xs text-muted-foreground">{cred.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Manual Login — for real accounts */}
        <Card className="border border-border/60">
          <CardContent className="px-6 py-5">
            <Tabs defaultValue="login" className="mt-0">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
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
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4 mt-4">
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

        {/* Dev details — only in development */}
        {import.meta.env.DEV && (
          <Card className="border border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground mb-2 font-bold">Dev credentials (DEV only):</p>
              {DEMO_ROLES.map((cred) => (
                <p key={cred.role} className="text-[10px] text-muted-foreground font-mono">{cred.email} / {cred.password}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
