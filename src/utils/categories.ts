// SnapAV Product Categories
export const SNAPAV_CATEGORIES = [
  "Control4",
  "Audio",
  "Bulk Wire & Connectors",
  "Cables",
  "Conferencing",
  "Control",
  "Lighting",
  "Media Distribution",
  "Mounts",
  "Networking",
  "Power",
  "Projectors & Screens",
  "Racks",
  "Smart Security & Access",
  "Speakers",
  "Surveillance",
  "Televisions",
  "Tools & Hardware",
  "Other"
];

// Helper to match imported categories to SnapAV categories
export const matchCategory = (input: string): string => {
  const normalized = input.toLowerCase().trim();

  // Exact matches (case insensitive)
  const exactMatch = SNAPAV_CATEGORIES.find(
    (cat) => cat.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch;

  // Partial matches
  if (normalized.includes("control4")) return "Control4";
  if (normalized.includes("audio") || normalized.includes("speaker") || normalized.includes("amplifier")) return "Audio";
  if (normalized.includes("wire") || normalized.includes("connector") || normalized.includes("bulk")) return "Bulk Wire & Connectors";
  if (normalized.includes("cable") || normalized.includes("hdmi") || normalized.includes("ethernet")) return "Cables";
  if (normalized.includes("conferenc") || normalized.includes("meeting")) return "Conferencing";
  if (normalized.includes("control") || normalized.includes("remote") || normalized.includes("keypad")) return "Control";
  if (normalized.includes("light") || normalized.includes("dimmer") || normalized.includes("switch")) return "Lighting";
  if (normalized.includes("media") || normalized.includes("matrix") || normalized.includes("extender") || normalized.includes("distribution")) return "Media Distribution";
  if (normalized.includes("mount") || normalized.includes("bracket")) return "Mounts";
  if (normalized.includes("network") || normalized.includes("router") || normalized.includes("switch") || normalized.includes("wifi")) return "Networking";
  if (normalized.includes("power") || normalized.includes("ups") || normalized.includes("surge") || normalized.includes("outlet")) return "Power";
  if (normalized.includes("projector") || normalized.includes("screen")) return "Projectors & Screens";
  if (normalized.includes("rack") || normalized.includes("cabinet")) return "Racks";
  if (normalized.includes("security") || normalized.includes("access") || normalized.includes("lock") || normalized.includes("thermostat")) return "Smart Security & Access";
  if (normalized.includes("speaker")) return "Speakers";
  if (normalized.includes("surveillance") || normalized.includes("camera") || normalized.includes("nvr") || normalized.includes("dvr")) return "Surveillance";
  if (normalized.includes("tv") || normalized.includes("television") || normalized.includes("display")) return "Televisions";
  if (normalized.includes("tool") || normalized.includes("hardware") || normalized.includes("tester")) return "Tools & Hardware";

  return "Other";
};
