// src/ai/flows/smart-check-in-restrictions.ts
'use server';
/**
 * @fileOverview Implements smart check-in restrictions using AI to prevent abuse.
 *
 * - smartCheckInRestrictions - A function that determines whether a check-in should be allowed based on contextual factors.
 * - SmartCheckInRestrictionsInput - The input type for the smartCheckInRestrictions function.
 * - SmartCheckInRestrictionsOutput - The return type for the smartCheckInRestrictions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartCheckInRestrictionsInputSchema = z.object({
  deviceId: z.string().describe('The device ID attempting the check-in.'),
  userId: z.string().describe('The user ID attempting the check-in.'),
  timestamp: z.number().describe('The timestamp of the check-in attempt (in milliseconds since epoch).'),
  gymId: z.string().describe('The gym ID where the check-in is attempted.'),
});
export type SmartCheckInRestrictionsInput = z.infer<typeof SmartCheckInRestrictionsInputSchema>;

const SmartCheckInRestrictionsOutputSchema = z.object({
  allowed: z.boolean().describe('Whether the check-in should be allowed based on the contextual factors.'),
  reason: z.string().optional().describe('The reason for allowing or disallowing the check-in, if applicable.'),
});
export type SmartCheckInRestrictionsOutput = z.infer<typeof SmartCheckInRestrictionsOutputSchema>;

export async function smartCheckInRestrictions(input: SmartCheckInRestrictionsInput): Promise<SmartCheckInRestrictionsOutput> {
  return smartCheckInRestrictionsFlow(input);
}

const smartCheckInRestrictionsPrompt = ai.definePrompt({
  name: 'smartCheckInRestrictionsPrompt',
  input: {schema: SmartCheckInRestrictionsInputSchema},
  output: {schema: SmartCheckInRestrictionsOutputSchema},
  prompt: `You are an AI assistant designed to evaluate check-in requests and determine if they should be allowed based on contextual information to prevent abuse and fraud.

  Consider the following factors:
  - Device ID: {{{deviceId}}}
  - User ID: {{{userId}}}
  - Timestamp: {{{timestamp}}}
  - Gym ID: {{{gymId}}}

  Analyze the provided data and determine if the check-in should be allowed. Implement restrictions such as limiting the number of check-ins from the same device within a short period.

  Return a JSON object indicating whether the check-in is allowed (\"allowed\": true/false) and provide a brief reason if the check-in is disallowed (\"reason\": \"...")
  `,
});

const smartCheckInRestrictionsFlow = ai.defineFlow(
  {
    name: 'smartCheckInRestrictionsFlow',
    inputSchema: SmartCheckInRestrictionsInputSchema,
    outputSchema: SmartCheckInRestrictionsOutputSchema,
  },
  async input => {
    const {output} = await smartCheckInRestrictionsPrompt(input);
    return output!;
  }
);
