import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookChannel } from './webhook';
import { ChannelType } from '../types';

// Mock fetch
global.fetch = vi.fn();

describe('WebhookChannel SSRF Protection', () => {
  let webhookChannel: WebhookChannel;

  beforeEach(() => {
    webhookChannel = new WebhookChannel();
    vi.clearAllMocks();
  });

  const mockNotification = {
    subject: 'Test Subject',
    text: 'Test Text',
    html: '<p>Test Text</p>',
    payload: {
      type: 'test',
      organizationId: 'org-1',
      severity: 'info'
    }
  };

  const mockRecipients = [
    { email: 'test@example.com', name: 'Test User' }
  ];

  it('should allow public URLs', async () => {
    const config = { url: 'https://hooks.slack.com/services/XXX/YYY/ZZZ' };
    (global.fetch as any).mockResolvedValue({ ok: true });

    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(config.url, expect.any(Object));
  });

  it('should block localhost', async () => {
    const config = { url: 'http://localhost:8080/webhook' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should block 127.0.0.1', async () => {
    const config = { url: 'http://127.0.0.1/webhook' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });

  it('should block private IP ranges (10.x.x.x)', async () => {
    const config = { url: 'http://10.0.0.1/webhook' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });

  it('should block private IP ranges (192.168.x.x)', async () => {
    const config = { url: 'http://192.168.1.1/webhook' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });

  it('should block AWS metadata endpoint', async () => {
    const config = { url: 'http://169.254.169.254/latest/meta-data/' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });

  it('should block Google Cloud metadata endpoint', async () => {
    const config = { url: 'http://metadata.google.internal/computeMetadata/v1/' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });

  it('should block .local domains', async () => {
    const config = { url: 'http://myserver.local/webhook' };
    
    const result = await webhookChannel.send(mockNotification as any, mockRecipients as any, config);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Internal URLs are not allowed');
  });
});
