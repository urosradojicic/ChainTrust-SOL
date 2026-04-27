import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentTitle } from '@/hooks/use-document-title';
import PasswordStrengthMeter, { scorePassword } from '@/components/PasswordStrengthMeter';
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
  { role: 'Investor' as const, email: 'investor@chainmetrics.io', password: 'investor1', icon: TrendingUp, desc: 'Explore AI analytics, screener, due diligence, portfolio tools', color: 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10', highlight: true },
  { role: 'Startup' as const, email: 'startup@chainmetrics.io', password: 'startup1', icon: Building2, desc: 'See the registration flow, publish metrics, earn soulbound badges', color: 'border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10', highlight: false },
  { role: 'Admin' as const, email: 'admin@chainmetrics.io', password: 'admin123', icon: Shield, desc: 'Full platform access — all features unlocked', color: 'border-primary/30 bg-primary/5 hover:bg-primary/10', highlight: false },
];

export default function Login() {
  useDocumentTitle('Sign in');
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
    // Source of truth: scorePassword() returns the same criteria the meter
    // shows. We require ≥3 (length + a digit + a letter — "Good" or above)
    // to accept signup so the meter and rejection criteria stay aligned.
    const strength = scorePassword(password);
    if (strength.score < 3) {
      const unmet = strength.criteria.filter((c) => !c.met).slice(0, 2).map((c) => c.description);
      toast.error(`Password too weak — please add: ${unmet.join(' and ')}.`);
      return;
    }
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
              The credit bureau for startups. Choose a perspective to explore.
            </p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Stats bar */}
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2.5 mb-4 mt-2">
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">75</div>
                <div className="text-[10px] text-muted-foreground">AI engines</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">24</div>
                <div className="text-[10px] text-muted-foreground">On-chain ops</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">$0.00025</div>
                <div className="text-[10px] text-muted-foreground">Per verify</div>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="text-center">
                <div className="text-sm font-bold text-foreground">2s</div>
                <div className="text-[10px] text-muted-foreground">Speed</div>
              </div>
            </div>

            <div className="grid gap-3">
              {DEMO_ROLES.map((cred) => (
                <button
                  key={cred.role}
                  onClick={() => quickLogin(cred)}
                  disabled={signingInAs !== null}
                  className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${cred.color} disabled:opacity-50 ${(cred as any).highlight ? 'ring-1 ring-emerald-500/30' : ''}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 shrink-0">
                    {signingInAs === cred.role ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <cred.icon className="h-5 w-5 text-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-foreground flex items-center gap-2">
                      {signingInAs === cred.role ? `Signing in as ${cred.role}...` : `Explore as ${cred.role}`}
                      {(cred as any).highlight && <span className="rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[9px] font-bold uppercase">Recommended</span>}
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword
                          ? <EyeOff className="h-4 w-4" aria-hidden="true" />
                          : <Eye className="h-4 w-4" aria-hidden="true" />}
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
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      aria-describedby="signup-password-strength"
                    />
                    <div id="signup-password-strength">
                      <PasswordStrengthMeter password={password} />
                    </div>
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
