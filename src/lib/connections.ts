import { ServiceDefinition } from "./types";

// Service definitions — what shows on the Vault page
// These define what CAN be connected (not what IS connected)
export const AVAILABLE_SERVICES: ServiceDefinition[] = [
  {
    connection: "google-oauth2",
    displayName: "Google",
    description:
      "Connect Google to access Business Profile, Search Console, and Analytics. One connection, three services.",
    icon: "google",
    services: [
      {
        name: "Google Business Profile",
        description: "Read and update your business listing, hours, description, and categories",
        scopes: [
          {
            id: "business.manage",
            name: "Manage Business Profile",
            description: "Read and update your business information",
            riskLevel: "high",
            granted: false,
          },
        ],
      },
      {
        name: "Google Search Console",
        description: "Check indexing status, search performance, and sitemap submission",
        scopes: [
          {
            id: "webmasters.readonly",
            name: "Read Search Console",
            description: "View search performance and indexing data",
            riskLevel: "low",
            granted: false,
          },
        ],
      },
      {
        name: "Google Analytics",
        description: "Pull traffic data, user behavior, and conversion metrics",
        scopes: [
          {
            id: "analytics.readonly",
            name: "Read Analytics",
            description: "View website traffic and analytics data",
            riskLevel: "low",
            granted: false,
          },
        ],
      },
    ],
  },
  {
    connection: "wordpress",
    displayName: "WordPress",
    description:
      "Connect your WordPress site to update schema markup, fix content issues, and manage pages.",
    icon: "wordpress",
    services: [
      {
        name: "WordPress CMS",
        description: "Read and update posts, pages, and site settings",
        scopes: [
          {
            id: "posts.read",
            name: "Read Posts & Pages",
            description: "View your site content and structure",
            riskLevel: "low",
            granted: false,
          },
          {
            id: "posts.write",
            name: "Update Posts & Pages",
            description: "Modify content, add schema markup, fix metadata",
            riskLevel: "medium",
            granted: false,
          },
        ],
      },
    ],
  },
  {
    connection: "linkedin",
    displayName: "LinkedIn",
    description:
      "Connect LinkedIn to audit your company page presence and profile completeness.",
    icon: "linkedin",
    services: [
      {
        name: "LinkedIn Profile",
        description: "Read profile and company page information",
        scopes: [
          {
            id: "profile.read",
            name: "Read Profile",
            description: "View your profile and company page data",
            riskLevel: "low",
            granted: false,
          },
        ],
      },
    ],
  },
];

// Icon components for each service
export function getServiceIcon(icon: string): string {
  switch (icon) {
    case "google":
      return "🔍";
    case "wordpress":
      return "📝";
    case "linkedin":
      return "💼";
    default:
      return "🔗";
  }
}

// Status display config
export const STATUS_CONFIG = {
  active: {
    label: "Connected",
    color: "bg-green/10 text-green",
    dot: "bg-green",
  },
  expired: {
    label: "Expired",
    color: "bg-amber/10 text-amber",
    dot: "bg-amber",
  },
  revoked: {
    label: "Revoked",
    color: "bg-red/10 text-red",
    dot: "bg-red",
  },
  not_connected: {
    label: "Not Connected",
    color: "bg-warm-gray/10 text-warm-gray",
    dot: "bg-warm-gray",
  },
};
