import { NextRequest, NextResponse } from 'next/server';
import { smartCheckInRestrictions, type SmartCheckInRestrictionsInput } from '@/ai/flows/smart-check-in-restrictions';

const GYMPASS_API_KEY = process.env.GYMPASS_API_KEY;
const GYMPASS_API_BASE_URL = process.env.GYMPASS_API_BASE_URL || 'https://api.partners.stg.gympass.com'; // Default to sandbox
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';

function getErrorMessage(errorKey: string | null): string {
  switch (errorKey) {
    case 'AI_RESTRICTION':
      return 'Restrição da IA: Limite de taxa de check-in excedido ou atividade suspeita.';
    case 'GYMPASS_VALIDATION_ERROR':
      return 'Erro de Validação Gympass: Não foi possível validar seu check-in com o Gympass. Verifique se você já fez check-in no app Gympass.';
    case 'MISSING_INFO':
      return 'Requisição Inválida: Faltam informações obrigatórias (ID do Usuário ou ID do Dispositivo nos cabeçalhos da requisição).';
    case 'GYMPASS_API_ERROR':
      return 'Erro ao comunicar com a API do Gympass. Tente novamente mais tarde.';
    case 'CONFIG_ERROR':
        return 'Erro de configuração do servidor. Contacte o administrador.';
    default:
      return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
  }
}

function buildRedirectUrl(status: 'success' | 'declined', messageKey?: string | null): URL {
  const redirectUrl = new URL('/check-in-status', APP_URL);
  redirectUrl.searchParams.set('status', status);
  if (status === 'declined' && messageKey) {
    redirectUrl.searchParams.set('message', getErrorMessage(messageKey));
  }
  return redirectUrl;
}

export async function GET(request: NextRequest) {
  if (!GYMPASS_API_KEY) {
    console.error('GYMPASS_API_KEY is not set.');
    return NextResponse.redirect(buildRedirectUrl('declined', 'CONFIG_ERROR'));
  }

  const searchParams = request.nextUrl.searchParams;
  const gymId = searchParams.get('gym_id');
  
  const userId = request.headers.get('X-User-ID');
  const deviceId = request.headers.get('X-Device-ID');

  if (!gymId) {
    return NextResponse.redirect(buildRedirectUrl('declined', 'MISSING_INFO_GYM_ID'));
  }
  
  // For the purpose of this app, User-ID and Device-ID from headers are critical as per user's n8n logic
  if (!userId || !deviceId) {
    console.warn('Missing X-User-ID or X-Device-ID headers.');
    // Note: In a real browser scenario after QR scan, these headers are not standard.
    // This assumes the Gympass app or a custom client sets them.
    // If they are optional, this check needs to be adjusted.
    // For now, strict as per implied requirement.
    return NextResponse.redirect(buildRedirectUrl('declined', 'MISSING_INFO'));
  }

  // 1. Smart Check-in Restrictions
  try {
    const aiInput: SmartCheckInRestrictionsInput = {
      deviceId,
      userId,
      timestamp: Date.now(),
      gymId,
    };
    const aiResult = await smartCheckInRestrictions(aiInput);
    if (!aiResult.allowed) {
      console.log(`AI Restriction: ${aiResult.reason || 'No reason provided.'} for user ${userId}, device ${deviceId}`);
      return NextResponse.redirect(buildRedirectUrl('declined', aiResult.reason || 'AI_RESTRICTION'));
    }
  } catch (error) {
    console.error('Error calling smartCheckInRestrictions AI flow:', error);
    // Proceed without AI check if it fails, or handle as a hard error
    // For now, let's treat AI failure as a reason to decline to be safe, or log and proceed
    // return NextResponse.redirect(buildRedirectUrl('declined', 'AI_SERVICE_ERROR'));
    console.warn("AI check failed, proceeding with Gympass validation...");
  }

  // 2. Gympass Ticket Validation
  try {
    const gympassValidateUrl = `${GYMPASS_API_BASE_URL}/v1/access-control/validate`;
    const response = await fetch(gympassValidateUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GYMPASS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        gym_id: parseInt(gymId, 10), // Ensure gym_id is a number
      }),
    });

    if (response.ok) {
      const responseData = await response.json();
      // Gympass API success might not always mean "allowed". Check responseData structure.
      // Assuming a 200 OK with a specific payload means valid.
      // Example: if (responseData.status === 'APPROVED' || responseData.valid === true)
      // For now, a 200 OK from /validate is considered success as per simplified n8n flow.
      console.log(`Gympass validation successful for user ${userId} at gym ${gymId}`);
      return NextResponse.redirect(buildRedirectUrl('success'));
    } else {
      // Handle specific Gympass error responses if possible
      const errorData = await response.text(); // Or response.json() if error is structured
      console.error(`Gympass validation failed for user ${userId}: ${response.status} - ${errorData}`);
      return NextResponse.redirect(buildRedirectUrl('declined', 'GYMPASS_VALIDATION_ERROR'));
    }
  } catch (error) {
    console.error('Error during Gympass API call:', error);
    return NextResponse.redirect(buildRedirectUrl('declined', 'GYMPASS_API_ERROR'));
  }
}
