export type NotifyChannel = {
  id: string;
  name: string;
  kind?: "dingtalk" | "feishu" | "email" | string;
  connected?: boolean;
  hint?: string;
  last_test_status?: string | null;
  last_test_at?: string;
};

export type NotifyRule = {
  ruleId: string;
  name: string;
  enabled: boolean;
  triggerType: "manual" | "schedule" | "event" | string;
  scheduleCron?: string | null;
  condition?: Record<string, unknown>;
  templateId?: string | null;
  channelIds: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type NotifyTemplate = {
  templateId: string;
  name: string;
  channelType: "dingtalk" | "feishu" | "email" | string;
  subject?: string | null;
  bodyMarkdown: string;
  version: number;
};

export type NotifyDelivery = {
  deliveryId: string;
  ruleId?: string | null;
  channelId: string;
  status: "pending" | "sent" | "failed" | "blocked" | string;
  dryRun: boolean;
  payloadPreview: string;
  errorCode?: string | null;
  traceId: string;
  createdAt: string;
};
