import { QrCodeDisplay } from '@/components/QrCodeDisplay';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode as QrCodeIcon } from 'lucide-react';

export default function HomePage() {
  const gymId = process.env.GYMPASS_GYM_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!gymId || !appUrl) {
    return (
      <div className="text-center text-destructive">
        <h1 className="text-2xl font-bold mb-4">Erro de Configuração</h1>
        <p>As variáveis de ambiente GYMPASS_GYM_ID ou NEXT_PUBLIC_APP_URL não estão definidas.</p>
        <p>Por favor, configure-as para continuar.</p>
      </div>
    );
  }

  const checkInUrl = `${appUrl}/api/check-in/initiate-validation?gym_id=${gymId}`;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary text-primary-foreground rounded-full p-3 w-fit mb-4">
            <QrCodeIcon size={40} />
          </div>
          <CardTitle className="text-3xl font-bold text-primary">Auto Check-in Gympass</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Escaneie o QR Code abaixo com seu app Gympass para validar seu check-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center">
          <QrCodeDisplay value={checkInUrl} />
          <p className="mt-6 text-sm text-center text-muted-foreground max-w-xs">
            Aponte a câmera do seu celular para o código. Seu check-in será validado automaticamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
