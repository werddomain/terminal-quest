import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Certificate, CheckCircle, Server, Lock, LockOpen } from '@phosphor-icons/react';

interface CertificateInstallProps {
  open: boolean;
  onClose: () => void;
  technicianLevel: 1 | 2 | 3;
}

export function CertificateInstall({ open, onClose, technicianLevel }: CertificateInstallProps) {
  const getCertificateInfo = (level: 1 | 2 | 3) => {
    switch (level) {
      case 2:
        return {
          title: 'Intermediate Access Certificate',
          description: 'You have been granted access to intermediate-level servers',
          badge: 'Level 2',
          servers: ['config-server-*.company.local', 'dev-*.company.local', 'staging-*.company.local']
        };
      case 1:
        return {
          title: 'Senior Access Certificate',
          description: 'You now have full access to all production and critical systems',
          badge: 'Level 1',
          servers: ['prod-*.company.local', 'critical-*.company.local', 'backup-*.company.local', 'optimize-*.company.local']
        };
      default:
        return {
          title: 'Junior Access Certificate',
          description: 'Basic access certificate installed',
          badge: 'Level 3',
          servers: ['server-*.company.local']
        };
    }
  };

  const info = getCertificateInfo(technicianLevel);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-terminal-green flex items-center gap-2">
            <Certificate className="w-6 h-6" />
            SSH Certificate Installed
          </DialogTitle>
          <DialogDescription className="font-mono text-muted-foreground">
            New server access has been granted
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <Card className="p-6 bg-terminal-green/10 border-terminal-green/30">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-terminal-green mt-1" weight="fill" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-mono font-bold text-lg text-terminal-green">
                    {info.title}
                  </h3>
                  <Badge variant="outline" className="font-mono text-xs border-terminal-green text-terminal-green">
                    {info.badge}
                  </Badge>
                </div>
                <p className="font-mono text-sm text-muted-foreground">
                  {info.description}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card/50 border-border">
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-5 h-5 text-terminal-amber" />
              <h4 className="font-mono font-bold text-sm text-terminal-amber">
                Accessible Server Tiers
              </h4>
            </div>
            <div className="space-y-2">
              {info.servers.map((server, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-2 font-mono text-sm"
                >
                  <LockOpen className="w-4 h-4 text-terminal-green" />
                  <span className="text-terminal-green">{server}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-4 bg-terminal-amber/10 border-terminal-amber/30">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-terminal-amber mt-0.5 shrink-0" />
              <div className="font-mono text-sm text-muted-foreground">
                <p className="mb-2">
                  Use the <span className="text-terminal-green">ssh</span> command to connect to servers:
                </p>
                <code className="block bg-black/50 p-2 rounded text-terminal-green">
                  ssh user@server-01.company.local
                </code>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-center mt-6">
          <Button
            onClick={onClose}
            className="font-mono bg-terminal-green hover:bg-terminal-green/90 text-black px-6"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
