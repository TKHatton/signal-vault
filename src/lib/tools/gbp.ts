/**
 * Google Business Profile Tools
 *
 * These tools use Token Vault tokens to read and modify
 * a client's Google Business Profile. Each function:
 * 1. Takes an access token from Token Vault
 * 2. Calls the Google My Business API
 * 3. Returns structured results for the pipeline
 *
 * NOTE: Google My Business API v4 is deprecated.
 * The new API is "Google Business Profile API" (mybusinessbusinessinformation.googleapis.com)
 * and "My Business Account Management API" (mybusinessaccountmanagement.googleapis.com).
 */

const GBP_API_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const ACCOUNT_API_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";

export interface GBPLocation {
  name: string; // e.g., "locations/123456"
  title: string; // Business name
  phoneNumbers?: { primaryPhone?: string };
  regularHours?: {
    periods: Array<{
      openDay: string;
      openTime: { hours: number; minutes: number };
      closeDay: string;
      closeTime: { hours: number; minutes: number };
    }>;
  };
  profile?: {
    description: string;
  };
  categories?: {
    primaryCategory?: { displayName: string; name: string };
    additionalCategories?: Array<{ displayName: string; name: string }>;
  };
  websiteUri?: string;
  storefrontAddress?: {
    addressLines: string[];
    locality: string;
    administrativeArea: string;
    postalCode: string;
  };
}

export interface GBPAccount {
  name: string; // e.g., "accounts/123456"
  accountName: string;
  type: string;
}

/**
 * List all GBP accounts for the authenticated user.
 */
export async function listAccounts(
  accessToken: string
): Promise<GBPAccount[]> {
  const res = await fetch(`${ACCOUNT_API_BASE}/accounts`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP listAccounts failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.accounts || [];
}

/**
 * List all locations for a GBP account.
 */
export async function listLocations(
  accessToken: string,
  accountName: string
): Promise<GBPLocation[]> {
  const res = await fetch(
    `${GBP_API_BASE}/${accountName}/locations?readMask=name,title,phoneNumbers,regularHours,profile,categories,websiteUri,storefrontAddress`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP listLocations failed (${res.status}): ${error}`);
  }

  const data = await res.json();
  return data.locations || [];
}

/**
 * Get a specific location's details.
 */
export async function getLocation(
  accessToken: string,
  locationName: string
): Promise<GBPLocation> {
  const res = await fetch(
    `${GBP_API_BASE}/${locationName}?readMask=name,title,phoneNumbers,regularHours,profile,categories,websiteUri,storefrontAddress`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP getLocation failed (${res.status}): ${error}`);
  }

  return await res.json();
}

/**
 * Update a location's fields (e.g., hours, description, categories).
 *
 * @param updateMask - Comma-separated field names to update (e.g., "regularHours,profile")
 * @param updates - Partial location object with the fields to update
 */
export async function updateLocation(
  accessToken: string,
  locationName: string,
  updateMask: string,
  updates: Partial<GBPLocation>
): Promise<GBPLocation> {
  const res = await fetch(
    `${GBP_API_BASE}/${locationName}?updateMask=${updateMask}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GBP updateLocation failed (${res.status}): ${error}`);
  }

  return await res.json();
}

/**
 * Update business hours for a location.
 */
export async function updateBusinessHours(
  accessToken: string,
  locationName: string,
  periods: GBPLocation["regularHours"]
): Promise<GBPLocation> {
  return updateLocation(accessToken, locationName, "regularHours", {
    regularHours: periods,
  });
}

/**
 * Update business description for a location.
 */
export async function updateDescription(
  accessToken: string,
  locationName: string,
  description: string
): Promise<GBPLocation> {
  return updateLocation(accessToken, locationName, "profile", {
    profile: { description },
  });
}

/**
 * Read the current state of a GBP listing.
 * Returns a human-readable summary for the agent pipeline.
 */
export async function auditLocation(
  accessToken: string,
  locationName: string
): Promise<{
  location: GBPLocation;
  issues: string[];
  summary: string;
}> {
  const location = await getLocation(accessToken, locationName);
  const issues: string[] = [];

  // Check for common issues
  if (!location.profile?.description) {
    issues.push("Missing business description");
  } else if (location.profile.description.length < 100) {
    issues.push("Business description is too short (< 100 characters)");
  }

  if (!location.regularHours || location.regularHours.periods.length === 0) {
    issues.push("No business hours set");
  }

  if (!location.categories?.primaryCategory) {
    issues.push("No primary category set");
  }

  if (
    !location.categories?.additionalCategories ||
    location.categories.additionalCategories.length === 0
  ) {
    issues.push("No additional categories (recommend adding 2-3)");
  }

  if (!location.websiteUri) {
    issues.push("No website URL set");
  }

  const summary = [
    `Business: ${location.title}`,
    `Description: ${location.profile?.description || "(empty)"}`,
    `Hours: ${location.regularHours ? `${location.regularHours.periods.length} periods set` : "(not set)"}`,
    `Primary Category: ${location.categories?.primaryCategory?.displayName || "(not set)"}`,
    `Additional Categories: ${location.categories?.additionalCategories?.map((c) => c.displayName).join(", ") || "(none)"}`,
    `Website: ${location.websiteUri || "(not set)"}`,
    "",
    `Issues found: ${issues.length}`,
    ...issues.map((i) => `  - ${i}`),
  ].join("\n");

  return { location, issues, summary };
}
