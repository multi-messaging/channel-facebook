export class WebhookVerifyDto {
  readonly mode: string;
  readonly challenge: string;
  readonly verifyToken: string;
}
