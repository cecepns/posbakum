export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me',
  },
  TICKETS: {
    LIST: '/tickets',
    CREATE: '/tickets',
    DETAIL: (id) => `/tickets/${id}`,
    REPLY: (id) => `/tickets/${id}/reply`,
    STATUS: (id) => `/tickets/${id}/status`,
    TRACK: (num) => `/tickets/track/${num}`,
  },
  KNOWLEDGE_BASE: {
    LIST: '/knowledge-base',
    DETAIL: (id) => `/knowledge-base/${id}`,
    CREATE: '/knowledge-base',
    UPDATE: (id) => `/knowledge-base/${id}`,
    DELETE: (id) => `/knowledge-base/${id}`,
  },
  FEEDBACK: { CREATE: '/feedback' },
  DOCUMENTS: {
    LIST: '/documents',
    CREATE: '/documents',
    UPDATE: (id) => `/documents/${id}`,
  },
  OBH: {
    LIST: '/obh',
    CREATE: '/obh',
    UPDATE: (id) => `/obh/${id}`,
    DELETE: (id) => `/obh/${id}`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    READ_ALL: '/notifications/read-all',
    READ: (id) => `/notifications/${id}/read`,
  },
  ANALYTICS: { DASHBOARD: '/analytics/dashboard' },
  USERS: { LIST: '/users' },
};
