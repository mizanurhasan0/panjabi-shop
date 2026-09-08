import { validationMessages } from "./validation";
import { sharedMessages } from "./shared";
import { dashboardMessages } from "./dashboard";
import { settingsMessages } from "./settings";
import { orderMessages } from "./orders";
import { productMessages } from "./products";
import { commonMessages } from "./common";

export const messages: Record<string, string> = {
  ...validationMessages,
  ...commonMessages,
  ...sharedMessages,
  ...dashboardMessages,
  ...settingsMessages,
  ...orderMessages,
  ...productMessages,
};
