"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export function CheckInStatusDisplay() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const messageParam = searchParams.get('message');
    setStatus(statusParam);
    setMessage(messageParam);
  }, [searchParams]);

  if (status === null) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl text-muted-foreground">Carregando status do check-in...</p>
      </div>
    );
  }

  const isSuccess = status === 'success';
  const isDeclined = status === 'declined';

  let title = "Status do Check-in";
  let description = "Aguarde um momento.";
  let icon = <AlertTriangle className="h-16 w-16 text-yellow-500 mb-6" />;
  let cardClass = "border-yellow-500";
  let titleClass = "text-yellow-600";

  if (isSuccess) {
    title = "Check-in Realizado com Sucesso!";
    description = "Seu acesso foi validado. Pode entrar!";
    icon = <CheckCircle2 className="h-16 w-16 text-green-500 mb-6" />;
    cardClass = "border-green-500 bg-green-50";
    titleClass = "text-green-600";
  } else if (isDeclined) {
    title = "Falha no Check-in";
    description = message || "Não foi possível validar seu check-in. Tente novamente ou contate o suporte.";
    icon = <XCircle className="h-16 w-16 text-destructive mb-6" />;
    cardClass = "border-destructive bg-red-50";
    titleClass = "text-destructive";
  }

  return (
    <Card className={`w-full max-w-lg text-center shadow-xl ${cardClass}`}>
      <CardHeader>
        <div className="flex justify-center">{icon}</div>
        <CardTitle className={`text-3xl font-bold ${titleClass}`}>{title}</CardTitle>
        <CardDescription className="text-lg mt-2 text-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={() => router.push('/')} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
          Voltar para o Início
        </Button>
        {isDeclined && (
           <p className="text-xs text-muted-foreground mt-4">
            Se o problema persistir, por favor, procure um de nossos atendentes.
          </p>
        )}
         {!isSuccess && !isDeclined && (
          <p className="text-sm text-muted-foreground mt-4">
            Status desconhecido. <Link href="/" className="underline">Tente escanear novamente</Link> ou procure ajuda.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
